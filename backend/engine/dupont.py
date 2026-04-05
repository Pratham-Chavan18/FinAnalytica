"""
FinAnalytica — DuPont Decomposition
3-Factor: ROE = Net Margin × Asset Turnover × Equity Multiplier
"""


def dupont_3factor(net_income: float, revenue: float,
                   avg_total_assets: float, avg_equity: float) -> dict:
    npm = revenue and (net_income / revenue) or 0
    at = avg_total_assets and (revenue / avg_total_assets) or 0
    em = avg_equity and (avg_total_assets / avg_equity) or 0
    roe_val = npm * at * em
    return {
        "net_profit_margin": npm,
        "asset_turnover": at,
        "equity_multiplier": em,
        "roe": roe_val,
        "decomposition": f"{npm:.1%} × {at:.2f}x × {em:.2f}x = {roe_val:.1%}",
    }


def compute_dupont_all_years(income_statements: list, balance_sheets: list) -> list[dict]:
    results = []
    for i in range(len(income_statements)):
        inc = income_statements[i]
        bal = balance_sheets[i]
        prev_bal = balance_sheets[i - 1] if i > 0 else None
        avg_assets = (
            (bal.total_assets + prev_bal.total_assets) / 2 if prev_bal else bal.total_assets
        )
        avg_equity = (
            (bal.shareholders_equity + prev_bal.shareholders_equity) / 2
            if prev_bal else bal.shareholders_equity
        )
        d = dupont_3factor(inc.net_income, inc.revenue, avg_assets, avg_equity)
        d["year"] = inc.year
        results.append(d)
    return results
