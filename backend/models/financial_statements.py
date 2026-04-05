"""
FinAnalytica — Pydantic Data Models
Core financial statement models with validation.
Source: CFA Institute, Damodaran methodology
"""

from pydantic import BaseModel, Field
from typing import Optional


class IncomeStatement(BaseModel):
    year: int
    revenue: float = Field(..., description="Total Revenue / Net Sales")
    cost_of_goods_sold: float = Field(..., description="COGS")
    gross_profit: float
    operating_expenses: float = Field(..., description="SG&A + R&D")
    ebit: float = Field(..., description="Operating Income")
    interest_expense: float
    ebt: float = Field(..., description="Earnings Before Tax")
    tax_expense: float
    net_income: float
    depreciation_amortization: float
    shares_outstanding: float


class BalanceSheet(BaseModel):
    year: int
    cash_and_equivalents: float
    total_current_assets: float
    total_assets: float
    total_current_liabilities: float
    total_debt: float = Field(..., description="Short + Long-term debt")
    total_liabilities: float
    shareholders_equity: float
    inventory: Optional[float] = 0
    accounts_receivable: Optional[float] = 0


class CashFlowStatement(BaseModel):
    year: int
    operating_cash_flow: float = Field(..., description="CFO")
    capital_expenditure: float = Field(..., description="CapEx (typically negative)")
    free_cash_flow: float = Field(..., description="FCF = CFO + CapEx")
    investing_cash_flow: float
    financing_cash_flow: float


class FinancialStatements(BaseModel):
    ticker: str
    company_name: str
    sector: str = ""
    industry: str = ""
    currency: str = "INR"
    current_price: float = 0
    shares_outstanding: float = 0
    market_cap: float = 0
    country: str = ""
    city: str = ""
    website: str = ""
    logo_url: str = ""
    income_statements: list[IncomeStatement]
    balance_sheets: list[BalanceSheet]
    cash_flow_statements: list[CashFlowStatement]
