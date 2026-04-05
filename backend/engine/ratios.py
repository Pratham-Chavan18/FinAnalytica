"""
FinAnalytica — Financial Ratio Engine
30+ ratios across Profitability, Leverage, Liquidity, Efficiency, Growth.
All functions are pure: typed inputs → float output.
Source: CFA Institute Level 1, Damodaran methodology.
"""

import math
from typing import Optional


# ──────────────── Profitability ────────────────

def gross_margin(revenue: float, cogs: float) -> float:
    """Gross Margin = (Revenue - COGS) / Revenue"""
    if revenue == 0:
        return float("nan")
    return (revenue - cogs) / revenue


def net_margin(net_income: float, revenue: float) -> float:
    """Net Margin = Net Income / Revenue"""
    if revenue == 0:
        return float("nan")
    return net_income / revenue


def ebitda_margin(ebit: float, da: float, revenue: float) -> float:
    """EBITDA Margin = (EBIT + D&A) / Revenue"""
    if revenue == 0:
        return float("nan")
    return (ebit + da) / revenue


def operating_margin(ebit: float, revenue: float) -> float:
    """Operating Margin = EBIT / Revenue"""
    if revenue == 0:
        return float("nan")
    return ebit / revenue


def return_on_equity(net_income: float, avg_equity: float) -> float:
    """ROE = Net Income / Average Shareholders Equity"""
    if avg_equity == 0:
        return float("nan")
    return net_income / avg_equity


def return_on_assets(net_income: float, avg_total_assets: float) -> float:
    """ROA = Net Income / Average Total Assets"""
    if avg_total_assets == 0:
        return float("nan")
    return net_income / avg_total_assets


def roce(ebit: float, total_assets: float, current_liabilities: float) -> float:
    """ROCE = EBIT / Capital Employed; CE = Total Assets - Current Liabilities"""
    capital_employed = total_assets - current_liabilities
    if capital_employed == 0:
        return float("nan")
    return ebit / capital_employed


def earnings_per_share(net_income: float, shares: float) -> float:
    """EPS = Net Income / Shares Outstanding"""
    if shares == 0:
        return float("nan")
    return net_income / shares


# ──────────────── Leverage ────────────────

def debt_to_equity(total_debt: float, equity: float) -> float:
    """D/E = Total Debt / Shareholders Equity"""
    if equity == 0:
        return float("nan")
    return total_debt / equity


def debt_to_assets(total_debt: float, total_assets: float) -> float:
    """Debt/Assets = Total Debt / Total Assets"""
    if total_assets == 0:
        return float("nan")
    return total_debt / total_assets


def interest_coverage(ebit: float, interest_expense: float) -> float:
    """Interest Coverage = EBIT / Interest Expense"""
    if interest_expense == 0:
        return float("nan")
    return ebit / interest_expense


def debt_to_ebitda(total_debt: float, ebit: float, da: float) -> float:
    """Debt/EBITDA = Total Debt / (EBIT + D&A)"""
    ebitda = ebit + da
    if ebitda == 0:
        return float("nan")
    return total_debt / ebitda


def equity_multiplier(total_assets: float, equity: float) -> float:
    """Equity Multiplier = Total Assets / Equity"""
    if equity == 0:
        return float("nan")
    return total_assets / equity


# ──────────────── Liquidity ────────────────

def current_ratio(current_assets: float, current_liabilities: float) -> float:
    """Current Ratio = Current Assets / Current Liabilities"""
    if current_liabilities == 0:
        return float("nan")
    return current_assets / current_liabilities


def quick_ratio(current_assets: float, inventory: float, current_liabilities: float) -> float:
    """Quick Ratio = (CA - Inventory) / CL"""
    if current_liabilities == 0:
        return float("nan")
    return (current_assets - (inventory or 0)) / current_liabilities


def cash_ratio(cash: float, current_liabilities: float) -> float:
    """Cash Ratio = Cash / Current Liabilities"""
    if current_liabilities == 0:
        return float("nan")
    return cash / current_liabilities


# ──────────────── Efficiency ────────────────

def asset_turnover(revenue: float, avg_total_assets: float) -> float:
    """Asset Turnover = Revenue / Avg Total Assets"""
    if avg_total_assets == 0:
        return float("nan")
    return revenue / avg_total_assets


def inventory_turnover(cogs: float, avg_inventory: float) -> float:
    """Inventory Turnover = COGS / Avg Inventory"""
    if avg_inventory == 0:
        return float("nan")
    return cogs / avg_inventory


