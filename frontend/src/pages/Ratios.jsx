import { useState } from 'react';
import { formatPercent, formatMultiple, formatPrice, formatDays } from '../utils/formatters';
import { getCurrencySymbol } from '../utils/currency';

const CATEGORIES = [
  {
    id: 'profitability', name: 'Profitability', color: '#10b981', icon: '📈',
    ratios: [
      { key: 'gross_margin', label: 'Gross Margin', format: 'percent', desc: '(Revenue − COGS) / Revenue' },
      { key: 'net_margin', label: 'Net Profit Margin', format: 'percent', desc: 'Net Income / Revenue' },
      { key: 'ebitda_margin', label: 'EBITDA Margin', format: 'percent', desc: '(EBIT + D&A) / Revenue' },
      { key: 'operating_margin', label: 'Operating Margin', format: 'percent', desc: 'EBIT / Revenue' },
      { key: 'roe', label: 'Return on Equity (ROE)', format: 'percent', desc: 'Net Income / Avg Equity' },
      { key: 'roa', label: 'Return on Assets (ROA)', format: 'percent', desc: 'Net Income / Avg Assets' },
      { key: 'roce', label: 'ROCE', format: 'percent', desc: 'EBIT / Capital Employed' },
      { key: 'eps', label: 'EPS', format: 'price', desc: 'Net Income / Shares Outstanding' },
    ],
  },
  {
    id: 'leverage', name: 'Leverage & Solvency', color: '#f59e0b', icon: '⚖️',
    ratios: [
      { key: 'debt_to_equity', label: 'Debt-to-Equity', format: 'multiple', desc: 'Total Debt / Equity' },
      { key: 'debt_to_assets', label: 'Debt-to-Assets', format: 'percent', desc: 'Total Debt / Total Assets' },
      { key: 'interest_coverage', label: 'Interest Coverage', format: 'multiple', desc: 'EBIT / Interest Expense' },
      { key: 'debt_to_ebitda', label: 'Debt / EBITDA', format: 'multiple', desc: 'Total Debt / EBITDA' },
      { key: 'equity_multiplier', label: 'Equity Multiplier', format: 'multiple', desc: 'Total Assets / Equity' },
    ],
  },
  {
    id: 'liquidity', name: 'Liquidity', color: '#3b82f6', icon: '💧',
    ratios: [
      { key: 'current_ratio', label: 'Current Ratio', format: 'multiple', desc: 'Current Assets / Current Liabilities' },
      { key: 'quick_ratio', label: 'Quick Ratio', format: 'multiple', desc: '(CA − Inventory) / CL' },
      { key: 'cash_ratio', label: 'Cash Ratio', format: 'multiple', desc: 'Cash / Current Liabilities' },
    ],
  },
  {
    id: 'efficiency', name: 'Efficiency', color: '#8b5cf6', icon: '⚡',
    ratios: [
      { key: 'asset_turnover', label: 'Asset Turnover', format: 'multiple', desc: 'Revenue / Avg Assets' },
      { key: 'inventory_turnover', label: 'Inventory Turnover', format: 'multiple', desc: 'COGS / Avg Inventory' },
      { key: 'days_inventory', label: 'Days Inventory', format: 'days', desc: '365 / Inventory Turnover' },
      { key: 'days_sales_outstanding', label: 'Days Sales Outstanding', format: 'days', desc: '(Avg AR / Revenue) × 365' },
    ],
  },
  {
    id: 'growth', name: 'Growth', color: '#ec4899', icon: '🚀',
    ratios: [
      { key: 'revenue_growth', label: 'Revenue Growth (YoY)', format: 'percent', desc: 'ΔRevenue / Revenue_t-1' },
      { key: 'net_income_growth', label: 'Net Income Growth (YoY)', format: 'percent', desc: 'ΔNI / NI_t-1' },
      { key: 'eps_growth', label: 'EPS Growth (YoY)', format: 'percent', desc: 'ΔEPS / EPS_t-1' },
      { key: 'ebit_growth', label: 'EBIT Growth (YoY)', format: 'percent', desc: 'ΔEBIT / EBIT_t-1' },
      { key: 'fcf_growth', label: 'FCF Growth (YoY)', format: 'percent', desc: 'ΔFCF / FCF_t-1' },
    ],
  },
];

export default function Ratios({ data }) {
  const [openSections, setOpenSections] = useState(['profitability']);
  const ratios = data?.ratios || [];
  const curr = data?.currency || 'USD';
  const currSym = getCurrencySymbol(curr);

  const FMT = {
    percent: (v) => formatPercent(v),
    multiple: (v) => formatMultiple(v),
    price: (v) => formatPrice(v, curr),
    days: (v) => formatDays(v),
  };

  const toggle = (id) => {
    setOpenSections((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  return (
    <div>
      <h2 className="section-title animate-in">📈 Financial Ratios</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', marginTop: '-0.75rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {ratios.length} years of computed ratios across 5 categories. Color-coded health flags based on configurable thresholds.
        </p>
        <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-input)',
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border)',
          whiteSpace: 'nowrap',
        }}>
          💱 {curr} ({currSym.trim()})
        </span>
      </div>

      {CATEGORIES.map((cat) => {
        const isOpen = openSections.includes(cat.id);
        return (
          <div key={cat.id} className="ratio-section">
            <div
              className={`ratio-section-header ${isOpen ? 'open' : ''}`}
              onClick={() => toggle(cat.id)}
            >
              <div className="ratio-section-title">
                <span className="category-dot" style={{ background: cat.color }} />
                <span>{cat.icon} {cat.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({cat.ratios.length} ratios)
                </span>
              </div>
              <span className="ratio-section-toggle">▼</span>
            </div>

            {isOpen && (
              <div className="ratio-section-body">
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ratio</th>
                        {ratios.map((r) => <th key={r.year}>FY{r.year}</th>)}
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.ratios.map((ratio) => {
                        const latestFlags = ratios[ratios.length - 1]?.flags || {};
                        const flag = latestFlags[ratio.key] || 'ok';
                        return (
                          <tr key={ratio.key}>
                            <td className="row-label" title={ratio.desc}>{ratio.label}</td>
                            {ratios.map((r) => (
                              <td key={r.year}>
                                {FMT[ratio.format] ? FMT[ratio.format](r[ratio.key]) : (r[ratio.key] ?? '—')}
                              </td>
                            ))}
                            <td>
                              <span className={`status-badge ${flag}`}>
                                {flag === 'ok' ? '✓ OK' : flag === 'warning' ? '⚠ WARN' : '✕ CRIT'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}