import { useState } from 'react';
import Plot from 'react-plotly.js';
import { formatPrice, formatCrores, formatPercent, formatIntrinsic } from '../utils/formatters';
import { getCurrencySymbol } from '../utils/currency';
import { runValuation } from '../api/client';

function getLayout(theme) {
  const isDark = theme === 'dark';
  return {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    font: { family: 'Inter, sans-serif', color: isDark ? '#94a3b8' : '#475569', size: 11 },
    margin: { l: 50, r: 20, t: 30, b: 40 },
    xaxis: { gridcolor: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(0,0,0,0.06)' },
    yaxis: { gridcolor: isDark ? 'rgba(148,163,184,0.06)' : 'rgba(0,0,0,0.06)' },
    hoverlabel: { bgcolor: isDark ? '#0f172a' : '#ffffff', font: { family: 'JetBrains Mono', size: 12 } },
    legend: { orientation: 'h', y: -0.2, font: { size: 10 } },
  };
}

export default function Valuation({ data, theme }) {
  const PLOTLY_LAYOUT = getLayout(theme);
  const isDark = theme === 'dark';
  const val = data?.valuation;
  const wacc = data?.wacc_details;
  const sensitivity = data?.sensitivity || [];

  const curr = data?.currency || 'USD';
  const currSym = getCurrencySymbol(curr);
  const currLabel = curr === 'INR' ? `${currSym} Cr` : curr;

  const latestBal = data?.balance_sheets?.[data.balance_sheets.length - 1] || {};
  const latestCf = data?.cash_flow_statements?.[data.cash_flow_statements.length - 1] || {};

  const [assumptions, setAssumptions] = useState({
    base_fcf: latestCf.free_cash_flow || 50000,
    phase1_growth_rate: 0.14,
    phase1_years: 5,
    phase2_growth_rate: 0.09,
    phase2_years: 5,
    terminal_growth_rate: 0.04,
    risk_free_rate: 0.072,
    beta: 1.05,
    equity_risk_premium: 0.07,
    cost_of_debt_pretax: 0.078,
    tax_rate: 0.25,
    market_cap: data?.market_cap || 0,
    total_debt: latestBal.total_debt || 0,
    cash_and_equivalents: latestBal.cash_and_equivalents || 0,
    shares_outstanding: data?.shares_outstanding || 100,
  });

  const [customResult, setCustomResult] = useState(null);
  const [customSensitivity, setCustomSensitivity] = useState([]);
  const [recalculating, setRecalculating] = useState(false);

  const activeVal = customResult || val;
  const activeSens = customSensitivity.length > 0 ? customSensitivity : sensitivity;

  const handleChange = (key, value) => {
    setAssumptions((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await runValuation(assumptions);
      setCustomResult(res.valuation);
      setCustomSensitivity(res.sensitivity || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  // Determine verdict
  let verdict = 'fair', verdictText = 'Fairly Valued';
  if (activeVal && data?.current_price) {
    const ratio = activeVal.intrinsic_per_share / data.current_price;
    if (ratio > 1.15) { verdict = 'undervalued'; verdictText = `Undervalued by ${formatPercent(ratio - 1)}`; }
    else if (ratio < 0.85) { verdict = 'overvalued'; verdictText = `Overvalued by ${formatPercent(1 - ratio)}`; }
  }

  // Build sensitivity heatmap data
  const waccVals = [...new Set(activeSens.map((c) => c.wacc))].sort();
  const growthVals = [...new Set(activeSens.map((c) => c.growth))].sort();
  const sensMap = {};
  activeSens.forEach((c) => { sensMap[`${c.wacc}_${c.growth}`] = c.intrinsic_value; });

  return (
    <div className="valuation-layout">
      {/* Assumptions Panel */}
      <div className="assumptions-panel">
        <div className="card animate-in">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>⚙️ DCF Assumptions ({curr})</h3>

          <div className="form-group">
            <label className="form-label">Base FCF ({currLabel})</label>
            <input className="form-input" type="number" value={assumptions.base_fcf}
              onChange={(e) => handleChange('base_fcf', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phase 1 Growth Rate</label>
            <input className="form-input" type="number" step="0.01" value={assumptions.phase1_growth_rate}
              onChange={(e) => handleChange('phase1_growth_rate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phase 1 Years</label>
            <input className="form-input" type="number" value={assumptions.phase1_years}
              onChange={(e) => handleChange('phase1_years', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phase 2 Growth Rate</label>
            <input className="form-input" type="number" step="0.01" value={assumptions.phase2_growth_rate}
              onChange={(e) => handleChange('phase2_growth_rate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phase 2 Years</label>
            <input className="form-input" type="number" value={assumptions.phase2_years}
              onChange={(e) => handleChange('phase2_years', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Terminal Growth Rate</label>
            <input className="form-input" type="number" step="0.01" value={assumptions.terminal_growth_rate}
              onChange={(e) => handleChange('terminal_growth_rate', e.target.value)} />
          </div>

          <div className="form-divider" />
          <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>WACC Parameters</h4>

          <div className="form-group">
            <label className="form-label">Risk-Free Rate</label>
            <input className="form-input" type="number" step="0.001" value={assumptions.risk_free_rate}
              onChange={(e) => handleChange('risk_free_rate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Beta (β)</label>
            <input className="form-input" type="number" step="0.01" value={assumptions.beta}
              onChange={(e) => handleChange('beta', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Equity Risk Premium</label>
            <input className="form-input" type="number" step="0.001" value={assumptions.equity_risk_premium}
              onChange={(e) => handleChange('equity_risk_premium', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cost of Debt (Pre-tax)</label>
            <input className="form-input" type="number" step="0.001" value={assumptions.cost_of_debt_pretax}
              onChange={(e) => handleChange('cost_of_debt_pretax', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tax Rate</label>
            <input className="form-input" type="number" step="0.01" value={assumptions.tax_rate}
              onChange={(e) => handleChange('tax_rate', e.target.value)} />
          </div>

          <button className="btn-analyze" style={{ width: '100%', marginTop: '1rem', padding: '0.6rem' }}
            onClick={handleRecalculate} disabled={recalculating}>
            {recalculating ? '⏳ Recalculating...' : `🔄 Recalculate DCF (${curr})`}
          </button>
        </div>
      </div>

      {/* Results Panel */}
      <div>
        {activeVal && (
          <>
            {/* Intrinsic Value */}
            <div className="intrinsic-value-card">
              <div className="intrinsic-label">Intrinsic Value Per Share ({curr})</div>
              <div className="intrinsic-amount">{formatPrice(activeVal.intrinsic_per_share, curr)}</div>
              {data?.current_price > 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  CMP: {formatPrice(data.current_price, curr)}
                </p>
              )}
              <div className="mos-badges">
                <div className="mos-badge">
                  <span className="mos-label">15% Margin of Safety</span>
                  <span className="mos-value">{formatPrice(activeVal.margin_of_safety_15, curr)}</span>
                </div>
                <div className="mos-badge">
                  <span className="mos-label">30% Margin of Safety</span>
                  <span className="mos-value">{formatPrice(activeVal.margin_of_safety_30, curr)}</span>
                </div>
              </div>
              {data?.current_price > 0 && (
                <div className={`valuation-verdict ${verdict}`}>
                  {verdict === 'undervalued' ? '📈' : verdict === 'overvalued' ? '📉' : '➡️'} {verdictText}
                </div>
              )}
            </div>

            {/* WACC & EV Breakdown */}
            <div className="charts-grid" style={{ marginBottom: '2rem' }}>
              <div className="chart-card">
                <div className="chart-title">Projected FCF ({curr})</div>
                <Plot
                  data={[
                    { x: activeVal.projected_fcfs.map((f) => `Year ${f.year}`), y: activeVal.projected_fcfs.map((f) => f.fcf), name: 'FCF', type: 'bar', marker: { color: isDark ? '#06b6d4' : '#3b82f6' }, hovertemplate: `${currSym}%{y:,.0f}<extra>FCF</extra>` },
                    { x: activeVal.projected_fcfs.map((f) => `Year ${f.year}`), y: activeVal.projected_fcfs.map((f) => f.pv_fcf), name: 'PV of FCF', type: 'bar', marker: { color: '#8b5cf6' }, hovertemplate: `${currSym}%{y:,.0f}<extra>PV of FCF</extra>` },
                  ]}
                  layout={{ ...PLOTLY_LAYOUT, height: 280, barmode: 'group', legend: { ...PLOTLY_LAYOUT.legend, orientation: 'h', y: -0.2 } }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="chart-card">
                <div className="chart-title">Enterprise Value Breakdown ({curr})</div>
                <Plot
                  data={[{
                    values: [activeVal.sum_pv_fcfs, activeVal.pv_terminal_value],
                    labels: ['PV of FCFs', 'PV of Terminal Value'],
                    type: 'pie', hole: 0.6,
                    marker: { colors: ['#06b6d4', '#8b5cf6'] },
                    textinfo: 'label+percent', textfont: { color: isDark ? '#f1f5f9' : '#334155', size: 11 },
                  }]}
                  layout={{ ...PLOTLY_LAYOUT, height: 280, showlegend: false }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Key Valuation Metrics */}
            <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
              <div className="metric-card cyan">
                <div className="metric-label">WACC</div>
                <div className="metric-value">{formatPercent(activeVal.wacc)}</div>
              </div>
              <div className="metric-card purple">
                <div className="metric-label">Enterprise Value ({curr})</div>
                <div className="metric-value gradient-text">{formatCrores(activeVal.enterprise_value, curr)}</div>
              </div>
              <div className="metric-card green">
                <div className="metric-label">Equity Value ({curr})</div>
                <div className="metric-value">{formatCrores(activeVal.equity_value, curr)}</div>
              </div>
              <div className="metric-card amber">
                <div className="metric-label">Terminal Value ({curr})</div>
                <div className="metric-value">{formatCrores(activeVal.terminal_value, curr)}</div>
              </div>
            </div>
          </>
        )}

        {/* Sensitivity Table */}
        {activeSens.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 className="section-title">🎯 Sensitivity Analysis — WACC × Terminal Growth ({curr})</h3>
            <div className="data-table-wrapper">
              <table className="sensitivity-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: '0.65rem' }}>WACC ↓ / Growth →</th>
                    {growthVals.map((g) => <th key={g}>{(g * 100).toFixed(1)}%</th>)}
                  </tr>
                </thead>
                <tbody>
                  {waccVals.map((w) => (
                    <tr key={w}>
                      <th style={{ textAlign: 'left' }}>{(w * 100).toFixed(1)}%</th>
                      {growthVals.map((g) => {
                        const v = sensMap[`${w}_${g}`];
                        let bg = 'rgba(100,100,100,0.15)';
                        if (v != null && data.current_price) {
                          if (v > data.current_price * 1.1) bg = `rgba(16,185,129,${0.1 + Math.min((v / data.current_price - 1) * 0.3, 0.4)})`;
                          else if (v < data.current_price * 0.9) bg = `rgba(239,68,68,${0.1 + Math.min((1 - v / data.current_price) * 0.3, 0.4)})`;
                          else bg = 'rgba(245,158,11,0.15)';
                        }
                        return (
                          <td key={g} style={{ background: bg }}>
                            {v != null ? `${currSym}${v.toFixed(0)}` : 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.current_price > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16,185,129,0.3)', display: 'inline-block' }} /> Undervalued</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.15)', display: 'inline-block' }} /> Fair</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.3)', display: 'inline-block' }} /> Overvalued</span>
                <span>| CMP: {formatPrice(data.current_price, curr)}</span>
              </div>
            )}
          </div>
        )}

        {!activeVal && (
          <div className="loading-container">
            <p className="loading-text">No valuation data available. Click "Recalculate DCF" to compute.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Values will be displayed in {curr} ({currSym.trim()})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}