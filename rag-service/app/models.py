"""Request / response schemas. These are the team API contract (see README)."""
from typing import Literal, Optional

from pydantic import BaseModel, Field


class DocMeta(BaseModel):
    """Metadata the ingesting person supplies for a document."""
    doc_id: Optional[str] = Field(None, description="Stable id; default = filename stem")
    title: str
    doc_type: str = Field("other", description="circular | amendment | manual | presentation | concept | email | other")
    version: str = ""
    valid_from: str = Field(..., description="YYYY-MM-DD, first day the content applies")
    valid_to: Optional[str] = Field(None, description="YYYY-MM-DD (exclusive). Omit if still valid")
    supersedes: Optional[str] = Field(None, description="doc_id of the older version this one replaces")
    owner: str = "company"
    approved: bool = Field(True, description="False = visible only to reviewers until approved")
    audience: str = "all"
    department: Optional[str] = Field(None, description="taxonomy key; omitted = classified automatically at ingestion")
    language: str = Field("en", description="en | de - language of the document text (the corpus may mix both)")


class LocalIngest(BaseModel):
    path: str
    meta: DocMeta


class FactIn(BaseModel):
    """One piece of knowledge captured by the Interview Interface."""
    expert: str
    expert_role: str = Field("", description="Role / job title of the expert, e.g. Senior Credit Analyst")
    topic: str
    question: str
    answer: str
    valid_from: Optional[str] = Field(None, description="YYYY-MM-DD; default = interviewed_at")
    valid_to: Optional[str] = None
    interviewed_at: Optional[str] = Field(None, description="YYYY-MM-DD; default = today")
    tags: list[str] = []
    source_hint: str = Field("", description="Document the expert referred to, if any")
    department: Optional[str] = Field(None, description="taxonomy key; omitted = classified automatically")
    lang: str = Field("en", description="en | de - language of the answer and of the kb_explanation returned")


class ReviewIn(BaseModel):
    reviewer: str = "expert"
    note: str = ""


class CheckIn(BaseModel):
    statement: str
    as_of: Optional[str] = Field(None, description="YYYY-MM-DD; default = today")
    k: int = 8
    department: Optional[str] = Field(None, description="scope the evidence to one department")
    lang: str = Field("en", description="en | de - language of explanation and what_applies_today")


# ── Structured outputs produced by Claude ───────────────────────────
class CheckVerdict(BaseModel):
    verdict: Literal["correct", "plausible", "possibly_outdated", "contradicted", "unsupported"]
    explanation: str
    what_applies_today: str
    evidence_ids: list[str]


class OutlineSection(BaseModel):
    title: str
    key_points: list[str]
    evidence_ids: list[str]
    speaker_script: str = Field("", description="what the narrator says for this section: spoken prose, 60-120 words, "
                                                "audience-tailored, states the current rule with its date; no evidence ids in the text")


class TrainingOutline(BaseModel):
    title: str
    audience: str
    learning_objectives: list[str]
    sections: list[OutlineSection]
    validity_notes: list[str]
    quiz_seeds: list[str]


# ── AI interviewer ──────────────────────────────────────────────────
class InterviewTurn(BaseModel):
    question: str
    answer: str
    kb_verdict: Optional[str] = Field(None, description="verdict POST /facts gave this answer, if stored")
    unknown_terms: list[str] = Field(default_factory=list, description="unknown_terms POST /facts returned for this answer")


class InterviewNextIn(BaseModel):
    """Conversation so far; the service proposes the next question, grounded in the knowledge base."""
    expert: str
    expert_role: str = Field("", description="Role / job title of the expert, e.g. Senior Credit Analyst")
    topic: str
    turns: list[InterviewTurn] = []
    as_of: Optional[str] = Field(None, description="YYYY-MM-DD; default = today")
    k: int = 10
    department: Optional[str] = Field(None, description="scope evidence and coverage to one department")
    lang: str = Field("en", description="en | de - language of the generated question and rationale")


class NextQuestion(BaseModel):
    question: str
    reason: Literal["opening", "gap", "contradiction", "deepen", "clarify", "handover", "closing"]
    rationale: str = Field(..., description="One or two sentences for the interviewer screen: why this question now")
    evidence_ids: list[str] = Field(default_factory=list, description="KB chunks this question is grounded on")
    covered_topics: list[str] = Field(default_factory=list)
    remaining_topics: list[str] = Field(default_factory=list)
