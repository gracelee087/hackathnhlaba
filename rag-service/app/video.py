"""Training video in the customer's look: export outline (EN) -> German scene script (one LLM call)
-> one PNG per scene (frames.py) -> one WAV per scene (tts.py, Piper) -> mp4 via ffmpeg.

Designed for speed after an interview: one LLM call, offline TTS, still-image video. Everything lands in
data/videos/<job>/ and the mp4 is served by GET /videos/{name}.
"""
import json
import logging
import re
import shutil
import subprocess
import time
import uuid
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from . import config, frames, llm, tts

logger = logging.getLogger(__name__)
VIDEO_DIR = config.DATA_DIR / "videos"
FFMPEG = shutil.which("ffmpeg") or "ffmpeg"


class VideoError(RuntimeError):
    pass


class Scene(BaseModel):
    kind: Literal["title", "section", "history", "quiz", "outro"]
    title: str = Field(..., description="output language, max 8 words")
    bullets: list[str] = Field(default_factory=list, description="output language, max 4 items, each max 10 words; numbers, dates, form names unchanged")
    note: str = Field("", description="output language, e.g. 'Gilt seit 01.07.2025' / 'Applies since 1 July 2025' or the source; empty if none")
    narration: str = Field(..., description="spoken narration in the output language, max 45 words, no bullet symbols")


class VideoScript(BaseModel):
    title: str
    scenes: list[Scene]


SCRIPT_SYSTEM = """You turn a training outline (JSON) into the script of a SHORT training video (60-90 seconds in total) in the
OUTPUT LANGUAGE named at the end of the user message (German or English).
Scenes, in this order:
1. one "title" scene: welcome the learner, say what they will be able to do afterwards (bullets = the learning objectives, max 3).
2. two to four "section" scenes from the outline sections: bullets = the key points (max 4, each max 10 words), note = "Gilt seit <date>" when
   the section states a date; narration = the section's speaker_script condensed to max 45 words.
3. exactly one "history" scene ONLY if validity_notes is not empty: bullets = the historical rules as "Bis <Datum>: ..." (max 3);
   narration says clearly that these rules no longer apply and what applies instead.
4. one "quiz" scene: bullets = 2-3 questions from quiz_seeds; narration invites the learner to answer them.
5. one "outro" scene: title = the training title; bullets = max 2 next steps (e.g. who to ask); narration thanks the learner.
Language: the OUTPUT LANGUAGE (German: "du" form, employee-facing; English: plain second person), spoken and simple. Keep product
names, form and system names (KA-01, KV-02, EXC-REQ, KreditPortal, RatingTool), percentages, amounts and dates exactly as in the
outline; German dates as DD.MM.YYYY, English dates as "1 July 2025". Total narration max 230 words.
Never present a historical rule as current. Return every scene with all fields."""


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40] or "training"


def _run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise VideoError(f"ffmpeg failed: {r.stderr[-600:]}")


def build(topic: str, as_of: str, audience: str, outline: dict, lang: str = "de") -> dict:
    """outline = TrainingOutline.model_dump(). Returns a JSON-able job description incl. the mp4 name and timings."""
    t_all = time.time()
    timings: dict[str, float] = {}
    t0 = time.time()
    try:
        script = llm.structured(SCRIPT_SYSTEM, f"AS-OF DATE: {as_of}\nAUDIENCE: {audience}\n\nOUTLINE:\n{json.dumps(outline, ensure_ascii=False)}"
                                f"{llm._lang_block(lang)}", VideoScript, max_tokens=5000)
    except llm.LLMError as e:
        raise VideoError(f"script generation failed: {e}")
    timings["script_s"] = round(time.time() - t0, 1)

    job = VIDEO_DIR / f"{_slug(topic)}_{uuid.uuid4().hex[:6]}"
    job.mkdir(parents=True, exist_ok=True)
    total = len(script.scenes)
    lang = llm.lang_key(lang)
    voice = tts.available(lang)
    segments, scenes_out = [], []
    timings["tts_s"] = timings["render_s"] = timings["ffmpeg_s"] = 0.0
    for i, sc in enumerate(script.scenes, 1):
        png, wav, seg = job / f"scene_{i}.png", job / f"scene_{i}.wav", job / f"seg_{i}.mp4"
        t0 = time.time()
        dur = tts.synthesize(sc.narration, wav, lang) if voice else 0.0
        timings["tts_s"] += time.time() - t0
        t0 = time.time()
        frames.render_scene({"kind": sc.kind, "title": sc.title, "bullets": sc.bullets, "note": sc.note, "caption": sc.narration,
                             "index": i, "total": total, "audience": audience, "lang": lang}, png)
        timings["render_s"] += time.time() - t0
        t0 = time.time()
        if voice and wav.exists():
            length = dur + 0.7
            _run([FFMPEG, "-y", "-loglevel", "error", "-loop", "1", "-i", str(png), "-i", str(wav), "-af", "apad=pad_dur=0.7",
                  "-t", f"{length:.2f}", "-r", "25", "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
                  "-c:a", "aac", "-ar", "44100", "-shortest", str(seg)])
        else:  # no voice: 6 s per scene with silence
            length = 6.0
            _run([FFMPEG, "-y", "-loglevel", "error", "-loop", "1", "-i", str(png), "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
                  "-t", f"{length:.2f}", "-r", "25", "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
                  "-c:a", "aac", "-shortest", str(seg)])
        timings["ffmpeg_s"] += time.time() - t0
        segments.append(seg)
        scenes_out.append({"index": i, "kind": sc.kind, "title": sc.title, "bullets": sc.bullets, "note": sc.note,
                           "narration": sc.narration, "seconds": round(length, 1)})

    t0 = time.time()
    lst = job / "segments.txt"
    lst.write_text("".join(f"file '{s.name}'\n" for s in segments), encoding="utf-8")
    out = job / "training.mp4"
    _run([FFMPEG, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264", "-pix_fmt", "yuv420p",
          "-c:a", "aac", "-movflags", "+faststart", str(out)])
    timings["ffmpeg_s"] += time.time() - t0
    for k in timings:
        timings[k] = round(timings[k], 1)
    timings["total_s"] = round(time.time() - t_all, 1)
    name = f"{job.name}/training.mp4"
    (job / "script.json").write_text(json.dumps({"title": script.title, "scenes": scenes_out}, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("training video %s: %s scenes, %.1f s, timings %s", name, total, sum(s["seconds"] for s in scenes_out), timings)
    return {"title": script.title, "file": name, "url": f"/videos/{name}", "language": lang, "voice": voice, "audience": audience,
            "as_of": as_of, "duration_s": round(sum(s["seconds"] for s in scenes_out), 1), "scenes": scenes_out, "timings": timings}


def video_path(name: str) -> Path:
    p = (VIDEO_DIR / name).resolve()
    if VIDEO_DIR.resolve() not in p.parents or p.suffix != ".mp4" or not p.exists():
        raise FileNotFoundError(name)
    return p
