from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Employee Performance AI Service")


class KpiInput(BaseModel):
    id: int
    kpi_name: str
    weight_percentage: float = Field(..., ge=0, le=100)
    description: str = ""


class EvaluationPeriod(BaseModel):
    start_date: str
    end_date: str


class OverallMetrics(BaseModel):
    totalTasks: int = 0
    completedTasks: int = 0
    approvedTasks: int = 0
    submittedTasks: int = 0
    overdueTasks: int = 0
    onTimeTasks: int = 0
    reviewedTasks: int = 0
    revisionRequests: int = 0
    attachmentCount: int = 0
    averageSubmissionWords: float = 0
    completionRate: float = 0
    approvalRate: float = 0
    onTimeRate: float | None = None
    revisionRate: float = 0


class KpiEvidence(BaseModel):
    kpi_id: int | None = None
    kpi_name: str | None = None
    metrics: OverallMetrics
    evidence_text: str = ""


class EvaluationRequest(BaseModel):
    employee_name: str = Field(..., description="Display name of the employee")
    remarks: str = Field(default="", description="Optional evaluator context")
    evaluation_period: EvaluationPeriod
    overall_metrics: OverallMetrics
    task_highlights: list[str] = Field(default_factory=list)
    kpi_evidence: list[KpiEvidence] = Field(default_factory=list)
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


def find_kpi_evidence(payload: EvaluationRequest, kpi: KpiInput) -> KpiEvidence | None:
    for item in payload.kpi_evidence:
        if item.kpi_id == kpi.id:
            return item

    for item in payload.kpi_evidence:
        if item.kpi_name and item.kpi_name.lower() == kpi.kpi_name.lower():
            return item

    return None


def evaluate_detail(payload: EvaluationRequest, kpi: KpiInput) -> EvaluationDetail:
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
    evidence = find_kpi_evidence(payload, kpi)
    metrics = evidence.metrics if evidence else payload.overall_metrics
    tokens = tokenize(f"{evidence.evidence_text if evidence else ''}\n{payload.remarks}\n" + "\n".join(payload.task_highlights))
    unique_tokens = set(tokens)
    keyword_matches = sum(1 for keyword in build_keywords(kpi) if keyword in unique_tokens)
    positive_matches = sum(1 for keyword in positive_signals if keyword in unique_tokens)
    negative_matches = sum(1 for keyword in negative_signals if keyword in unique_tokens)
    evidence_length_bonus = clamp(len(tokens) / 120, 0, 1) * 6
    text_quality = clamp(55 + positive_matches * 4 - negative_matches * 5 + min(keyword_matches, 5) * 3 + evidence_length_bonus, 35, 95)
    objective_timeliness = metrics.onTimeRate if metrics.onTimeRate is not None else 65
    objective_completion = metrics.completionRate
    objective_approval = metrics.approvalRate
    objective_revision_inverse = 100 - metrics.revisionRate
    objective_submission_richness = clamp(metrics.averageSubmissionWords / 2.2 + min(metrics.attachmentCount, 6) * 4, 35, 100)
    lower_name = kpi.kpi_name.lower()

    if "time" in lower_name or "deadline" in lower_name:
        score = objective_timeliness * 0.55 + objective_completion * 0.2 + objective_approval * 0.15 + text_quality * 0.1
    elif "quality" in lower_name:
        score = text_quality * 0.35 + objective_approval * 0.3 + objective_revision_inverse * 0.2 + objective_submission_richness * 0.15
    elif "product" in lower_name:
        score = objective_completion * 0.35 + objective_timeliness * 0.25 + objective_approval * 0.2 + text_quality * 0.2
    elif "target" in lower_name:
        score = objective_completion * 0.4 + objective_approval * 0.25 + objective_timeliness * 0.2 + text_quality * 0.15
    elif "commun" in lower_name:
        score = text_quality * 0.4 + objective_submission_richness * 0.25 + objective_approval * 0.2 + objective_timeliness * 0.15
    elif "initiative" in lower_name:
        score = text_quality * 0.35 + objective_completion * 0.25 + objective_timeliness * 0.2 + objective_submission_richness * 0.2
    else:
        score = objective_completion * 0.3 + objective_approval * 0.25 + objective_timeliness * 0.2 + text_quality * 0.25

    score = clamp(score, 35, 98)

    if score >= 80:
        rationale = f"{kpi.kpi_name} scored strongly because objective task outcomes and review evidence were healthy for this KPI."
    elif score < 65:
        rationale = f"{kpi.kpi_name} needs attention because the task evidence showed weaker delivery patterns or insufficient strong evidence."
    else:
        rationale = f"{kpi.kpi_name} received a moderate score because the employee showed mixed objective signals and partial evidence alignment."

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
    details = [evaluate_detail(payload, kpi) for kpi in payload.kpis]
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
            f"AI evaluation reviewed task delivery data for {payload.employee_name} "
            f"between {payload.evaluation_period.start_date} and {payload.evaluation_period.end_date}. "
            f"{payload.overall_metrics.totalTasks} tasks were analyzed and estimated an overall score of {overall_score}. Stronger evidence "
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
