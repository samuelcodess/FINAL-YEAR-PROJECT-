from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Employee Performance AI Service")


class RecommendationRequest(BaseModel):
    employee_name: str = Field(..., description="Display name of the employee")
    overall_score: float = Field(..., ge=0, le=100)
    low_areas: list[str] = Field(default_factory=list)
    trend: Literal["improving", "stable", "declining"] = "stable"


class RecommendationItem(BaseModel):
    title: str
    reason: str
    action_type: Literal["training", "mentorship", "coaching"]
    priority: Literal["low", "medium", "high"]


class RecommendationResponse(BaseModel):
    employee_name: str
    performance_band: Literal["excellent", "good", "needs_support"]
    recommendations: list[RecommendationItem]


def performance_band(score: float) -> str:
    if score >= 85:
        return "excellent"
    if score >= 70:
        return "good"
    return "needs_support"


def build_recommendations(low_areas: list[str], trend: str) -> list[RecommendationItem]:
    items: list[RecommendationItem] = []

    for area in low_areas:
        items.append(
            RecommendationItem(
                title=f"Strengthen {area}",
                reason=f"{area} appears below target and should receive focused support.",
                action_type="training",
                priority="high" if trend == "declining" else "medium",
            )
        )

    if trend == "declining":
        items.append(
            RecommendationItem(
                title="Start manager coaching check-ins",
                reason="Recent performance direction is declining and needs closer follow-up.",
                action_type="coaching",
                priority="high",
            )
        )

    if not items:
        items.append(
            RecommendationItem(
                title="Maintain current development plan",
                reason="No critical weakness was supplied, so the employee can continue the active plan.",
                action_type="mentorship",
                priority="low",
            )
        )

    return items


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "employee-performance-ai"}


@app.post("/recommend", response_model=RecommendationResponse)
def recommend(payload: RecommendationRequest) -> RecommendationResponse:
    return RecommendationResponse(
        employee_name=payload.employee_name,
        performance_band=performance_band(payload.overall_score),
        recommendations=build_recommendations(payload.low_areas, payload.trend),
    )
