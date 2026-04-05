"""
FinAnalytica — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .routers import analysis, valuation, ai_assistant

app = FastAPI(
    title="FinAnalytica API",
    description="Financial Statement Analysis & Valuation Engine",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis.router)
app.include_router(valuation.router)
app.include_router(ai_assistant.router)


@app.get("/")
async def root():
    return {
        "name": "FinAnalytica API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "analyze_ticker": "GET /api/analyze/{ticker}",
            "analyze_csv": "POST /api/analyze/csv",
            "valuation": "POST /api/valuation",
            "ai_chat": "POST /api/ai/chat",
        },
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}
