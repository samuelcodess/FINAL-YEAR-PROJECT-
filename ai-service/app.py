from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Employee Performance AI Service")


class KpiInput(BaseModel):
    id: int
    kpi_name: str
    weight_percentage: float = Field(..., ge=0, le=100)
    description: str = ""


class EvaluationRequest(BaseModel):
    employee_name: str = Field(..., description="Display name of the employee")
    evidence: str = Field(..., min_length=40, description="Submitted evidence for evaluation")
    remarks: str = Field(default="", description="Optional evaluator context")
    kpis: list[KpiInput] = Field(default_factory=list)


class EvaluationDetail(BaseModel):
    kpi_id: int
    score: float = Field(..., ge=0, le=100)
    rationale: str


class EvaluationResponse(BaseModel):
    employee_name: str
    overall_score: float = Field(..., ge=0, le=100)
    summary: str
    strengths: list[str]
    risks: list[str]
    kpi_scores: list[EvaluationDetail]


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


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def tokenize(value: str) -> list[str]:
    cleaned = "".join(character.lower() if character.isalnum() else " " for character in value)
    return [part for part in cleaned.split() if len(part) >= 3]


def build_keywords(kpi: KpiInput) -> list[str]:
    ordered: list[str] = []

    for token in tokenize(f"{kpi.kpi_name} {kpi.description}"):
        if token not in ordered:
            ordered.append(token)

    return ordered


def evaluate_detail(tokens: list[str], kpi: KpiInput) -> EvaluationDetail:
    positive_signals = {
        "achieved",
        "improved",
        "delivered",
        "completed",
        "supported",
        "efficient",
        "reliable",
        "proactive",
        "clear",
        "accurate",
        "timely",
        "collaborative",
        "consistent",
        "quality",
        "initiative",
        "resolved",
        "exceeded",
        "organized",
    }
    negative_signals = {
        "late",
        "delay",
        "missed",
        "error",
        "errors",
        "incomplete",
        "unclear",
        "complaint",
        "slow",
        "issue",
        "issues",
        "failed",
        "needs",
        "revision",
        "poor",
        "absent",
        "weak",
    }
    unique_tokens = set(tokens)
    keyword_matches = sum(1 for keyword in build_keywords(kpi) if keyword in unique_tokens)
    positive_matches = sum(1 for keyword in positive_signals if keyword in unique_tokens)
    negative_matches = sum(1 for keyword in negative_signals if keyword in unique_tokens)
    evidence_length_bonus = clamp(len(tokens) / 45, 0, 1) * 8
    score = clamp(58 + evidence_length_bonus + min(keyword_matches, 4) * 4 + positive_matches * 3 - negative_matches * 4, 35, 98)

    if positive_matches > negative_matches and score >= 75:
        rationale = f"{kpi.kpi_name} scored well because the submitted evidence included several positive signals related to this KPI."
    elif negative_matches > positive_matches and score < 65:
        rationale = f"{kpi.kpi_name} needs attention because the submitted evidence included risk signals that suggest weaker delivery."
    else:
        rationale = f"{kpi.kpi_name} received a moderate score because the evidence was only partly specific for this KPI."

    return EvaluationDetail(kpi_id=kpi.id, score=round(score, 2), rationale=rationale)


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


@app.post("/evaluate", response_model=EvaluationResponse)
def evaluate(payload: EvaluationRequest) -> EvaluationResponse:
    tokens = tokenize(f"{payload.evidence}\n{payload.remarks}")
    details = [evaluate_detail(tokens, kpi) for kpi in payload.kpis]
    overall_score = round(
        sum((detail.score / 100) * kpi.weight_percentage for detail, kpi in zip(details, payload.kpis)),
        2,
    )
    ranked = sorted(details, key=lambda item: item.score, reverse=True)
    strengths = [
        next((kpi.kpi_name for kpi in payload.kpis if kpi.id == detail.kpi_id), "Unknown KPI")
        for detail in ranked[:2]
    ]
    risks = [
        next((kpi.kpi_name for kpi in payload.kpis if kpi.id == detail.kpi_id), "Unknown KPI")
        for detail in sorted(details, key=lambda item: item.score)[:2]
    ]

    return EvaluationResponse(
        employee_name=payload.employee_name,
        overall_score=overall_score,
        summary=(
            f"AI evaluation reviewed the submitted evidence for {payload.employee_name} "
            f"and estimated an overall score of {overall_score}. Stronger evidence "
            f"appeared around {', '.join(strengths) or 'the main KPIs'}, while "
            f"{', '.join(risks) or 'some KPI areas'} may need closer review."
        ),
        strengths=strengths,
        risks=risks,
        kpi_scores=details,
    )


@app.post("/recommend", response_model=RecommendationResponse)
def recommend(payload: RecommendationRequest) -> RecommendationResponse:
    return RecommendationResponse(
        employee_name=payload.employee_name,
        performance_band=performance_band(payload.overall_score),
        recommendations=build_recommendations(payload.low_areas, payload.trend),
    )
