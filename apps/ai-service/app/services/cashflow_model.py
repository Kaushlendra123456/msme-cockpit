"""
Cash flow forecasting service.

Honest note on approach: MSMEs rarely have enough clean historical data
(months of consistent daily records) for a complex model like LSTM/Prophet
to outperform a simple, explainable trend model. So this uses linear
regression on daily revenue/expenses as the baseline - small, fast,
interpretable, and it degrades gracefully with sparse data.

Once a business has 6+ months of consistent data, this is the natural
place to swap in Prophet or a gradient-boosted model without touching
the API contract (same request/response shape).
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List
from app.schemas.forecast_schemas import HistoricalPoint, ForecastPoint


def _linear_trend_forecast(values: List[float], horizon_days: int) -> List[float]:
    if len(values) < 2:
        # Not enough data to fit a trend - just repeat the last known value
        last = values[-1] if values else 0.0
        return [last] * horizon_days

    x = np.arange(len(values))
    y = np.array(values)

    # Simple least-squares linear fit: y = mx + c
    m, c = np.polyfit(x, y, 1)

    future_x = np.arange(len(values), len(values) + horizon_days)
    predictions = m * future_x + c

    # Revenue/expenses can't reasonably go negative
    return [max(0.0, float(p)) for p in predictions]


def generate_cashflow_forecast(history: List[HistoricalPoint], horizon_days: int) -> List[ForecastPoint]:
    sorted_history = sorted(history, key=lambda p: p.date)

    revenues = [p.revenue for p in sorted_history]
    expenses = [p.expenses for p in sorted_history]

    predicted_revenues = _linear_trend_forecast(revenues, horizon_days)
    predicted_expenses = _linear_trend_forecast(expenses, horizon_days)

    last_date = (
        datetime.strptime(sorted_history[-1].date, "%Y-%m-%d")
        if sorted_history
        else datetime.utcnow()
    )

    running_balance = 0.0
    points = []
    for i in range(horizon_days):
        future_date = last_date + timedelta(days=i + 1)
        rev = predicted_revenues[i]
        exp = predicted_expenses[i]
        running_balance += rev - exp
        points.append(
            ForecastPoint(
                date=future_date.strftime("%Y-%m-%d"),
                predicted_revenue=round(rev, 2),
                predicted_expenses=round(exp, 2),
                predicted_cash_balance=round(running_balance, 2),
            )
        )

    return points
