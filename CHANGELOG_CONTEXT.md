# FinAnalytica — Full Project Context & Changelog

> **Purpose:** This document contains everything needed to continue development on the FinAnalytica project in a new AI assistant session. Upload this file to provide full context.

---

## 1. Project Overview

**FinAnalytica** is a full-stack financial statement analysis & valuation tool.

**What it does:**
- Imports financial data via Yahoo Finance (yfinance) or CSV upload
- Calculates 30+ financial ratios (Profitability, Leverage, Liquidity, Efficiency, Growth)
- Performs DuPont ROE decomposition (3-factor)
- Runs Discounted Cash Flow (DCF) valuation with two-phase growth model
- Generates 5×5 sensitivity analysis matrix (WACC × Terminal Growth)
- Provides an AI Financial Assistant powered by Google Gemini

**Who it's for:** A portfolio/recruiter-facing project demonstrating finance + engineering skills.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend Runtime | Python | 3.14.3 |
| Backend Framework | FastAPI + Uvicorn | Latest |
| Data Validation | Pydantic v2 | Latest |
| Market Data | yfinance | Latest |
| Data Processing | pandas, NumPy | Latest |
| AI | Groq SDK (LLaMA 3.3 70B Versatile) | Latest |
| Frontend Runtime | Node.js | v24.14.0 |
| Frontend Framework | React | 19.1.0 |
| Build Tool | Vite | 7.3.1 |
| Charts | Plotly.js + react-plotly.js | Latest |
| HTTP Client | Axios | Latest |
| Styling | Vanilla CSS (dark glassmorphism theme) | N/A |

---

## 3. Project Structure

```
d:\Financial Analysis\
├── backend\
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point, CORS, router mounting
│   ├── requirements.txt             # Python dependencies
│   ├── config\
│   │   ├── __init__.py
│   │   └── defaults.yaml            # Default DCF assumptions & ratio thresholds
│   ├── models\
│   │   ├── __init__.py
│   │   ├── financial_statements.py  # Pydantic models: IncomeStatement, BalanceSheet, CashFlowStatement, FinancialStatements
│   │   └── analysis_result.py       # Pydantic models: RatioResult, DuPontResult, WACCResult, IntrinsicValue, SensitivityCell, FullAnalysisResult
│   ├── engine\
│   │   ├── __init__.py
│   │   ├── ratios.py                # 30+ ratio computation functions, CAGR, health flagging
│   │   ├── dupont.py                # 3-factor DuPont ROE decomposition
│   │   ├── wacc.py                  # CAPM + WACC calculation (NOTE: file is wacc.js but contains Python code — see Known Issues)
│   │   ├── dcf.py                   # Two-phase DCF valuation engine with Gordon Growth terminal value
│   │   └── sensitivity.py           # 5×5 sensitivity matrix generator
│   ├── ingestion\
│   │   ├── __init__.py
│   │   ├── yfinance_fetcher.py      # Fetches data from Yahoo Finance, maps to Pydantic models
│   │   └── csv_fetcher.py           # CSV parser with automatic column alias mapping
│   ├── routers\
│   │   ├── __init__.py
│   │   ├── analysis.py              # GET /api/analyze/{ticker}, POST /api/analyze/csv
│   │   ├── valuation.py             # POST /api/valuation (custom DCF assumptions)
│   │   └── ai_assistant.py          # POST /api/ai/chat (Gemini integration)
│   └── tests\
│       └── __init__.py              # Tests not yet implemented
│
├── frontend\
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js               # Vite + @vitejs/plugin-react
│   └── src\
│       ├── main.jsx                 # React entry point
│       ├── App.jsx                  # App shell: header, ticker input, tab navigation, page routing
│       ├── index.css                # Full CSS design system (dark glassmorphism, 300+ lines)
│       ├── api\
│       │   └── client.js            # Axios API client (base URL: http://127.0.0.1:8001/api)
│       ├── utils\
│       │   └── formatters.js        # Currency (INR Cr/L), percentage, multiple, days formatters
│       └── pages\
│           ├── Dashboard.jsx        # Metric cards, Plotly charts (revenue, margins, returns, FCF), DuPont
│           ├── Ratios.jsx           # 5 expandable ratio categories, multi-year table, health flags
│           ├── Valuation.jsx        # DCF assumptions form, intrinsic value, FCF chart, EV donut, sensitivity heatmap
│           └── AIAssistant.jsx      # Gemini chat interface, API key management, prompt templates
│
├── css\                             # OLD client-side-only files (can be deleted)
├── js\                              # OLD client-side-only files (can be deleted)
└── index.html                       # OLD client-side-only file (can be deleted)
```

---

## 4. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/analyze/{ticker}?years=10` | Full analysis via yfinance |
| POST | `/api/analyze/csv` | Full analysis from CSV uploads |
| POST | `/api/valuation` | Custom DCF with user assumptions |
| POST | `/api/ai/chat` | Gemini-powered financial chat |
| GET | `/docs` | Swagger UI |