def days_inventory_outstanding(cogs: float, avg_inventory: float) -> float:
    """DIO = 365 / Inventory Turnover"""
    turns = inventory_turnover(cogs, avg_inventory)
    if math.isnan(turns) or turns == 0:
        return float("nan")
    return 365.0 / turns


def days_sales_outstanding(revenue: float, avg_receivables: float) -> float:
    """DSO = (Avg Receivables / Revenue) × 365"""
    if revenue == 0 or avg_receivables == 0:
        return float("nan")
    return (avg_receivables / revenue) * 365.0


# ──────────────── Growth ────────────────

def yoy_growth(current: float, previous: float) -> Optional[float]:
    """YoY Growth = (Current - Previous) / |Previous|"""
    if previous == 0:
        return None
    return (current - previous) / abs(previous)


def cagr(begin_value: float, end_value: float, years: int) -> Optional[float]:
    """CAGR = (End/Begin)^(1/years) - 1"""
    if begin_value <= 0 or end_value <= 0 or years <= 0:
        return None
    return (end_value / begin_value) ** (1.0 / years) - 1.0


def fcf_yield(fcf: float, market_cap: float) -> float:
    """FCF Yield = FCF / Market Cap"""
    if market_cap == 0:
        return float("nan")
    return fcf / market_cap


# ──────────────── Valuation ────────────────

def price_to_earnings(price: float, eps_val: float) -> Optional[float]:
    """P/E = Price / EPS"""
    if eps_val <= 0:
        return None
    return price / eps_val


def price_to_book(market_cap: float, equity: float) -> Optional[float]:
    """P/B = Market Cap / Equity"""
    if equity <= 0:
        return None
    return market_cap / equity


def ev_to_ebitda(market_cap: float, total_debt: float, cash: float,
                  ebit: float, da: float) -> Optional[float]:
    """EV/EBITDA = (Market Cap + Debt - Cash) / EBITDA"""
    ev = market_cap + total_debt - cash
    ebitda = ebit + da
    if ebitda <= 0:
        return None
    return ev / ebitda


# ──────────────── Threshold Flagging ────────────────

def get_status_flag(value: float, threshold: dict) -> str:
    """Returns 'ok', 'warning', or 'critical' based on threshold config."""
    if value is None or math.isnan(value):
        return "ok"
    direction = threshold.get("direction", "below")
    warning = threshold.get("warning", 0)
    critical = threshold.get("critical", 0)

    if direction == "above":
        if value >= critical:
            return "critical"
        if value >= warning:
            return "warning"
    else:
        if value <= critical:
            return "critical"
        if value <= warning:
            return "warning"
    return "ok"


# ──────────────── Compute All Ratios ────────────────

