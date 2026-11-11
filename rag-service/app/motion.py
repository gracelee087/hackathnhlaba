"""Motion-graphics training video (HyperFrames): script scenes + narration WAVs -> HTML compositions -> mp4.

build(job, scenes, lang) writes a HyperFrames project into <job>/motion/ (index.html + compositions/s<i>.html + assets/),
renders it with `npx hyperframes render` and returns the mp4 name plus timings. The still-image pipeline in video.py stays
the fallback. Everything on screen is a function of timeline time (no random, no clocks, no network).
"""
from __future__ import annotations

import html
import json
import logging
import shutil
import subprocess
import time
import wave
from pathlib import Path

logger = logging.getLogger(__name__)

NAVY, BLUE, CORAL, MINT, LIGHT, PAPER, INK, GREY = "#004874", "#009ee3", "#fe3b61", "#a0c8af", "#ccdae3", "#f3f7fa", "#1a1a1a", "#5a6b78"
GROUND = {"title": NAVY, "section": PAPER, "history": "#fff3f0", "quiz": NAVY, "outro": NAVY}
PAD = 0.7  # silence after each narration, same as video.py
LOGO = Path(__file__).parent / "static" / "helaba_logo.svg"
NPX = shutil.which("npx") or "npx"
HF_VERSION = "0.7.54"
TEXT = {
    "de": {"eyebrow": "Schulung", "after": "Danach kannst du:", "old": "Veraltet", "quiz": "Frage", "thanks": "Danke fürs Mitmachen!",
           "contacts": "Ansprechpartner", "scene": "Szene"},
    "en": {"eyebrow": "Training", "after": "Afterwards you can:", "old": "Outdated", "quiz": "Question", "thanks": "Thank you!",
           "contacts": "Contacts", "scene": "Scene"},
}


class MotionError(RuntimeError):
    pass


def wav_seconds(p: Path) -> float:
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def _esc(s: str) -> str:
    return html.escape(s, quote=True)


def _words(s: str) -> str:
    return "".join(f'<span class="w">{_esc(w)}</span>' for w in s.split())


def _js(v: float) -> str:
    return f"{v:.2f}"


# ── scene files ──────────────────────────────────────────────────────
BASE_CSS = """
#root{position:absolute;inset:0;font-family:Inter,sans-serif;overflow:hidden}
.stage{position:absolute;inset:0}
.w{display:inline-block;margin-right:0.28em;line-height:1.02;will-change:filter}
.eyebrow{position:absolute;left:120px;top:120px;display:inline-flex;align-items:center;gap:12px;padding:10px 22px;border-radius:999px;
  font-size:24px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase}
.eyebrow i{width:12px;height:12px;border-radius:50%;background:@CORAL@;display:inline-block}
.logo{position:absolute;right:120px;bottom:74px;height:40px}
.blob{position:absolute;width:1100px;height:1100px;border-radius:50%;pointer-events:none}
.card{position:relative;background:#fff;border-radius:20px;padding:26px 34px 26px 34px;box-shadow:0 14px 40px rgba(0,72,116,0.10);
  font-size:30px;line-height:1.3;color:@INK@;margin-bottom:26px;will-change:filter}
.badge{position:absolute;left:-74px;top:26px;width:48px;height:48px;border-radius:50%;background:@BLUE@;color:#fff;font-weight:800;
  font-size:24px;display:flex;align-items:center;justify-content:center}
.counter{position:absolute;right:120px;top:120px;font-size:22px;font-weight:600;letter-spacing:0.06em}
"""


def _scene_shell(sid: str, css: str, body: str, js: str) -> str:
    return (f"<template>\n<style>\n{BASE_CSS}{css}\n</style>\n"
            f'<div id="root" data-composition-id="{sid}" data-width="1920" data-height="1080">\n<div class="stage" id="{sid}-stage">\n{body}\n</div>\n</div>\n'
            f"<script>\n(() => {{\nconst tl = gsap.timeline({{ paused: true }});\n{js}\nwindow.__timelines[\"{sid}\"] = tl;\n}})();\n</script>\n</template>\n"
            ).replace("@CORAL@", CORAL).replace("@INK@", INK).replace("@BLUE@", BLUE)


