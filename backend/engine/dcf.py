"""
FinAnalytica — DCF Valuation Engine
Two-phase FCF projection with Gordon Growth terminal value.
Matches Design Doc Section 4.3.
"""

from .wacc import compute_full_wacc


class DCFEngine:
    def __init__(self, assumptions: dict):
        self.base_fcf = assumptions["base_fcf"]
        self.phase1_growth = assumptions["phase1_growth_rate"]
        self.phase1_years = assumptions["phase1_years"]
        self.phase2_growth = assumptions["phase2_growth_rate"]
        self.phase2_years = assumptions["phase2_years"]
        self.terminal_growth = assumptions["terminal_growth_rate"]
        self.wacc = assumptions["wacc"]

    def project_fcfs(self) -> list[dict]:
        fcfs = []
        current = self.base_fcf
        for i in range(self.phase1_years):
            current *= 1 + self.phase1_growth
            fcfs.append({"year": i + 1, "phase": 1, "fcf": current, "growth_rate": self.phase1_growth})
        for i in range(self.phase2_years):
            current *= 1 + self.phase2_growth
            fcfs.append({
                "year": self.phase1_years + i + 1, "phase": 2,
                "fcf": current, "growth_rate": self.phase2_growth,
            })
        return fcfs

    def terminal_value_gordon(self, last_fcf: float) -> float:
        """TV = FCF_n × (1+g) / (WACC - g)"""
        if self.wacc <= self.terminal_growth:
            raise ValueError("WACC must exceed terminal growth rate")
        return last_fcf * (1 + self.terminal_growth) / (self.wacc - self.terminal_growth)

    def run(self, net_debt: float, shares: float) -> dict:
        fcfs = self.project_fcfs()
        n = len(fcfs)
        disc = [(1 + self.wacc) ** -(i + 1) for i in range(n)]

        pv_fcfs = []
        for i, f in enumerate(fcfs):
            pv = f["fcf"] * disc[i]
            pv_fcfs.append({**f, "discount_factor": disc[i], "pv_fcf": pv})

        sum_pv = sum(p["pv_fcf"] for p in pv_fcfs)
        tv = self.terminal_value_gordon(fcfs[-1]["fcf"])
        pv_tv = tv * disc[-1]
        ev = sum_pv + pv_tv
        equity_value = ev - net_debt
        intrinsic = equity_value / shares if shares else 0

        return {
            "projected_fcfs": pv_fcfs,
            "sum_pv_fcfs": sum_pv,
            "terminal_value": tv,
            "pv_terminal_value": pv_tv,
            "enterprise_value": ev,
            "net_debt": net_debt,
            "equity_value": equity_value,
            "shares_outstanding": shares,
            "intrinsic_per_share": intrinsic,
            "margin_of_safety_15": intrinsic * 0.85,
            "margin_of_safety_30": intrinsic * 0.70,
            "wacc": self.wacc,
            "terminal_growth_rate": self.terminal_growth,
            "tv_method": "gordon",
            "pv_fcfs_percent": (sum_pv / ev * 100) if ev else 0,
            "pv_tv_percent": (pv_tv / ev * 100) if ev else 0,
        }


def run_dcf_analysis(financial_data: dict, custom_assumptions: dict = None) -> dict:
    """Run complete DCF analysis from financial data + assumptions."""
    defaults = financial_data.get("dcf_defaults", {})
    assumptions = {**defaults, **custom_assumptions} if custom_assumptions else defaults

    bal = financial_data["balance_sheets"][-1]
    wacc_result = compute_full_wacc(
        market_cap=financial_data.get("market_cap", 0),
        total_debt=bal["total_debt"],
        risk_free_rate=assumptions.get("risk_free_rate", 0.072),
        beta=assumptions.get("beta", 1.05),
        equity_risk_premium=assumptions.get("equity_risk_premium", 0.07),
        cost_of_debt_pretax=assumptions.get("cost_of_debt_pretax", 0.078),
        tax_rate=assumptions.get("tax_rate", 0.25),
    )

    if "wacc" not in assumptions or assumptions.get("wacc") is None:
        assumptions["wacc"] = wacc_result["wacc"]
    assumptions.setdefault("base_fcf", financial_data["cash_flow_statements"][-1]["free_cash_flow"])

    net_debt = bal["total_debt"] - bal["cash_and_equivalents"]
    engine = DCFEngine(assumptions)
    result = engine.run(net_debt, financial_data.get("shares_outstanding", 0))
    result["wacc_details"] = wacc_result
    result["assumptions"] = assumptions
    return result
