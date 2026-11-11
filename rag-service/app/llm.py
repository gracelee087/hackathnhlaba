"""All Claude calls live here, behind two functions, so the model/provider can be
swapped in one place (judging criterion 5: fit with the Helaba AI platform)."""
from typing import TypeVar

import anthropic
from pydantic import BaseModel

from . import config
from .models import CheckVerdict, NextQuestion, TrainingOutline

T = TypeVar("T", bound=BaseModel)
_client: anthropic.Anthropic | None = None


class LLMError(RuntimeError):
    pass


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY or None)
    return _client


def describe() -> str:
    """Human-readable LLM name for /health."""
    if config.LLM_BACKEND == "hip":
        return f"{config.HIP_LLM_MODEL} via hip gateway"
    return config.CLAUDE_MODEL


def structured(system: str, user: str, output_model: type[T], max_tokens: int = 4000) -> T:
    """Ask the configured LLM for an instance of output_model, grounded on the prompt only."""
    if config.LLM_BACKEND == "hip":
        return _structured_hip(system, user, output_model, max_tokens)
    return _structured_claude(system, user, output_model, max_tokens)


# -- hip: JAIF gateway, OpenAI-compatible chat; JSON requested in the prompt and validated here --
_hip_client = None


def _get_hip_client():
    global _hip_client
    if _hip_client is None:
        from openai import OpenAI
        _hip_client = OpenAI(base_url=config.HIP_BASE_URL, api_key=config.HIP_API_KEY)
    return _hip_client


def _extract_json(text: str) -> str:
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("no JSON object in the response")
    return text[start:end + 1]


def _structured_hip(system: str, user: str, output_model: type[T], max_tokens: int) -> T:
    import json

    import openai
    from pydantic import ValidationError

    if not config.HIP_API_KEY:
        raise LLMError("HIP_API_KEY is not set in rag-service/.env (LLM_BACKEND=hip)")
    schema = json.dumps(output_model.model_json_schema())
    messages = [
        {"role": "system", "content": system + "\n\nRespond with a single JSON object only, no prose and "
                                               "no code fences, matching this JSON schema:\n" + schema},
        {"role": "user", "content": user},
    ]
    last_err = ""
    for _attempt in range(2):
        try:
            resp = _get_hip_client().chat.completions.create(
                model=config.HIP_LLM_MODEL, messages=messages, max_tokens=max_tokens, temperature=0)
        except openai.APIError as e:
            raise LLMError(f"hip gateway error: {e}") from e
        content = (resp.choices[0].message.content or "") if resp.choices else ""
        try:
            return output_model.model_validate_json(_extract_json(content))
        except (ValueError, ValidationError) as e:
            last_err = str(e)[:400]
            messages += [{"role": "assistant", "content": content},
                         {"role": "user", "content": f"That was not valid: {last_err}\nReturn only the corrected JSON object."}]
    raise LLMError(f"{config.HIP_LLM_MODEL} did not return valid {output_model.__name__} JSON: {last_err}")


# -- claude: Anthropic API, native structured outputs -------------------------
def _structured_claude(system: str, user: str, output_model: type[T], max_tokens: int) -> T:
    if not config.ANTHROPIC_API_KEY:
        raise LLMError("ANTHROPIC_API_KEY is not set in rag-service/.env; /check and outline export need Claude")
    try:
        resp = _get_client().messages.parse(
            model=config.CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_format=output_model,
        )
    except anthropic.APIError as e:
        raise LLMError(f"Claude API error: {e}") from e
    if resp.stop_reason == "refusal":
        detail = getattr(resp.stop_details, "explanation", None)
        raise LLMError(f"model refused: {detail}")
    if resp.parsed_output is None:
        raise LLMError(f"no structured output (stop_reason={resp.stop_reason})")
    return resp.parsed_output


LANG_NAMES = {"en": "English", "de": "German"}


def lang_key(lang: str | None) -> str:
    return (lang or "en").lower()[:2] if (lang or "en").lower()[:2] in LANG_NAMES else "en"


def _lang_block(lang: str | None) -> str:
    name = LANG_NAMES[lang_key(lang)]
    extra = " Address the expert informally (du) where a question is addressed to a person." if lang_key(lang) == "de" else ""
    return (f"\n\nOUTPUT LANGUAGE: {name}. Write every free-text field in {name}, whatever language the evidence or the "
            f"conversation is in (the knowledge base mixes English and German). Keep form, system and product names, "
            f"numbers, percentages and dates unchanged.{extra}")


def _evidence_block(hits: list[dict]) -> str:
    if not hits:
        return "(no evidence retrieved)"
    return "\n\n".join(
        f"[{h['id']}] status={h['validity_status']}; {h['citation']}\n{h['text']}" for h in hits
    )


CHECK_SYSTEM = """You are the validity checker of a company knowledge base (internal policies, procedures, e-mails and expert interviews).
You receive a STATEMENT, an AS-OF date and EVIDENCE chunks retrieved from the knowledge base.
Each evidence item has an id, a validity window and a validity status judged at the as-of date:
current, possibly_outdated (superseded before the as-of date) or not_yet_valid.

Judge the statement ONLY from the evidence. Verdicts:
- correct: the statement matches evidence that is current at the as-of date.
- possibly_outdated: the statement matches possibly_outdated evidence, and current evidence says something different.
- contradicted: current evidence says something different and no historical evidence supports the statement.
- plausible: the evidence is consistent with the statement but does not directly confirm it.
- unsupported: the evidence does not cover the statement.

what_applies_today: state the rule that is current at the as-of date according to the evidence,
or "not covered by the knowledge base". evidence_ids: only ids you actually relied on. Be concise."""


