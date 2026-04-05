"""
FinAnalytica — AI Financial Assistant Router
Uses Groq API (LLaMA 3) for financial analysis chat.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api", tags=["ai"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class ChatRequest(BaseModel):
    message: str
    api_key: Optional[str] = None  # Optional client-side key override
    context: Optional[dict] = None  # Financial context to inject


SYSTEM_PROMPT = """You are FinAnalytica AI, a senior financial analyst assistant. 
You have deep expertise in:
- Financial statement analysis (Income Statement, Balance Sheet, Cash Flow)
- Financial ratio interpretation (profitability, leverage, liquidity, efficiency, growth)
- DCF Valuation and WACC computation
- DuPont decomposition
- Indian equity markets (NSE/BSE)
- CFA-level financial theory

When financial data is provided as context, analyze it thoroughly and provide:
1. Clear, actionable insights
2. Specific numbers and ratios to support your analysis
3. Comparison with industry benchmarks when relevant
4. Risk factors and concerns
5. Forward-looking observations

Format your responses with clear sections using markdown. Be concise but thorough.
Use ₹ for Indian currency and quote values in Crores where applicable."""


def _build_context_text(context: dict) -> str:
    """Build context string from financial data."""
    parts = ["\n\n--- FINANCIAL DATA CONTEXT ---\n"]
    if "company_name" in context:
        parts.append(f"Company: {context['company_name']}")
    if "ticker" in context:
        parts.append(f"Ticker: {context['ticker']}")
    if "current_price" in context:
        parts.append(f"Current Price: ₹{context['current_price']}")
    if "market_cap" in context:
        parts.append(f"Market Cap: ₹{context['market_cap']} Cr")
    if "ratios" in context and context["ratios"]:
        latest = context["ratios"][-1]
        parts.append("\nLatest Year Ratios:")
        skip = {"year", "flags", "revenue", "net_income", "ebit_val",
                "total_debt", "total_equity", "free_cash_flow"}
        for key, val in latest.items():
            if key not in skip and val is not None:
                parts.append(f"  {key}: {val}")
    if "valuation" in context and context["valuation"]:
        v = context["valuation"]
        parts.append("\nDCF Valuation:")
        parts.append(f"  Intrinsic Value/Share: ₹{v.get('intrinsic_per_share', 'N/A')}")
        parts.append(f"  WACC: {v.get('wacc', 'N/A')}")
        parts.append(f"  Enterprise Value: ₹{v.get('enterprise_value', 'N/A')} Cr")
    parts.append("\n--- END CONTEXT ---")
    return "\n".join(parts)


@router.post("/ai/chat")
async def ai_chat(req: ChatRequest):
    """Chat with the AI Financial Assistant using Groq."""
    try:
        from groq import Groq

        # Use server-side key from .env, or client-provided override
        key = req.api_key if req.api_key else GROQ_API_KEY
        if not key:
            raise HTTPException(
                status_code=400,
                detail="No API key configured. Set GROQ_API_KEY in .env or provide one in the UI."
            )

        client = Groq(api_key=key)

        # Build messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if req.context:
            messages.append({
                "role": "system",
                "content": _build_context_text(req.context),
            })

        messages.append({"role": "user", "content": req.message})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.5,
            max_tokens=2048,
        )

        return {"response": response.choices[0].message.content}

    except ImportError:
        raise HTTPException(status_code=500, detail="groq package not installed. Run: pip install groq")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
