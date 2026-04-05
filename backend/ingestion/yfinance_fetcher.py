"""
FinAnalytica — yfinance Data Fetcher
Fetches financial statements for a ticker using yfinance API.
Handles missing data, NaN values, and column mismatches gracefully.
"""

import yfinance as yf
import pandas as pd
import math
from ..models.financial_statements import (
    IncomeStatement, BalanceSheet, CashFlowStatement, FinancialStatements,
)


def _safe(val, default=0.0):
    """Convert pandas/any value to float safely."""
    try:
        if val is None:
            return default
        if isinstance(val, (int, float)):
            if math.isnan(val) or math.isinf(val):
                return default
            return float(val)
        result = float(val)
        if math.isnan(result) or math.isinf(result):
            return default
        return result
    except (ValueError, TypeError):
        return default


def _get_row(df: pd.DataFrame, keys: list[str], default=0.0) -> pd.Series:
    """Get a row from DataFrame trying multiple key names."""
    if df is None or df.empty:
        return pd.Series(dtype=float)
    for key in keys:
        if key in df.index:
            return df.loc[key]
    return pd.Series(dtype=float).reindex(df.columns, fill_value=default)


def _get_val(df, col, keys, default=0.0):
    """Safe helper: get a value from a row matching any of the keys."""
    row = _get_row(df, keys, default)
    try:
        val = row.get(col, default)
    except Exception:
        val = default
    return _safe(val, default)