def check_statement(statement: str, as_of: str, hits: list[dict], glossary: str = "", lang: str = "en") -> CheckVerdict:
    glo = f"\n\n{glossary}" if glossary else ""
    user = f"AS-OF DATE: {as_of}\n\nSTATEMENT: {statement}\n\nEVIDENCE:\n{_evidence_block(hits)}{glo}{_lang_block(lang)}"
    return structured(CHECK_SYSTEM, user, CheckVerdict)


OUTLINE_SYSTEM = """You turn retrieved expert knowledge into a training outline for employees of the company.
Use ONLY the evidence. Every key point must be backed by evidence ids.
Rules whose status is possibly_outdated go into validity_notes, phrased as "Historically (until <date>): ...",
and must never be presented as current. Tailor depth and wording to the audience
(beginner / advanced / expert). quiz_seeds: 3-5 one-line questions a quiz could ask, each answerable from the evidence.
speaker_script (per section): the narration a trainer or a generated video would speak for that section. Spoken prose in the
second person, 60-120 words, beginner = plain words and one concrete example, expert = precise and short. Name the rule, the
number and the date it applies from; say "until <date> the rule was ..." only for historical rules, never as current.
Do not put evidence ids into the script; they stay in evidence_ids."""


def training_outline(topic: str, audience: str, as_of: str, hits: list[dict], lang: str = "en") -> TrainingOutline:
    user = (f"TOPIC: {topic}\nAUDIENCE: {audience}\nAS-OF DATE: {as_of}\n\n"
            f"EVIDENCE:\n{_evidence_block(hits)}{_lang_block(lang)}")
    return structured(OUTLINE_SYSTEM, user, TrainingOutline, max_tokens=9000)


INTERVIEW_SYSTEM = """You are an AI interviewer conducting a knowledge-transfer interview with an employee who is about to leave the company.
Goal: capture what only this person knows (exceptions, workarounds, who to call, what goes wrong), confirm what is written,
surface beliefs that are outdated, and record handover status (open tasks, contacts, deadlines).

You receive the TOPIC, EVIDENCE from the knowledge base (documents with validity status current / possibly_outdated,
plus already captured interview facts), and the CONVERSATION so far. Each earlier answer may carry a kb_verdict from the
automatic check: correct, plausible, possibly_outdated, contradicted, unsupported (= not in any document) or unchecked.

Produce exactly ONE next question. Choose the reason:
- opening: no turns yet. Ask a broad, concrete question about the expert's daily work on the topic.
- contradiction: the last answer is possibly_outdated or contradicted. Gently confront it: quote what the current document
  says (with its date) and ask whether the expert knows of a newer rule, an exception, or whether practice differs from the policy.
- deepen: the last answer is correct or plausible but general. Ask for a concrete case, an exception, an edge case, or a mistake newcomers make.
- gap: ask about something the documents do not cover (unwritten rules, judgement calls, people to call, tools, timing) or that the last
  unsupported answer hints at. Prefer this when the written rules on the topic are already confirmed.
- clarify: the last answer used an abbreviation, system, form or jargon the knowledge base does not know (listed under UNKNOWN TERMS),
  or it is unclear which department / process it belongs to. Do NOT guess what it means: ask the expert to explain the term in one
  or two sentences (what it is, where it lives, who uses it). The explanation becomes a definition in the glossary.
- handover: after the know-how is covered, ask about open tasks, pending cases, contacts and deadlines the successor must take over.
- closing: the topic and handover are sufficiently covered (usually after 6 or more turns). Thank the expert and ask if anything is missing.

Rules: never ask for something a current document already answers unless you are verifying an outdated belief. Do not repeat a
question already asked. Keep the question under 45 words, conversational, in the OUTPUT LANGUAGE given at the end of the user
message (English or German; the evidence may be in either language), addressed to the expert by first name.
rationale: 1-2 sentences for the interviewer screen (what the question targets and why). evidence_ids: only ids you used.
covered_topics / remaining_topics: short labels (2-5 words each) of sub-topics already covered and still worth asking."""


def next_question(expert: str, topic: str, turns: list[dict], as_of: str, hits: list[dict],
                  uncovered: list[str] | None = None, unknown_terms: list[str] | None = None,
                  glossary: str = "", lang: str = "en") -> NextQuestion:
    convo = "\n\n".join(f"Q{i + 1}: {t['question']}\nA{i + 1} [{t.get('kb_verdict') or 'unchecked'}]: {t['answer']}"
                        for i, t in enumerate(turns)) or "(no turns yet)"
    cov = ("\n\nCONCEPTS OF THIS DEPARTMENT THE EXPERT HAS NOT YET SAID ANYTHING ABOUT (prefer these for gap / deepen questions):\n"
           + "\n".join(uncovered)) if uncovered else ""
    unk = ("\n\nUNKNOWN TERMS IN THE LAST ANSWER (ask the expert to explain them before anything else; reason = clarify):\n"
           + ", ".join(unknown_terms)) if unknown_terms else ""
    glo = f"\n\n{glossary}" if glossary else ""
    user = (f"EXPERT: {expert}\nTOPIC: {topic}\nAS-OF DATE: {as_of}\n\nEVIDENCE:\n{_evidence_block(hits)}{glo}{cov}{unk}\n\n"
            f"CONVERSATION SO FAR:\n{convo}{_lang_block(lang)}")
    return structured(INTERVIEW_SYSTEM, user, NextQuestion, max_tokens=1500)
