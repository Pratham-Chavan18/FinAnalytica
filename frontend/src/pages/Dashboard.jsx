import Plot from 'react-plotly.js';
import { formatCrores, formatPercent, formatPrice, formatMultiple, changeClass, changeArrow } from '../utils/formatters';
import { getCountryCoords } from '../utils/countryCoords';
import { getCurrencySymbol } from '../utils/currency';

function plotlyLayout(theme) {
  const isDark = theme === 'dark';
  return {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, sans-serif', color: isDark ? '#94a3b8' : '#475569', size: 11 },
    margin: { l: 45, r: 20, t: 20, b: 35 },
    xaxis: { gridcolor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.06)', tickfont: { size: 10 } },
    yaxis: { gridcolor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.06)', tickfont: { size: 10 } },
    legend: { orientation: 'h', y: -0.15, font: { size: 10 } },
    hoverlabel: { bgcolor: isDark ? '#1e293b' : '#ffffff', font: { family: 'Inter', size: 12 } },
  };
}

export default function Dashboard({ data, theme }) {
  if (!data) return null;
  const { ratios, dupont, income_statements: inc, cash_flow_statements: cf } = data;
  const latest = ratios?.[ratios.length - 1] || {};
  const years = ratios?.map(r => r.year) || [];
  const ly = plotlyLayout(theme);
  const isDark = theme === 'dark';

  const coords = data.country ? getCountryCoords(data.country) : null;
  const curr = data.currency || 'USD';
  const currSym = getCurrencySymbol(curr);

  return (
    <div>
      {/* Company Info Card */}
      <div className="company-info-card">
        {data.logo_url && (
          <img className="company-logo-large" src={data.logo_url} alt={data.company_name}
            onError={e => { e.target.style.display = 'none'; }} />
        )}
        <div className="company-info-text">
          <h2>{data.company_name}</h2>
          <div className="company-info-meta">
            {data.sector && <span>🏢 {data.sector}</span>}
            {data.industry && <span>🔧 {data.industry}</span>}
            {data.city && data.country && <span>📍 {data.city}, {data.country}</span>}
            <span>💱 {curr} ({currSym.trim()})</span>
            {data.website && <span><a href={data.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>🌐 Website</a></span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="company-info-tag">{data.ticker}</span>
          <span className="company-info-tag">{curr}</span>
        </div>
      </div>

      {/* Metrics */}
      <h3 className="section-title animate-in">🏛 Company Overview — FY{latest.year}</h3>
      <div className="metrics-grid">
        {[
          { label: 'Revenue', value: formatCrores(latest.revenue, curr), change: latest.revenue_growth, color: 'cyan' },
          { label: 'Net Income', value: formatCrores(latest.net_income, curr), change: latest.net_income_growth, color: 'green' },
          { label: 'Market Cap', value: formatCrores(data.market_cap, curr), color: 'purple' },
          { label: 'Share Price', value: formatPrice(data.current_price, curr), color: 'amber' },
          { label: 'ROE', value: formatPercent(latest.roe), color: 'pink' },
          { label: 'Debt / Equity', value: formatMultiple(latest.debt_to_equity), color: 'blue' },
        ].map((m, i) => (
          <div key={m.label} className={`metric-card ${m.color} animate-in animate-in-delay-${i + 1}`}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value gradient-text">{m.value}</div>
            {m.change != null && (
              <span className={`metric-change ${changeClass(m.change)}`}>
                {changeArrow(m.change)} {formatPercent(m.change)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* World Map */}
      {coords && (
        <div className="map-card animate-in animate-in-delay-3">
          <div className="map-header">
            <h3>🌍 Company Headquarters</h3>
            <div className="map-country-info">
              <span>📍 {data.city}, {data.country}</span>
              <span>💱 {curr}</span>
            </div>
          </div>
          <Plot
            data={[{
              type: 'scattergeo',
              lat: [coords[0]],
              lon: [coords[1]],
              text: [`${data.company_name}<br>${data.city}, {data.country}<br>Currency: ${curr} (${currSym.trim()})`],
              marker: {
                size: 14,
                color: isDark ? '#06b6d4' : '#3b82f6',
                line: { width: 2, color: 'white' },
                symbol: 'circle',
              },
              hoverinfo: 'text',
            }]}
            layout={{
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              margin: { l: 0, r: 0, t: 0, b: 0 },
              height: 300,
              geo: {
                projection: { type: 'natural earth' },
                showland: true,
                landcolor: isDark ? '#1e293b' : '#e2e8f0',
                showocean: true,
                oceancolor: isDark ? '#0f172a' : '#f1f5f9',
                showcountries: true,
                countrycolor: isDark ? '#334155' : '#cbd5e1',
                showlakes: false,
                bgcolor: 'transparent',
                coastlinecolor: isDark ? '#334155' : '#cbd5e1',
                framecolor: 'transparent',
              },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: 300 }}
          />
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card animate-in animate-in-delay-2">
          <div className="chart-title">Revenue & Net Income Trend ({curr})</div>
          <Plot
            data={[
              { x: years, y: ratios.map(r => r.revenue), type: 'scatter', mode: 'lines+markers', name: 'Revenue', line: { color: isDark ? '#06b6d4' : '#3b82f6', width: 2.5 }, marker: { size: 5 }, hovertemplate: `${currSym}%{y:,.0f}<extra>Revenue</extra>` },
              { x: years, y: ratios.map(r => r.net_income), type: 'scatter', mode: 'lines+markers', name: 'Net Income', line: { color: '#10b981', width: 2.5 }, marker: { size: 5 }, hovertemplate: `${currSym}%{y:,.0f}<extra>Net Income</extra>` },
            ]}
            layout={{ ...ly, height: 260 }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: 260 }}
          />
        </div>
        <div className="chart-card animate-in animate-in-delay-3">
          <div className="chart-title">Margin Trends</div>
          <Plot
            data={[
              { x: years, y: ratios.map(r => r.gross_margin != null ? r.gross_margin * 100 : null), type: 'scatter', mode: 'lines+markers', name: 'Gross', line: { color: '#10b981', width: 2 }, marker: { size: 4 } },
              { x: years, y: ratios.map(r => r.operating_margin != null ? r.operating_margin * 100 : null), type: 'scatter', mode: 'lines+markers', name: 'Operating', line: { color: isDark ? '#06b6d4' : '#3b82f6', width: 2 }, marker: { size: 4 } },
              { x: years, y: ratios.map(r => r.net_profit_margin != null ? r.net_profit_margin * 100 : null), type: 'scatter', mode: 'lines+markers', name: 'Net', line: { color: '#8b5cf6', width: 2 }, marker: { size: 4 } },
            ]}
            layout={{ ...ly, height: 260, yaxis: { ...ly.yaxis, ticksuffix: '%' } }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: 260 }}
          />
        </div>
        <div className="chart-card animate-in animate-in-delay-4">
          <div className="chart-title">Return Ratios</div>
          <Plot
            data={[
              { x: years, y: ratios.map(r => r.roe != null ? r.roe * 100 : null), type: 'bar', name: 'ROE', marker: { color: isDark ? '#06b6d4' : '#3b82f6', borderRadius: 4 } },
              { x: years, y: ratios.map(r => r.roa != null ? r.roa * 100 : null), type: 'bar', name: 'ROA', marker: { color: '#f59e0b' } },
              { x: years, y: ratios.map(r => r.roce != null ? r.roce * 100 : null), type: 'bar', name: 'ROCE', marker: { color: '#10b981' } },
            ]}
            layout={{ ...ly, height: 260, barmode: 'group', bargap: 0.3, yaxis: { ...ly.yaxis, ticksuffix: '%' } }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: 260 }}
          />
        </div>
        <div className="chart-card animate-in animate-in-delay-5">
          <div className="chart-title">Free Cash Flow ({curr})</div>
          <Plot
            data={[{
              x: cf?.map(c => c.year) || [],
              y: cf?.map(c => c.free_cash_flow) || [],
              type: 'bar',
              marker: { color: cf?.map(c => c.free_cash_flow >= 0 ? '#10b981' : '#ef4444') },
              hovertemplate: `${currSym}%{y:,.0f}<extra>FCF</extra>`,
            }]}
            layout={{ ...ly, height: 260, showlegend: false }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: 260 }}
          />
        </div>
      </div>

      {/* DuPont */}
      {dupont && dupont.length > 0 && (() => {
        const d = dupont[dupont.length - 1];
        return (
          <div className="dupont-card animate-in animate-in-delay-6">
            <div className="section-title">🔬 DuPont ROE Decomposition — FY{d.year}</div>
            <div className="dupont-equation">
              <div className="dupont-factor">
                <div className="factor-value">{formatPercent(d.net_profit_margin)}</div>
                <div className="factor-label">Net Margin</div>
              </div>
              <div className="dupont-operator">×</div>
              <div className="dupont-factor">
                <div className="factor-value">{d.asset_turnover?.toFixed(2) ?? '—'}x</div>
                <div className="factor-label">Asset Turnover</div>
              </div>
              <div className="dupont-operator">×</div>
              <div className="dupont-factor">
                <div className="factor-value">{d.equity_multiplier?.toFixed(2) ?? '—'}x</div>
                <div className="factor-label">Equity Multiplier</div>
              </div>
              <div className="dupont-operator">=</div>
              <div className="dupont-result">
                <div className="factor-value">{formatPercent(d.roe)}</div>
                <div className="factor-label">ROE</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}