def fetch_yfinance(ticker: str, years: int = 10) -> FinancialStatements:
    """Fetch financial data from yfinance and map to Pydantic models."""
    stock = yf.Ticker(ticker)
    info = stock.info or {}

    # Get financial statements (annual)
    income = stock.financials
    balance = stock.balance_sheet
    cashflow = stock.cashflow

    if income is None or income.empty:
        raise ValueError(f"No financial data found for ticker '{ticker}'")

    # Sort columns by date ascending
    income = income.sort_index(axis=1)
    if balance is not None and not balance.empty:
        balance = balance.sort_index(axis=1)
    else:
        balance = pd.DataFrame()
    if cashflow is not None and not cashflow.empty:
        cashflow = cashflow.sort_index(axis=1)
    else:
        cashflow = pd.DataFrame()

    # Limit to requested years
    income = income.iloc[:, -years:] if len(income.columns) > years else income

    # Find common years
    income_cols = list(income.columns)
    balance_cols = list(balance.columns) if not balance.empty else income_cols
    cashflow_cols = list(cashflow.columns) if not cashflow.empty else income_cols

    currency = info.get("currency", "")
    is_inr = currency == "INR"
    divisor = 10_000_000 if is_inr else 1
    shares_raw = _safe(info.get("sharesOutstanding", 0))
    shares_div = shares_raw / (10_000_000 if is_inr else 1_000_000)

    income_stmts = []
    balance_stmts = []
    cashflow_stmts = []

    for col in income_cols:
        year = col.year

        rev = _get_val(income, col, ["Total Revenue", "Revenue"])
        cogs = _get_val(income, col, ["Cost Of Revenue", "Cost of Revenue", "Cost Of Goods Sold"])
        gp = rev - cogs
        opex = _get_val(income, col, ["Operating Expense", "Total Operating Expenses", "Selling General And Administration"])
        ebit_val = _get_val(income, col, ["EBIT", "Operating Income"])
        interest = abs(_get_val(income, col, ["Interest Expense", "Interest Expense Non Operating"]))
        ebt_val = _get_val(income, col, ["Pretax Income", "Income Before Tax"])
        tax = _get_val(income, col, ["Tax Provision", "Income Tax Expense"])
        ni = _get_val(income, col, ["Net Income", "Net Income Common Stockholders"])
        da = abs(_get_val(income, col, ["Reconciled Depreciation", "Depreciation And Amortization In Income Statement"]))

        income_stmts.append(IncomeStatement(
            year=year,
            revenue=rev / divisor, cost_of_goods_sold=cogs / divisor,
            gross_profit=gp / divisor, operating_expenses=opex / divisor,
            ebit=ebit_val / divisor, interest_expense=interest / divisor,
            ebt=ebt_val / divisor, tax_expense=tax / divisor,
            net_income=ni / divisor,
            depreciation_amortization=da / divisor,
            shares_outstanding=shares_div,
        ))

        # Balance sheet — find nearest matching column
        bal_col = col if col in balance_cols else None
        if bal_col is None and balance_cols:
            # Find closest date column
            for bc in balance_cols:
                if bc.year == year:
                    bal_col = bc
                    break

        if bal_col is not None and not balance.empty:
            balance_stmts.append(BalanceSheet(
                year=year,
                cash_and_equivalents=_get_val(balance, bal_col, ["Cash And Cash Equivalents", "Cash Cash Equivalents And Short Term Investments"]) / divisor,
                total_current_assets=_get_val(balance, bal_col, ["Current Assets"]) / divisor,
                total_assets=_get_val(balance, bal_col, ["Total Assets"]) / divisor,
                total_current_liabilities=_get_val(balance, bal_col, ["Current Liabilities"]) / divisor,
                total_debt=_get_val(balance, bal_col, ["Total Debt", "Long Term Debt"]) / divisor,
                total_liabilities=_get_val(balance, bal_col, ["Total Liabilities Net Minority Interest", "Total Liabilities"]) / divisor,
                shareholders_equity=_get_val(balance, bal_col, ["Stockholders Equity", "Total Equity Gross Minority Interest", "Stockholders' Equity"]) / divisor,
                inventory=_get_val(balance, bal_col, ["Inventory"]) / divisor,
                accounts_receivable=_get_val(balance, bal_col, ["Accounts Receivable", "Receivables"]) / divisor,
            ))
        else:
            balance_stmts.append(BalanceSheet(
                year=year, cash_and_equivalents=0, total_current_assets=0,
                total_assets=0, total_current_liabilities=0, total_debt=0,
                total_liabilities=0, shareholders_equity=1, inventory=0,
                accounts_receivable=0,
            ))

        # Cash flow
        cf_col = col if col in cashflow_cols else None
        if cf_col is None and cashflow_cols:
            for cc in cashflow_cols:
                if cc.year == year:
                    cf_col = cc
                    break

        if cf_col is not None and not cashflow.empty:
            cfo = _get_val(cashflow, cf_col, ["Operating Cash Flow", "Cash Flow From Continuing Operating Activities"])
            capex = _get_val(cashflow, cf_col, ["Capital Expenditure"])
            fcf = _get_val(cashflow, cf_col, ["Free Cash Flow"], cfo + capex)
            if fcf == 0 and (cfo != 0 or capex != 0):
                fcf = cfo + capex
            inv_cf = _get_val(cashflow, cf_col, ["Investing Activities", "Cash Flow From Continuing Investing Activities"])
            fin_cf = _get_val(cashflow, cf_col, ["Financing Activities", "Cash Flow From Continuing Financing Activities"])
            cashflow_stmts.append(CashFlowStatement(
                year=year,
                operating_cash_flow=cfo / divisor, capital_expenditure=capex / divisor,
                free_cash_flow=fcf / divisor, investing_cash_flow=inv_cf / divisor,
                financing_cash_flow=fin_cf / divisor,
            ))
        else:
            cashflow_stmts.append(CashFlowStatement(
                year=year, operating_cash_flow=0, capital_expenditure=0,
                free_cash_flow=0, investing_cash_flow=0, financing_cash_flow=0,
            ))

    current_price = _safe(info.get("currentPrice", info.get("regularMarketPrice", 0)))
    mkt_cap = _safe(info.get("marketCap", 0))
    mkt_cap_cr = mkt_cap / (10_000_000 if is_inr else 1_000_000)

    # Company info for UI
    website = info.get("website", "")
    domain = website.replace("https://", "").replace("http://", "").split("/")[0] if website else ""
    logo_url = f"https://logo.clearbit.com/{domain}" if domain else ""

    return FinancialStatements(
        ticker=ticker,
        company_name=info.get("longName", info.get("shortName", ticker)),
        sector=info.get("sector", ""),
        industry=info.get("industry", ""),
        currency=currency or "USD",
        current_price=current_price,
        shares_outstanding=shares_div,
        market_cap=mkt_cap_cr,
        country=info.get("country", ""),
        city=info.get("city", ""),
        website=website,
        logo_url=logo_url,
        income_statements=sorted(income_stmts, key=lambda x: x.year),
        balance_sheets=sorted(balance_stmts, key=lambda x: x.year),
        cash_flow_statements=sorted(cashflow_stmts, key=lambda x: x.year),
    )