**Response shape for `/api/analyze/{ticker}`:**
```json
{
  "ticker": "RELIANCE.NS",
  "company_name": "Reliance Industries Limited",
  "sector": "Energy",
  "currency": "INR",
  "current_price": 1404.8,
  "market_cap": 1900000,
  "shares_outstanding": 1352.5,
  "ratios": [{ "year": 2022, "revenue": ..., "gross_margin": ..., "flags": {...} }, ...],
  "dupont": [{ "year": 2022, "net_profit_margin": ..., "asset_turnover": ..., ... }, ...],
  "valuation": { "intrinsic_per_share": ..., "enterprise_value": ..., "projected_fcfs": [...], ... },
  "wacc_details": { "cost_of_equity": ..., "wacc": ... },
  "sensitivity": [{ "wacc": 0.09, "growth": 0.03, "intrinsic_value": ... }, ...],
  "income_statements": [...],
  "balance_sheets": [...],
  "cash_flow_statements": [...]
}
```

---

## 5. How to Run

```bash
# Terminal 1 — Backend
cd "d:\Financial Analysis"
python -m uvicorn backend.main:app --port 8001

# Terminal 2 — Frontend
cd "d:\Financial Analysis\frontend"
npm run dev -- --port 5180
```

Open **http://localhost:5180** in a browser.

**Note:** The backend runs on port **8001** (not 8000) because a zombie Python process was occupying port 8000 during development. The frontend API client (`src/api/client.js`) is configured to point to `http://127.0.0.1:8001/api`.

---

## 6. Bugs Fixed During Development

| # | Bug | Root Cause | Fix Applied |
|---|-----|-----------|-------------|
| 1 | Frontend blank page | `react` and `react-dom` were missing from `package.json` (Vite template was TypeScript-based) | Added both to dependencies, clean `npm install` |
| 2 | Backend 500 error on `/api/analyze` | `NaN` float values from ratio engine are not JSON-serializable | Added recursive `_sanitize()` function in `analysis.py` and `valuation.py` that converts NaN/Inf → None |
| 3 | CORS blocking on error responses | FastAPI CORS middleware didn't apply headers on 500 responses | Changed `allow_origins` to `["*"]` for development |
| 4 | yfinance data gaps causing crashes | Missing balance sheet/cashflow columns, NaN from pandas | Rewrote `yfinance_fetcher.py` with `_safe()` and `_get_val()` helpers, column fallback, and sensible defaults |
| 5 | Build script error | `package.json` had `"build": "tsc && vite build"` but no TypeScript | Changed to `"build": "vite build"` |
| 6 | Vite not transforming JSX | Missing `@vitejs/plugin-react` and `vite.config.js` | Installed plugin, created config |

---

## 7. Current State (as of March 10, 2026)

### ✅ Working
- All 4 frontend pages render and function correctly
- Backend fetches live data from Yahoo Finance for any ticker
- 30+ financial ratios computed with health flagging
- DCF valuation with sensitivity matrix
- AI Assistant UI (requires user's own Gemini API key)
- Indian currency formatting (₹ Cr / ₹L Cr)
- Dark glassmorphism theme with gradient accents

### ⚠️ Known Issues / Incomplete
1. **`backend/engine/wacc.js`** — This file has a `.js` extension but contains Python code. It works because Python imports don't care about extensions, but should be renamed to `wacc.py`.
2. **Old client-side files** — `css/`, `js/`, and root `index.html` are leftover from an earlier client-side-only architecture. They can be safely deleted.
3. **Tests** — `backend/tests/` exists but no tests have been written yet (pytest planned).
4. **CSV upload** — Backend endpoint exists but frontend UI for CSV upload is not implemented yet.
5. **PDF/JSON export** — Planned but not implemented.
6. **CLI tool** — Click/Rich CLI planned but not implemented.
7. **Port configuration** — Backend hardcoded to port 8001 in frontend's `client.js`. Should use environment variable.

---

## 8. Design Decisions

- **INR conversion:** yfinance returns values in raw units. For Indian stocks (currency=INR), all values are divided by 1,00,00,000 (1 Cr). Shares are also converted to Cr.
- **NaN handling:** Financial data often has gaps. All engine modules use `_safe()` to fall back to 0.0. API routers apply `_sanitize()` to recursively replace any remaining NaN/Inf with None before JSON response.
- **CORS wildcard:** Using `allow_origins=["*"]` for development. Should be restricted for production.
- **No state management library:** React uses simple `useState` prop-drilling. App is small enough that Context API / Zustand isn't needed yet.
- **Plotly over Chart.js:** Switched to Plotly for richer interactive charts with hover tooltips.

---

## 9. Key Dependencies

### Backend (`requirements.txt`)
```
fastapi
uvicorn[standard]
pydantic
yfinance
pandas
numpy
pyyaml
google-generativeai
python-multipart
```

### Frontend (`package.json` dependencies)
```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "axios": "^1.13.6",
  "plotly.js": "^3.4.0",
  "react-plotly.js": "^2.6.0"
}
```

### Frontend devDependencies
```json
{
  "@vitejs/plugin-react": "^5.1.4",
  "vite": "^7.3.1"
}
```

---

## 10. Potential Next Steps

1. **Rename `wacc.js` → `wacc.py`** and update any imports
2. **Delete old files:** `css/`, `js/`, root `index.html`
3. **Add CSV upload UI** — drag-and-drop component in the frontend
4. **Write pytest tests** for engine modules (ratios, DCF, WACC)
5. **PDF export** using WeasyPrint or browser print
6. **JSON export** button for analysis results
7. **Environment variables** for API port, Gemini key
8. **Production build** — `npm run build` + serve static files from FastAPI
9. **Docker** — Containerize both backend and frontend
10. **More robust error messages** — show specific field-level errors from yfinance