def _logo(dark: bool) -> str:
    style = "filter:brightness(0) invert(1);" if dark else ""
    return f'<img class="logo" src="assets/helaba_logo.svg" alt="" style="{style}">'


def _title_words_js(sel: str, at: float) -> str:
    return (f'tl.fromTo("{sel} .w", {{opacity:0, filter:"blur(8px)"}}, '
            f'{{opacity:1, filter:"blur(0px)", duration:0.16, ease:"power2.out", stagger:0.067}}, {_js(at)});\n')


def _eyebrow_js(sid: str, at: float = 0.2) -> str:
    return f'tl.fromTo("#{sid}-eyebrow", {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.25}}, {_js(at)});\n'


def _exit_js(sid: str, dur: float) -> str:
    return f'tl.to("#{sid}-stage", {{opacity:0, filter:"blur(10px)", duration:0.3, ease:"power3.in"}}, {_js(max(dur - 0.34, 0.5))});\n'


def _counter(i: int, total: int, lang: str, dark: bool) -> str:
    col = "rgba(255,255,255,0.55)" if dark else GREY
    return f'<div class="counter" style="color:{col}">{TEXT[lang]["scene"]} {i} / {total}</div>'


def _eyebrow(sid: str, text: str, dark: bool) -> str:
    style = "background:rgba(255,255,255,0.10);color:#fff" if dark else f"background:#e3eef5;color:{NAVY}"
    return f'<div class="eyebrow" id="{sid}-eyebrow" style="{style}"><i></i>{_esc(text)}</div>'


def scene_title(sid, sc, dur, lang, i, total):
    t = TEXT[lang]
    n = max(len(sc["bullets"]), 1)
    start = 0.42 * dur
    gap = min(0.9, 0.45 * dur / n)
    css = f"""
#{sid}-ring{{position:absolute;left:1180px;top:-260px;width:1150px;height:1150px;border-radius:50%;border:2px solid rgba(0,158,227,0.55)}}
#{sid}-ring2{{position:absolute;left:1330px;top:-110px;width:850px;height:850px;border-radius:50%;border:2px solid rgba(255,255,255,0.14)}}
#{sid}-title{{position:absolute;left:120px;top:250px;width:1180px;font-size:84px;line-height:1.2;font-weight:800;color:#fff;letter-spacing:-0.01em}}
#{sid}-after{{position:absolute;left:120px;top:600px;font-size:26px;font-weight:700;color:#ff8aa0;letter-spacing:0.06em;text-transform:uppercase}}
#{sid}-goals{{position:absolute;left:120px;top:650px;width:1100px}}
#{sid}-goals div{{position:relative;font-size:36px;line-height:1.25;color:#fff;padding:12px 0 12px 34px}}
#{sid}-goals div b{{position:absolute;left:0;top:18px;width:8px;height:38px;border-radius:4px;background:{CORAL}}}
"""
    goals = "".join(f"<div><b></b>{_esc(b)}</div>" for b in sc["bullets"])
    body = (f'<div id="{sid}-ring"></div><div id="{sid}-ring2"></div>'
            f'{_eyebrow(sid, t["eyebrow"], True)}{_counter(i, total, lang, True)}'
            f'<h1 id="{sid}-title">{_words(sc["title"])}</h1>'
            f'<div id="{sid}-after">{t["after"]}</div><div id="{sid}-goals">{goals}</div>{_logo(True)}')
    js = (f'tl.fromTo("#{sid}-ring", {{rotation:0, x:0}}, {{rotation:30, x:-40, duration:{_js(dur)}, ease:"none"}}, 0);\n'
          f'tl.fromTo("#{sid}-ring2", {{x:0, y:0}}, {{x:60, y:30, duration:{_js(dur)}, ease:"none"}}, 0);\n'
          + _eyebrow_js(sid)
          + _title_words_js(f"#{sid}-title", 0.45) +
          f'tl.fromTo("#{sid}-after", {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.2}}, {_js(start - 0.3)});\n'
          f'tl.fromTo("#{sid}-goals div", {{opacity:0, x:-24, filter:"blur(6px)"}}, {{opacity:1, x:0, filter:"blur(0px)", duration:0.5, ease:"expo.out", stagger:{_js(gap)}}}, {_js(start)});\n'
          f'tl.fromTo("#{sid}-goals div b", {{scaleY:0, transformOrigin:"top"}}, {{scaleY:1, duration:0.35, ease:"power2.out", stagger:{_js(gap)}}}, {_js(start + 0.1)});\n'
          + _exit_js(sid, dur))
    return _scene_shell(sid, css, body, js)


