import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 60000,
});

export async function analyzeTicker(ticker, years = 10) {
  const { data } = await api.get(`/analyze/${encodeURIComponent(ticker)}`, {
    params: { years },
  });
  return data;
}

export const analyzeCompany = analyzeTicker;

export async function runValuation(params) {
  const { data } = await api.post('/valuation', params);
  return data;
}

export async function aiChat(message, apiKey = null, context = null) {
  const { data } = await api.post('/ai/chat', {
    message,
    api_key: apiKey,
    context,
  });
  return data;
}

export default api;