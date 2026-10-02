from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import forecast

app = FastAPI(
    title="MSME Cockpit AI Service",
    description="Forecasting and prediction endpoints for the MSME Operating Cockpit",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to the Node backend's URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router)


# UptimeRobot (and most uptime monitors) ping with a HEAD request, not GET —
# explicitly allowing HEAD here prevents a false "Down" alert (405 Method Not
# Allowed on HEAD was being misread as the service being down, even though
# GET requests and the actual AI endpoints were working fine).
@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}