def _cards_js(sid: str, n: int, dur: float, first: float = 1.2, hold: float = 2.0) -> tuple[str, list[float]]:
    span = max(dur - first - hold, 0.8)
    gap = span / max(n, 1)
    times = [first + k * gap for k in range(n)]
    js = ""
    for k, tk in enumerate(times):
        js += (f'tl.fromTo("#{sid}-c{k}", {{opacity:0, x:48, filter:"blur(6px)"}}, {{opacity:1, x:0, filter:"blur(0px)", duration:0.5, ease:"expo.out"}}, {_js(tk)});\n'
               f'tl.fromTo("#{sid}-c{k} .badge", {{scale:0.3}}, {{scale:1, duration:0.4, ease:"back.out(1.6)"}}, {_js(tk + 0.08)});\n')
    return js, times


def scene_section(sid, sc, dur, lang, i, total, history=False):
    t = TEXT[lang]
    n = len(sc["bullets"])
    rail_h = min(140 * n + 20, 760)
    css = f"""
#{sid}-blob{{left:1150px;top:300px;background:radial-gradient(circle, rgba(0,158,227,0.18) 0%, rgba(0,158,227,0) 62%)}}
#{sid}-title{{position:absolute;left:120px;top:260px;width:680px;font-size:60px;line-height:1.2;font-weight:800;color:{NAVY};letter-spacing:-0.01em}}
#{sid}-note{{position:absolute;left:120px;top:190px;display:inline-block;padding:8px 18px;border-radius:999px;font-size:24px;font-weight:700;
  background:{'#ffe1e6' if history else '#dff0ea'};color:{'#b80f2c' if history else '#1c6b4a'}}}
#{sid}-rail{{position:absolute;left:916px;top:220px;width:4px;height:{rail_h}px;background:{LIGHT};border-radius:2px}}
#{sid}-railfill{{position:absolute;left:916px;top:220px;width:4px;height:{rail_h}px;background:{CORAL if history else BLUE};border-radius:2px}}
#{sid}-cards{{position:absolute;left:992px;top:200px;width:808px}}
#{sid}-cards .card .old{{background-image:linear-gradient({CORAL},{CORAL});background-repeat:no-repeat;background-size:0% 5px;background-position:0 56%;-webkit-box-decoration-break:clone;box-decoration-break:clone;padding:0 2px}}
#{sid}-stamp{{position:absolute;left:560px;top:700px;padding:14px 34px;border:8px solid {CORAL};border-radius:18px;color:{CORAL};font-size:72px;
  font-weight:900;letter-spacing:0.12em;text-transform:uppercase}}
"""
    cards = "".join(f'<div class="card" id="{sid}-c{k}"><span class="badge">{k + 1}</span>'
                    + (f'<span class="old">{_esc(b)}</span>' if history else _esc(b)) + "</div>" for k, b in enumerate(sc["bullets"]))
    note = f'<div id="{sid}-note">{_esc(sc["note"])}</div>' if sc.get("note") else ""
    stamp = f'<div id="{sid}-stamp"><span>{t["old"]}</span></div>' if history else ""
    body = (f'<div class="blob" id="{sid}-blob"></div>{_counter(i, total, lang, False)}'
            f'{_eyebrow(sid, t["eyebrow"], False)}'
            f'{note}<h2 id="{sid}-title">{_words(sc["title"])}</h2>'
            f'<div id="{sid}-rail"></div><div id="{sid}-railfill"></div><div id="{sid}-cards">{cards}</div>{stamp}{_logo(False)}')
    cards_js, times = _cards_js(sid, n, dur, first=1.3, hold=3.6 if history else 2.4)
    fill_dur = max(times[-1] - times[0] + 0.4, 0.5) if times else 0.5
    fill_at = times[0] if times else 1.0
    js = (f'tl.fromTo("#{sid}-blob", {{x:-80, y:40}}, {{x:80, y:-40, duration:{_js(dur)}, ease:"none"}}, 0);\n'
          + _eyebrow_js(sid)
          + (f'tl.fromTo("#{sid}-note", {{opacity:0, y:-16, filter:"blur(6px)"}}, {{opacity:1, y:0, filter:"blur(0px)", duration:0.35, ease:"expo.out"}}, 0.9);\n' if sc.get("note") else "")
          + _title_words_js(f"#{sid}-title", 0.4)
          + f'tl.fromTo("#{sid}-rail", {{scaleY:0, transformOrigin:"top"}}, {{scaleY:1, duration:0.6, ease:"power2.inOut"}}, 0.8);\n'
          + f'tl.fromTo("#{sid}-railfill", {{scaleY:0, transformOrigin:"top"}}, {{scaleY:1, duration:{_js(fill_dur)}, ease:"power1.inOut"}}, {_js(fill_at)});\n'
          + cards_js)
    if history:
        for k, tk in enumerate(times):
            js += (f'tl.fromTo("#{sid}-c{k} .old", {{backgroundSize:"0% 5px"}}, {{backgroundSize:"100% 5px", duration:0.4, ease:"power3.inOut"}}, {_js(tk + 0.75)});\n'
                   f'tl.to("#{sid}-c{k}", {{color:"#4f5f6b", duration:0.3}}, {_js(tk + 0.8)});\n')
        stamp_at = max(dur - 3.2, (times[-1] + 1.2) if times else 1.0)
        js += (f'tl.fromTo("#{sid}-stamp", {{opacity:0, scale:1.9, rotation:-8}}, {{opacity:1, scale:1, rotation:-8, duration:0.35, ease:"back.out(1.3)"}}, {_js(stamp_at)});\n')
    js += _exit_js(sid, dur)
    return _scene_shell(sid, css, body, js)


