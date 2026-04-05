import { useState, useRef, useEffect } from 'react';
import { aiChat } from '../api/client';
import { getCurrencySymbol } from '../utils/currency';

export default function AIAssistant({ data }) {
  const curr = data?.currency || 'USD';
  const currSym = getCurrencySymbol(curr);
  const companyName = data?.company_name || 'this company';

  const TEMPLATES = [
    { icon: '🏥', label: 'Financial Health Check', prompt: `Analyze the overall financial health of ${companyName} based on its ratios and financial statements. Use ${curr} (${currSym.trim()}) for all monetary references.` },
    { icon: '💡', label: 'Investment Recommendation', prompt: `Based on the financial data and DCF valuation, would you recommend investing in ${companyName}? Provide target prices in ${curr}. Explain your reasoning.` },
    { icon: '⚠️', label: 'Risk Assessment', prompt: `What are the key financial risks facing ${companyName}? Analyze leverage, liquidity, and cash flow risks. Reference values in ${curr}.` },
    { icon: '📊', label: 'Growth Analysis', prompt: `Analyze ${companyName}'s revenue and profit growth trajectory. Is the growth sustainable? What are the key growth drivers? Show figures in ${curr}.` },
  ];

  const [messages, setMessages] = useState([
    { role: 'system', content: `🤖 FinAnalytica AI is ready. Powered by Groq (LLaMA 3.3 70B). Analyzing ${companyName} in ${curr} (${currSym.trim()}). Ask any financial question below!` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = data ? {
        company_name: data.company_name,
        ticker: data.ticker,
        currency: curr,
        currency_symbol: currSym.trim(),
        current_price: data.current_price,
        market_cap: data.market_cap,
        ratios: data.ratios,
        valuation: data.valuation,
      } : null;

      const res = await aiChat(text, null, context);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${err.response?.data?.detail || err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="ai-layout">
      <div className="ai-header-card">
        <h2>🤖 AI Financial Assistant</h2>
        <p>
          Powered by Groq (LLaMA 3.3 70B) — analyzing <strong>{companyName}</strong> in {curr} ({currSym.trim()})
        </p>
        <div className="prompt-templates">
          {TEMPLATES.map((t, i) => (
            <button key={i} className="prompt-template-btn" onClick={() => sendMessage(t.prompt)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-message ${msg.role}`}
              dangerouslySetInnerHTML={msg.role === 'assistant' ? {
                __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
              } : undefined}
            >
              {msg.role !== 'assistant' ? msg.content : undefined}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
              Analyzing in {curr}...
            </div>
          )}
          <div ref={messagesEnd} />
        </div>
        <form className="chat-input-area" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            placeholder={`Ask about ${companyName} financials (${curr})...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button className="chat-send-btn" type="submit" disabled={loading || !input.trim()}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}