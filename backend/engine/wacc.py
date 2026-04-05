"""
FinAnalytica — WACC Computation
CAPM cost of equity + Weighted Average Cost of Capital
Source: Damodaran, CFA Institute
"""


def capm_cost_of_equity(risk_free_rate: float, beta: float, equity_risk_premium: float) -> float:
    """Ke = Rf + β × ERP"""
    return risk_free_rate + beta * equity_risk_premium


def compute_wacc(market_cap: float, total_debt: float,
                 cost_of_equity: float, cost_of_debt: float, tax_rate: float) -> float:
    """WACC = (E/V × Ke) + (D/V × Kd × (1 - t))"""
    v = market_cap + total_debt
    if v == 0:
        return float("nan")
    return (market_cap / v * cost_of_equity) + (total_debt / v * cost_of_debt * (1 - tax_rate))


def compute_full_wacc(market_cap: float, total_debt: float,
                      risk_free_rate: float, beta: float,
                      equity_risk_premium: float, cost_of_debt_pretax: float,
                      tax_rate: float) -> dict:
    ke = capm_cost_of_equity(risk_free_rate, beta, equity_risk_premium)
    wacc = compute_wacc(market_cap, total_debt, ke, cost_of_debt_pretax, tax_rate)
    v = market_cap + total_debt
    return {
        "cost_of_equity": ke,
        "cost_of_debt": cost_of_debt_pretax * (1 - tax_rate),
        "wacc": wacc,
        "equity_weight": market_cap / v if v else 0,
        "debt_weight": total_debt / v if v else 0,
    }