def scene_quiz(sid, sc, dur, lang, i, total):
    t = TEXT[lang]
    n = len(sc["bullets"])
    css = f"""
#{sid}-q{{position:absolute;right:140px;top:-80px;font-size:900px;font-weight:900;color:rgba(255,255,255,0.06);line-height:1}}
#{sid}-title{{position:absolute;left:120px;top:230px;width:1500px;font-size:76px;line-height:1.2;font-weight:800;color:#fff}}
#{sid}-cards{{position:absolute;left:194px;top:400px;width:1400px;perspective:1400px}}
#{sid}-cards .card{{font-size:32px}}
#{sid}-cards .badge{{background:{CORAL}}}
"""
    cards = "".join(f'<div class="card" id="{sid}-c{k}"><span class="badge">{k + 1}</span>{_esc(b)}</div>' for k, b in enumerate(sc["bullets"]))
    body = (f'<div id="{sid}-q" data-layout-ignore>?</div>{_eyebrow(sid, t["quiz"], True)}'
            f'{_counter(i, total, lang, True)}<h2 id="{sid}-title">{_words(sc["title"])}</h2><div id="{sid}-cards">{cards}</div>{_logo(True)}')
    first, hold = 0.9, 1.0
    gap = max((dur - first - hold) / max(n, 1), 0.5)
    js = (f'tl.fromTo("#{sid}-q", {{x:40, y:0}}, {{x:-40, y:30, duration:{_js(dur)}, ease:"none"}}, 0);\n'
          + _eyebrow_js(sid, 0.15)
          + _title_words_js(f"#{sid}-title", 0.3))
    for k in range(n):
        js += (f'tl.fromTo("#{sid}-c{k}", {{opacity:0, rotationX:-70, y:-20, transformOrigin:"top center"}}, {{opacity:1, rotationX:0, y:0, duration:0.55, ease:"expo.out"}}, {_js(first + k * gap)});\n'
               f'tl.fromTo("#{sid}-c{k} .badge", {{scale:0.3}}, {{scale:1, duration:0.4, ease:"back.out(1.6)"}}, {_js(first + k * gap + 0.1)});\n')
    js += _exit_js(sid, dur)
    return _scene_shell(sid, css, body, js)


