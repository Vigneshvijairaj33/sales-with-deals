from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI(title="AI Scoring Service", version="1.0.0")


class PriceEntry(BaseModel):
    price: float
    recorded_at: str  # ISO timestamp string


class ScoringRequest(BaseModel):
    current_price: float
    original_price: float
    price_history: List[PriceEntry]
    category_avg_discount: float  # 0.0 – 1.0


class ScoringResponse(BaseModel):
    value_score: int               # [0, 100]
    fake_discount_flag: bool
    low_confidence_score: bool


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/score", response_model=ScoringResponse)
def score(req: ScoringRequest) -> ScoringResponse:
    from scoring import compute_score
    return compute_score(req)