def compute_all_ratios(
    income_statements: list,
    balance_sheets: list,
    cash_flow_statements: list,
    thresholds: dict = None,
    current_price: float = 0,
    market_cap: float = 0,
) -> list[dict]:
    """Compute all ratios for a company across all years."""
    results = []

    for i in range(len(income_statements)):
        inc = income_statements[i]
        bal = balance_sheets[i]
        cf = cash_flow_statements[i]
        prev_inc = income_statements[i - 1] if i > 0 else None
        prev_bal = balance_sheets[i - 1] if i > 0 else None
        prev_cf = cash_flow_statements[i - 1] if i > 0 else None

        # Average values
        avg_equity = (
            (bal.shareholders_equity + prev_bal.shareholders_equity) / 2
            if prev_bal else bal.shareholders_equity
        )
        avg_assets = (
            (bal.total_assets + prev_bal.total_assets) / 2
            if prev_bal else bal.total_assets
        )
        avg_inventory = (
            ((bal.inventory or 0) + (prev_bal.inventory or 0)) / 2
            if prev_bal else (bal.inventory or 0)
        )
        avg_receivables = (
            ((bal.accounts_receivable or 0) + (prev_bal.accounts_receivable or 0)) / 2
            if prev_bal else (bal.accounts_receivable or 0)
        )

        eps_val = earnings_per_share(inc.net_income, inc.shares_outstanding)

        ratios = {
            "year": inc.year,
            # Profitability
            "gross_margin": gross_margin(inc.revenue, inc.cost_of_goods_sold),
            "net_margin": net_margin(inc.net_income, inc.revenue),
            "ebitda_margin": ebitda_margin(inc.ebit, inc.depreciation_amortization, inc.revenue),
            "operating_margin": operating_margin(inc.ebit, inc.revenue),
            "roe": return_on_equity(inc.net_income, avg_equity),
            "roa": return_on_assets(inc.net_income, avg_assets),
            "roce": roce(inc.ebit, bal.total_assets, bal.total_current_liabilities),
            "eps": eps_val,
            # Leverage
            "debt_to_equity": debt_to_equity(bal.total_debt, bal.shareholders_equity),
            "debt_to_assets": debt_to_assets(bal.total_debt, bal.total_assets),
            "interest_coverage": interest_coverage(inc.ebit, inc.interest_expense),
            "debt_to_ebitda": debt_to_ebitda(bal.total_debt, inc.ebit, inc.depreciation_amortization),
            "equity_multiplier": equity_multiplier(bal.total_assets, bal.shareholders_equity),
            # Liquidity
            "current_ratio": current_ratio(bal.total_current_assets, bal.total_current_liabilities),
            "quick_ratio": quick_ratio(bal.total_current_assets, bal.inventory, bal.total_current_liabilities),
            "cash_ratio": cash_ratio(bal.cash_and_equivalents, bal.total_current_liabilities),
            # Efficiency
            "asset_turnover": asset_turnover(inc.revenue, avg_assets),
            "inventory_turnover": inventory_turnover(inc.cost_of_goods_sold, avg_inventory),
            "days_inventory": days_inventory_outstanding(inc.cost_of_goods_sold, avg_inventory),
            "days_sales_outstanding": days_sales_outstanding(inc.revenue, avg_receivables),
            # Growth
            "revenue_growth": yoy_growth(inc.revenue, prev_inc.revenue) if prev_inc else None,
            "net_income_growth": yoy_growth(inc.net_income, prev_inc.net_income) if prev_inc else None,
            "eps_growth": (
                yoy_growth(eps_val, earnings_per_share(prev_inc.net_income, prev_inc.shares_outstanding))
                if prev_inc else None
            ),
            "ebit_growth": yoy_growth(inc.ebit, prev_inc.ebit) if prev_inc else None,
            "fcf_growth": yoy_growth(cf.free_cash_flow, prev_cf.free_cash_flow) if prev_cf else None,
            # Valuation
            "pe": price_to_earnings(current_price, eps_val) if current_price else None,
            "pb": price_to_book(market_cap, bal.shareholders_equity) if market_cap else None,
            "ev_to_ebitda": (
                ev_to_ebitda(market_cap, bal.total_debt, bal.cash_and_equivalents,
                             inc.ebit, inc.depreciation_amortization)
                if market_cap else None
            ),
            "fcf_yield": fcf_yield(cf.free_cash_flow, market_cap) if market_cap else None,
            # Raw
            "revenue": inc.revenue,
            "net_income": inc.net_income,
            "ebit_val": inc.ebit,
            "total_debt": bal.total_debt,
            "total_equity": bal.shareholders_equity,
            "free_cash_flow": cf.free_cash_flow,
        }

        # Flags
        if thresholds:
            flags = {}
            threshold_key_map = {
                "gross_margin": "gross_margin",
                "net_margin": "net_margin",
                "roe": "roe",
                "roa": "roa",
                "current_ratio": "current_ratio",
                "quick_ratio": "quick_ratio",
                "debt_to_equity": "debt_to_equity",
                "interest_coverage": "interest_coverage",
                "asset_turnover": "asset_turnover",
            }
            for ratio_key, thresh_key in threshold_key_map.items():
                if thresh_key in thresholds and ratios.get(ratio_key) is not None:
                    val = ratios[ratio_key]
                    if not math.isnan(val):
                        flags[ratio_key] = get_status_flag(val, thresholds[thresh_key])
            ratios["flags"] = flags
        else:
            ratios["flags"] = {}

        results.append(ratios)

    # CAGR for latest year
    if len(results) >= 4:
        results[-1]["revenue_cagr_3y"] = cagr(results[-4]["revenue"], results[-1]["revenue"], 3)
        results[-1]["net_income_cagr_3y"] = cagr(results[-4]["net_income"], results[-1]["net_income"], 3)
    if len(results) >= 6:
        results[-1]["revenue_cagr_5y"] = cagr(results[-6]["revenue"], results[-1]["revenue"], 5)
        results[-1]["net_income_cagr_5y"] = cagr(results[-6]["net_income"], results[-1]["net_income"], 5)

    return results