def scene_outro(sid, sc, dur, lang, i, total):
    t = TEXT[lang]
    n = len(sc["bullets"])
    css = f"""
#{sid}-ring{{position:absolute;left:-420px;top:380px;width:1000px;height:1000px;border-radius:50%;border:2px solid rgba(0,158,227,0.5)}}
#{sid}-title{{position:absolute;left:120px;top:210px;width:1500px;font-size:56px;line-height:1.2;font-weight:800;color:#fff}}
#{sid}-lbl{{position:absolute;left:120px;top:470px;font-size:26px;font-weight:700;color:#ff8aa0;letter-spacing:0.06em;text-transform:uppercase}}
#{sid}-list{{position:absolute;left:120px;top:520px;width:1300px}}
#{sid}-list div{{position:relative;font-size:34px;line-height:1.3;color:#fff;padding:12px 0 12px 64px}}
#{sid}-list div b{{position:absolute;left:0;top:14px;width:40px;height:40px;border-radius:50%;background:{MINT}}}
#{sid}-thanks{{position:absolute;left:120px;top:800px;font-size:92px;font-weight:900;color:#fff;letter-spacing:-0.01em}}
"""
    items = "".join(f"<div><b></b>{_esc(b)}</div>" for b in sc["bullets"])
    body = (f'<div id="{sid}-ring"></div>{_eyebrow(sid, t["eyebrow"], True)}'
            f'{_counter(i, total, lang, True)}<h2 id="{sid}-title">{_words(sc["title"])}</h2>'
            f'<div id="{sid}-lbl">{t["contacts"]}</div><div id="{sid}-list">{items}</div>'
            f'<div id="{sid}-thanks">{_words(t["thanks"])}</div>{_logo(True)}')
    gap = min(1.0, max(dur - 5.0, 1.0) / max(n, 1))
    js = (f'tl.fromTo("#{sid}-ring", {{rotation:0, y:0}}, {{rotation:-25, y:-40, duration:{_js(dur)}, ease:"none"}}, 0);\n'
          + _eyebrow_js(sid, 0.15)
          + _title_words_js(f"#{sid}-title", 0.3)
          + f'tl.fromTo("#{sid}-lbl", {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.2}}, 1.6);\n'
          f'tl.fromTo("#{sid}-list div", {{opacity:0, x:-24, filter:"blur(6px)"}}, {{opacity:1, x:0, filter:"blur(0px)", duration:0.5, ease:"expo.out", stagger:{_js(gap)}}}, 1.9);\n'
          + _title_words_js(f"#{sid}-thanks", max(dur - 3.2, 2.6))
          + f'tl.to("#{sid}-stage", {{opacity:0, duration:0.5, ease:"power2.in"}}, {_js(max(dur - 0.55, 1.0))});\n')
    return _scene_shell(sid, css, body, js)


SCENE_FN = {"title": scene_title, "section": scene_section, "quiz": scene_quiz, "outro": scene_outro,
            "history": lambda *a: scene_section(*a, history=True)}


