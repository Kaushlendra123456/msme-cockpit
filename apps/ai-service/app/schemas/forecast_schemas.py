from pydantic import BaseModel
from typing import List


class HistoricalPoint(BaseModel):
    date: str  # ISO format YYYY-MM-DD
    revenue: float
    expenses: float


class ForecastRequest(BaseModel):
    history: List[HistoricalPoint]
    horizon_days: int = 30


class ForecastPoint(BaseModel):
    date: str
    predicted_revenue: float
    predicted_expenses: float
    predicted_cash_balance: float


class ForecastResponse(BaseModel):
    horizon_days: int
    points: List[ForecastPoint]
    method: str
