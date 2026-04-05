"""
FinAnalytica — Sensitivity Table Generator
5×5 WACC × Terminal Growth Rate → Intrinsic Value matrix.
"""

from .dcf import DCFEngine


def generate_sensitivity_matrix(
    base_assumptions: dict,
    net_debt: float,
    shares: float,
    wacc_range: list[float] = None,
    growth_range: list[float] = None,
) -> list[dict]:
    """Returns list of {wacc, growth, intrinsic_value} cells."""
    if wacc_range is None:
        wacc_range = [0.08, 0.09, 0.10, 0.11, 0.12]
    if growth_range is None:
        growth_range = [0.02, 0.03, 0.04, 0.05, 0.06]

    cells = []
    for w in wacc_range:
        for g in growth_range:
            if w <= g:
                cells.append({"wacc": w, "growth": g, "intrinsic_value": None})
                continue
            try:
                engine = DCFEngine({**base_assumptions, "wacc": w, "terminal_growth_rate": g})
                result = engine.run(net_debt, shares)
                cells.append({"wacc": w, "growth": g, "intrinsic_value": result["intrinsic_per_share"]})
            except Exception:
                cells.append({"wacc": w, "growth": g, "intrinsic_value": None})
    return cells
