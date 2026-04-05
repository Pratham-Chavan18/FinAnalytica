"""
FinAnalytica — Valuation Router
/api/valuation endpoint for custom DCF assumptions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import math

from ..engine.dcf import run_dcf_analysis
from ..engine.sensitivity import generate_sensitivity_matrix

router = APIRouter(prefix="/api", tags=["valuation"])


def _sanitize(obj):
    """Recursively replace NaN / Inf with None."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    return obj


class ValuationRequest(BaseModel):
    base_fcf: float
    phase1_growth_rate: float = 0.14
    phase1_years: int = 5
    phase2_growth_rate: float = 0.09
    phase2_years: int = 5
    terminal_growth_rate: float = 0.04
    wacc: Optional[float] = None
    risk_free_rate: float = 0.072
    beta: float = 1.05
    equity_risk_premium: float = 0.07
    cost_of_debt_pretax: float = 0.078
    tax_rate: float = 0.25
    market_cap: float = 0
    total_debt: float = 0
    cash_and_equivalents: float = 0
    shares_outstanding: float = 100


@router.post("/valuation")
async def run_valuation(req: ValuationRequest):
    """Run DCF valuation with custom assumptions."""
    try:
        financial_dict = {
            "market_cap": req.market_cap,
            "shares_outstanding": req.shares_outstanding,
            "balance_sheets": [{
                "total_debt": req.total_debt,
                "cash_and_equivalents": req.cash_and_equivalents,
            }],
            "cash_flow_statements": [{
                "free_cash_flow": req.base_fcf,
            }],
            "dcf_defaults": {
                "base_fcf": req.base_fcf,
                "phase1_growth_rate": req.phase1_growth_rate,
                "phase1_years": req.phase1_years,
                "phase2_growth_rate": req.phase2_growth_rate,
                "phase2_years": req.phase2_years,
                "terminal_growth_rate": req.terminal_growth_rate,
                "risk_free_rate": req.risk_free_rate,
                "beta": req.beta,
                "equity_risk_premium": req.equity_risk_premium,
                "cost_of_debt_pretax": req.cost_of_debt_pretax,
                "tax_rate": req.tax_rate,
            },
        }

        if req.wacc is not None:
            financial_dict["dcf_defaults"]["wacc"] = req.wacc

        dcf_result = run_dcf_analysis(financial_dict)
        wacc_details = dcf_result.pop("wacc_details", {})
        dcf_result.pop("assumptions", None)

        # Sensitivity
        net_debt = req.total_debt - req.cash_and_equivalents
        sensitivity = generate_sensitivity_matrix(
            financial_dict["dcf_defaults"], net_debt, req.shares_outstanding
        )

        return _sanitize({
            "valuation": dcf_result,
            "wacc_details": wacc_details,
            "sensitivity": sensitivity,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

