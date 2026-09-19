import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.forecast_schemas import HistoricalPoint
from app.services.cashflow_model import generate_cashflow_forecast, _linear_trend_forecast


def test_linear_trend_with_no_data_repeats_zero():
    result = _linear_trend_forecast([], 5)
    assert result == [0.0] * 5


def test_linear_trend_with_single_point_repeats_that_value():
    result = _linear_trend_forecast([100.0], 3)
    assert result == [100.0, 100.0, 100.0]


def test_linear_trend_with_increasing_values_projects_upward():
    # Perfectly linear: 10, 20, 30, 40 -> next should continue upward (~50)
    result = _linear_trend_forecast([10.0, 20.0, 30.0, 40.0], 1)
    assert result[0] > 40.0


def test_linear_trend_never_goes_negative():
    # Steeply declining values shouldn't produce negative revenue predictions
    result = _linear_trend_forecast([100.0, 50.0, 10.0], 5)
    assert all(v >= 0.0 for v in result)


def test_generate_cashflow_forecast_produces_correct_horizon_length():
    history = [
        HistoricalPoint(date="2026-01-01", revenue=1000, expenses=400),
        HistoricalPoint(date="2026-01-02", revenue=1100, expenses=420),
        HistoricalPoint(date="2026-01-03", revenue=1050, expenses=410),
    ]
    points = generate_cashflow_forecast(history, horizon_days=7)
    assert len(points) == 7
    # Dates should be sequential, continuing after the last history date
    assert points[0].date == "2026-01-04"
    assert points[6].date == "2026-01-10"


def test_generate_cashflow_forecast_cash_balance_accumulates():
    history = [
        HistoricalPoint(date="2026-01-01", revenue=1000, expenses=200),
        HistoricalPoint(date="2026-01-02", revenue=1000, expenses=200),
    ]
    points = generate_cashflow_forecast(history, horizon_days=3)
    # Cash balance should be a running total, so it should be non-decreasing
    # here since revenue consistently exceeds expenses in the history
    for i in range(1, len(points)):
        assert points[i].predicted_cash_balance >= points[i - 1].predicted_cash_balance
