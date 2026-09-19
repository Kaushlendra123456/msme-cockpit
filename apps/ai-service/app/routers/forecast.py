from fastapi import APIRouter
from app.schemas.forecast_schemas import ForecastRequest, ForecastResponse
from app.services.cashflow_model import generate_cashflow_forecast

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.post("/cash-flow", response_model=ForecastResponse)
def cash_flow_forecast(payload: ForecastRequest):
    """
    Called by the Node backend with the business's historical daily
    revenue/expense totals. Returns a day-by-day projection for the
    requested horizon (typically 30 or 90 days).
    """
    points = generate_cashflow_forecast(payload.history, payload.horizon_days)
    return ForecastResponse(
        horizon_days=payload.horizon_days,
        points=points,
        method="linear-trend-baseline",
    )
