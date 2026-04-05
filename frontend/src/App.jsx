import { useState, useEffect } from 'react';
import './index.css';
import Dashboard from './pages/Dashboard';
import Ratios from './pages/Ratios';
import Valuation from './pages/Valuation';
import AIAssistant from './pages/AIAssistant';
import { analyzeTicker } from './api/client';
import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/react';
import AnimatedHeading from './components/AnimatedHeading';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ratios', label: 'Ratios', icon: '📈' },
  { id: 'valuation', label: 'Valuation', icon: '💰' },
  { id: 'ai', label: 'AI Assistant', icon: '🤖' },
];

/* ═══════════════════════════════════════════════════════════════
   AUTH GATE — Shows before the main app
   ═══════════════════════════════════════════════════════════════ */
function AuthGate() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        animation: 'fadeInUp 0.6s ease both',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'white',
            boxShadow: 'var(--shadow-glow)',
          }}>
            F
          </div>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            FinAnalytica
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-card-hover)',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}>
            Sign in to access financial analysis, DCF valuations, and AI-powered insights.
          </p>

          {/* Auth Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <SignInButton mode="modal">
              <button style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.25s ease',
                boxShadow: 'var(--shadow-glow)',
              }}
                onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Create Account
              </button>
            </SignUpButton>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.5rem 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Features
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Feature list */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            textAlign: 'left',
          }}>
            {[
              { icon: '📊', label: 'Financial Ratios' },
              { icon: '💰', label: 'DCF Valuation' },
              { icon: '🗺️', label: 'Global Map' },
              { icon: '🤖', label: 'AI Assistant' },
            ].map(f => (
              <div key={f.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}>
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: '1.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.7rem',
        }}>
          Powered by yFinance · Groq AI · Clerk Auth
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP (unchanged below)
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const { isSignedIn, isLoaded } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('fa-theme') || 'light');
  const [ticker, setTicker] = useState('RELIANCE.NS');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Apply theme — uses data-theme attribute (matches CSS selectors)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fa-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  const handleAnalyze = async () => {
    if (!ticker.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await analyzeTicker(ticker.trim());
      setData(result);
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  const renderPage = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Fetching data for {ticker}…</p>
        </div>
      );
    }

    if (error) {
      return <div className="error-msg">⚠️ {error}</div>;
    }

    if (!data) {
      return (
        <div className="loading-container animate-fade">
          <AnimatedHeading text="FinAnalytica Intelligence" replay />
          <p className="loading-text" style={{ marginTop: '1rem' }}>
            Enter a ticker symbol and click Analyze to begin
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Examples: RELIANCE.NS · INFY.NS · AAPL · MSFT · GOOGL
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} theme={theme} />;
      case 'ratios':
        return <Ratios data={data} />;
      case 'valuation':
        return <Valuation data={data} theme={theme} />;
      case 'ai':
        return <AIAssistant data={data} />;
      default:
        return null;
    }
  };

  /* ── AUTH GATE: Show loading while Clerk initializes ── */
  if (!isLoaded) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p className="loading-text">Initializing…</p>
      </div>
    );
  }

  /* ── AUTH GATE: Show sign-in page if not authenticated ── */
  if (!isSignedIn) {
    return <AuthGate />;
  }

  /* ── MAIN APP: Only renders after authentication ── */
  return (
    <>
      {/* ═══════════ HEADER ═══════════ */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <a className="logo" href="/">
              <div className="logo-icon">F</div>
              <span className="logo-text">FinAnalytica</span>
            </a>
            <div className="ticker-input-wrapper">
              <input
                className="ticker-input"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="TICKER.NS"
              />
              <button
                className="btn-analyze"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? '⏳' : '🔍'} Analyze
              </button>
            </div>
          </div>

          <div className="header-right">
            {data && (
              <div className="company-badge">
                {data.logo_url && (
                  <img
                    src={data.logo_url}
                    alt=""
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <span>{data.company_name}</span>
                <span className="ticker-pill">{data.ticker}</span>
              </div>
            )}

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* ── Clerk Auth (using Show component) ── */}
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  className="btn-analyze"
                  style={{
                    padding: '0.4rem 1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* ═══════════ TAB NAVIGATION ═══════════ */}
      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => data && setActiveTab(tab.id)}
            disabled={!data}
            style={{ opacity: data ? 1 : 0.4 }}
          >
            <span className="tab-icon">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </nav>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="main-content">{renderPage()}</main>
    </>
  );
}