"""
FinAnalytica — Analysis Router
/api/analyze endpoints for full financial analysis.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import yaml
import os
import math

from ..ingestion.yfinance_fetcher import fetch_yfinance
from ..ingestion.csv_fetcher import (
    parse_csv_to_income_statements,
    parse_csv_to_balance_sheets,
    parse_csv_to_cashflows,
)
from ..engine.ratios import compute_all_ratios
from ..engine.dupont import compute_dupont_all_years
from ..engine.dcf import run_dcf_analysis
from ..engine.sensitivity import generate_sensitivity_matrix
from ..models.financial_statements import FinancialStatements

router = APIRouter(prefix="/api", tags=["analysis"])

# Load default config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "defaults.yaml")
try:
    with open(CONFIG_PATH) as f:
        DEFAULT_CONFIG = yaml.safe_load(f)
except Exception:
    DEFAULT_CONFIG = {}


def _sanitize(obj):
    """Recursively replace NaN / Inf with None so JSON serialization works."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj


def _run_full_analysis(data: FinancialStatements) -> dict:
    """Run complete analysis pipeline on financial data."""
    thresholds = DEFAULT_CONFIG.get("thresholds", {})

    # Compute ratios
    ratios = compute_all_ratios(
        income_statements=data.income_statements,
        balance_sheets=data.balance_sheets,
        cash_flow_statements=data.cash_flow_statements,
        thresholds=thresholds,
        current_price=data.current_price,
        market_cap=data.market_cap,
    )

    # DuPont
    dupont = compute_dupont_all_years(data.income_statements, data.balance_sheets)

    # Prepare data dict for DCF
    latest_bal = data.balance_sheets[-1]
    latest_cf = data.cash_flow_statements[-1]
    dcf_defaults = DEFAULT_CONFIG.get("dcf", {})
    wacc_defaults = DEFAULT_CONFIG.get("wacc", {})

    financial_dict = {
        "market_cap": data.market_cap,
        "shares_outstanding": data.shares_outstanding,
        "balance_sheets": [b.model_dump() for b in data.balance_sheets],
        "cash_flow_statements": [c.model_dump() for c in data.cash_flow_statements],
        "dcf_defaults": {
            "base_fcf": latest_cf.free_cash_flow,
            "phase1_growth_rate": dcf_defaults.get("phase1_growth_rate", 0.14),
            "phase1_years": dcf_defaults.get("phase1_years", 5),
            "phase2_growth_rate": dcf_defaults.get("phase2_growth_rate", 0.09),
            "phase2_years": dcf_defaults.get("phase2_years", 5),
            "terminal_growth_rate": dcf_defaults.get("terminal_growth_rate", 0.04),
            "risk_free_rate": wacc_defaults.get("risk_free_rate", 0.072),
            "beta": wacc_defaults.get("beta", 1.05),
            "equity_risk_premium": wacc_defaults.get("equity_risk_premium", 0.07),
            "cost_of_debt_pretax": wacc_defaults.get("cost_of_debt_pretax", 0.078),
            "tax_rate": wacc_defaults.get("tax_rate", 0.25),
        },
    }

    # DCF
    try:
        dcf_result = run_dcf_analysis(financial_dict)
        wacc_details = dcf_result.pop("wacc_details", {})
        assumptions = dcf_result.pop("assumptions", {})
    except Exception as e:
        dcf_result = None
        wacc_details = {}

    # Sensitivity
    try:
        net_debt = latest_bal.total_debt - latest_bal.cash_and_equivalents
        sensitivity = generate_sensitivity_matrix(
            financial_dict["dcf_defaults"], net_debt, data.shares_outstanding
        )
    except Exception:
        sensitivity = []

    return _sanitize({
        "ticker": data.ticker,
        "company_name": data.company_name,
        "sector": data.sector,
        "industry": data.industry,
        "currency": data.currency,
        "current_price": data.current_price,
        "market_cap": data.market_cap,
        "shares_outstanding": data.shares_outstanding,
        "country": data.country,
        "city": data.city,
        "website": data.website,
        "logo_url": data.logo_url,
        "ratios": ratios,
        "dupont": dupont,
        "valuation": dcf_result,
        "wacc_details": wacc_details,
        "sensitivity": sensitivity,
        "income_statements": [s.model_dump() for s in data.income_statements],
        "balance_sheets": [s.model_dump() for s in data.balance_sheets],
        "cash_flow_statements": [s.model_dump() for s in data.cash_flow_statements],
    })


@router.get("/analyze/{ticker}")
async def analyze_ticker(ticker: str, years: int = 10):
    """Analyze a company by ticker symbol using yfinance."""
    try:
        data = fetch_yfinance(ticker, years)
        result = _run_full_analysis(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/analyze/csv")
async def analyze_csv(
    company_name: str = Form("Custom Company"),
    income_csv: UploadFile = File(...),
    balance_csv: UploadFile = File(...),
    cashflow_csv: UploadFile = File(...),
):
    """Analyze a company from uploaded CSV files."""
    try:
        income_content = await income_csv.read()
        balance_content = await balance_csv.read()
        cashflow_content = await cashflow_csv.read()

        income_stmts = parse_csv_to_income_statements(income_content)
        balance_stmts = parse_csv_to_balance_sheets(balance_content)
        cashflow_stmts = parse_csv_to_cashflows(cashflow_content)

        data = FinancialStatements(
            ticker="CUSTOM",
            company_name=company_name,
            income_statements=income_stmts,
            balance_sheets=balance_stmts,
            cash_flow_statements=cashflow_stmts,
        )
        result = _run_full_analysis(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
