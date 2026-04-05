"""
FinAnalytica — Analysis Result Models
Dataclass-style result models for ratios, DCF, and full analysis.
"""

from pydantic import BaseModel
from typing import Optional


class RatioResult(BaseModel):
    year: int
    # Profitability
    gross_margin: Optional[float] = None
    net_margin: Optional[float] = None
    ebitda_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    roe: Optional[float] = None
    roa: Optional[float] = None
    roce: Optional[float] = None
    eps: Optional[float] = None
    # Leverage
    debt_to_equity: Optional[float] = None
    debt_to_assets: Optional[float] = None
    interest_coverage: Optional[float] = None
    debt_to_ebitda: Optional[float] = None
    equity_multiplier: Optional[float] = None
    # Liquidity
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None
    cash_ratio: Optional[float] = None
    # Efficiency
    asset_turnover: Optional[float] = None
    inventory_turnover: Optional[float] = None
    days_inventory: Optional[float] = None
    days_sales_outstanding: Optional[float] = None
    # Growth
    revenue_growth: Optional[float] = None
    net_income_growth: Optional[float] = None
    eps_growth: Optional[float] = None
    ebit_growth: Optional[float] = None
    fcf_growth: Optional[float] = None
    # CAGR
    revenue_cagr_3y: Optional[float] = None
    revenue_cagr_5y: Optional[float] = None
    net_income_cagr_3y: Optional[float] = None
    net_income_cagr_5y: Optional[float] = None
    # Valuation
    pe: Optional[float] = None
    pb: Optional[float] = None
    ev_to_ebitda: Optional[float] = None
    fcf_yield: Optional[float] = None
    # Flags
    flags: dict = {}
    # Raw data
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    ebit_val: Optional[float] = None
    total_debt: Optional[float] = None
    total_equity: Optional[float] = None
    free_cash_flow: Optional[float] = None


class DuPontResult(BaseModel):
    year: int
    net_profit_margin: float
    asset_turnover: float
    equity_multiplier: float
    roe: float
    decomposition: str = ""


class WACCResult(BaseModel):
    cost_of_equity: float
    cost_of_debt: float
    wacc: float
    equity_weight: float
    debt_weight: float


class DCFProjectedFCF(BaseModel):
    year: int
    phase: int
    fcf: float
    growth_rate: float
    discount_factor: float
    pv_fcf: float


class IntrinsicValue(BaseModel):
    wacc: float
    terminal_growth_rate: float
    projected_fcfs: list[DCFProjectedFCF]
    sum_pv_fcfs: float
    terminal_value: float
    pv_terminal_value: float
    enterprise_value: float
    net_debt: float
    equity_value: float
    shares_outstanding: float
    intrinsic_per_share: float
    margin_of_safety_15: float
    margin_of_safety_30: float
    pv_fcfs_percent: float
    pv_tv_percent: float
    tv_method: str = "gordon"


class SensitivityCell(BaseModel):
    wacc: float
    growth: float
    intrinsic_value: Optional[float] = None


class FullAnalysisResult(BaseModel):
    ticker: str
    company_name: str
    sector: str = ""
    currency: str = "INR"
    current_price: float = 0
    market_cap: float = 0
    shares_outstanding: float = 0
    ratios: list[RatioResult]
    dupont: list[DuPontResult]
    valuation: Optional[IntrinsicValue] = None
    wacc_details: Optional[WACCResult] = None
    sensitivity: list[SensitivityCell] = []
    income_statements: list = []
    balance_sheets: list = []
    cash_flow_statements: list = []
