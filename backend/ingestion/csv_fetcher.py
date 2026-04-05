"""
FinAnalytica — CSV Fetcher & Normalizer
Parses uploaded CSV files with auto column mapping.
"""

import pandas as pd
import io
from ..models.financial_statements import (
    IncomeStatement, BalanceSheet, CashFlowStatement,
)

# Column alias mapping
COLUMN_ALIASES = {
    "revenue": ["revenue", "total revenue", "net sales", "sales", "turnover"],
    "cost_of_goods_sold": ["cost of goods sold", "cogs", "cost of revenue", "cost of sales"],
    "gross_profit": ["gross profit"],
    "operating_expenses": ["operating expenses", "opex", "sg&a", "total operating expenses"],
    "ebit": ["ebit", "operating income", "operating profit"],
    "interest_expense": ["interest expense", "interest", "finance costs"],
    "ebt": ["ebt", "earnings before tax", "profit before tax", "pbt"],
    "tax_expense": ["tax expense", "income tax", "tax", "provision for tax"],
    "net_income": ["net income", "net profit", "pat", "profit after tax"],
    "depreciation_amortization": ["depreciation", "depreciation and amortization", "d&a"],
    "shares_outstanding": ["shares outstanding", "shares", "equity shares"],
    "cash_and_equivalents": ["cash", "cash and equivalents", "cash and cash equivalents"],
    "total_current_assets": ["total current assets", "current assets"],
    "total_assets": ["total assets"],
    "total_current_liabilities": ["total current liabilities", "current liabilities"],
    "total_debt": ["total debt", "total borrowings", "borrowings"],
    "total_liabilities": ["total liabilities"],
    "shareholders_equity": ["shareholders equity", "equity", "total equity", "net worth"],
    "inventory": ["inventory", "inventories"],
    "accounts_receivable": ["accounts receivable", "receivables", "trade receivables"],
    "operating_cash_flow": ["operating cash flow", "cfo", "cash from operations"],
    "capital_expenditure": ["capital expenditure", "capex"],
    "free_cash_flow": ["free cash flow", "fcf"],
    "investing_cash_flow": ["investing cash flow", "cash from investing"],
    "financing_cash_flow": ["financing cash flow", "cash from financing"],
}


def _normalize_header(header: str) -> str:
    return header.strip().lower().replace("_", " ").replace("-", " ").replace(".", " ")


def _map_columns(df: pd.DataFrame) -> dict:
    """Map CSV columns to standard field names."""
    mapping = {}
    for col in df.columns:
        norm = _normalize_header(col)
        if norm in ("year", "fy", "fiscal year", "period"):
            mapping[col] = "year"
            continue
        for field, aliases in COLUMN_ALIASES.items():
            if norm in aliases or norm == field.replace("_", " "):
                mapping[col] = field
                break
    return mapping


def parse_csv_to_income_statements(content: bytes) -> list[IncomeStatement]:
    df = pd.read_csv(io.BytesIO(content))
    col_map = _map_columns(df)
    df = df.rename(columns=col_map)
    stmts = []
    for _, row in df.iterrows():
        stmts.append(IncomeStatement(
            year=int(row.get("year", 0)),
            revenue=float(row.get("revenue", 0)),
            cost_of_goods_sold=float(row.get("cost_of_goods_sold", 0)),
            gross_profit=float(row.get("gross_profit", row.get("revenue", 0) - row.get("cost_of_goods_sold", 0))),
            operating_expenses=float(row.get("operating_expenses", 0)),
            ebit=float(row.get("ebit", 0)),
            interest_expense=float(row.get("interest_expense", 0)),
            ebt=float(row.get("ebt", 0)),
            tax_expense=float(row.get("tax_expense", 0)),
            net_income=float(row.get("net_income", 0)),
            depreciation_amortization=float(row.get("depreciation_amortization", 0)),
            shares_outstanding=float(row.get("shares_outstanding", 100)),
        ))
    return sorted(stmts, key=lambda x: x.year)


def parse_csv_to_balance_sheets(content: bytes) -> list[BalanceSheet]:
    df = pd.read_csv(io.BytesIO(content))
    col_map = _map_columns(df)
    df = df.rename(columns=col_map)
    stmts = []
    for _, row in df.iterrows():
        stmts.append(BalanceSheet(
            year=int(row.get("year", 0)),
            cash_and_equivalents=float(row.get("cash_and_equivalents", 0)),
            total_current_assets=float(row.get("total_current_assets", 0)),
            total_assets=float(row.get("total_assets", 0)),
            total_current_liabilities=float(row.get("total_current_liabilities", 0)),
            total_debt=float(row.get("total_debt", 0)),
            total_liabilities=float(row.get("total_liabilities", 0)),
            shareholders_equity=float(row.get("shareholders_equity", 0)),
            inventory=float(row.get("inventory", 0)),
            accounts_receivable=float(row.get("accounts_receivable", 0)),
        ))
    return sorted(stmts, key=lambda x: x.year)


def parse_csv_to_cashflows(content: bytes) -> list[CashFlowStatement]:
    df = pd.read_csv(io.BytesIO(content))
    col_map = _map_columns(df)
    df = df.rename(columns=col_map)
    stmts = []
    for _, row in df.iterrows():
        cfo = float(row.get("operating_cash_flow", 0))
        capex = float(row.get("capital_expenditure", 0))
        stmts.append(CashFlowStatement(
            year=int(row.get("year", 0)),
            operating_cash_flow=cfo,
            capital_expenditure=capex,
            free_cash_flow=float(row.get("free_cash_flow", cfo + capex)),
            investing_cash_flow=float(row.get("investing_cash_flow", 0)),
            financing_cash_flow=float(row.get("financing_cash_flow", 0)),
        ))
    return sorted(stmts, key=lambda x: x.year)