# ── project + render ─────────────────────────────────────────────────
def write_project(job: Path, scenes: list[dict], lang: str = "de") -> tuple[Path, float]:
    """scenes: [{index, kind, title, bullets, note, narration}]; narration audio expected at <job>/scene_<index>.wav (optional)."""
    lang = "en" if str(lang).lower().startswith("en") else "de"
    proj = job / "motion"
    (proj / "compositions").mkdir(parents=True, exist_ok=True)
    (proj / "assets").mkdir(exist_ok=True)
    shutil.copy(LOGO, proj / "assets" / "helaba_logo.svg")
    total = len(scenes)
    t, hosts, audios, floods = 0.0, [], [], []
    for n, sc in enumerate(scenes, 1):
        wav = job / f"scene_{sc.get('index', n)}.wav"
        wav_s = wav_seconds(wav) if wav.exists() else 0.0
        dur = round((wav_s if wav.exists() else 5.3) + PAD, 2)
        sid = f"s{n}"
        (proj / "compositions" / f"{sid}.html").write_text(SCENE_FN[sc["kind"]](sid, sc, dur, lang, n, total), encoding="utf-8")
        hosts.append(f'<div id="{sid}" class="clip" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" '
                     f'data-start="{t:.2f}" data-duration="{dur:.2f}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>')
        if wav.exists():
            shutil.copy(wav, proj / "assets" / wav.name)
            audios.append(f'<audio id="nar{n}" class="clip" src="assets/{wav.name}" data-start="{t:.2f}" data-duration="{wav_s:.2f}" '
                          f'data-track-index="2" data-volume="1"></audio>')
        if n > 1:
            floods.append(f'tl.to("#bg", {{backgroundColor:"{GROUND[sc["kind"]]}", duration:0.4, ease:"power2.inOut"}}, {t - 0.2:.2f});')
        t += dur
    total_s = round(t, 2)
    nl = "\n"
    index = f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1920px;height:1080px;overflow:hidden;background:{GROUND[scenes[0]["kind"]]}}}
body{{font-family:"Inter",sans-serif}}
#bg{{position:absolute;inset:0;background:{GROUND[scenes[0]["kind"]]}}}
#prog{{position:absolute;left:0;bottom:0;width:1920px;height:8px;background:rgba(0,0,0,0.12)}}
#prog-fill{{position:absolute;inset:0;background:{CORAL}}}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{total_s:.2f}" data-width="1920" data-height="1080" data-fps="30">
<div id="bg"></div>
{nl.join(hosts)}
{nl.join(audios)}
<div id="prog"><div id="prog-fill"></div></div>
</div>
<script>
window.__timelines = window.__timelines || {{}};
const tl = gsap.timeline({{ paused: true }});
tl.fromTo("#prog-fill", {{scaleX:0, transformOrigin:"left"}}, {{scaleX:1, duration:{total_s:.2f}, ease:"none"}}, 0);
{nl.join(floods)}
window.__timelines["main"] = tl;
</script>
</body>
</html>
"""
    (proj / "index.html").write_text(index, encoding="utf-8")
    (proj / "package.json").write_text(json.dumps({"name": job.name, "private": True, "type": "module"}, indent=2), encoding="utf-8")
    (proj / "hyperframes.json").write_text(json.dumps({"paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"}}, indent=2),
                                           encoding="utf-8")
    return proj, total_s


def render(proj: Path, out: Path, quality: str = "standard", timeout_s: int = 900) -> float:
    t0 = time.time()
    cmd = [NPX, "--yes", f"hyperframes@{HF_VERSION}", "render", str(proj), "-o", str(out), "--quiet", "-q", quality]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s, shell=NPX.lower().endswith(".cmd"))
    if r.returncode != 0 or not out.exists():
        raise MotionError(f"hyperframes render failed: {(r.stderr or r.stdout)[-800:]}")
    return round(time.time() - t0, 1)


def build(job: Path, scenes: list[dict], lang: str = "de") -> tuple[str, dict]:
    proj, total_s = write_project(job, scenes, lang)
    out = job / "training_motion.mp4"
    secs = render(proj, out)
    return out.name, {"hf_render_s": secs, "video_s": total_s}


if __name__ == "__main__":  # python -m app.motion data/videos/<job>  [--no-render]
    import sys
    job = Path(sys.argv[1])
    script = json.loads((job / "script.json").read_text(encoding="utf-8"))
    proj, total_s = write_project(job, script["scenes"], "de")
    print("project:", proj, "duration:", total_s)
    if "--no-render" not in sys.argv:
        print("render s:", render(proj, job / "training_motion.mp4"))
