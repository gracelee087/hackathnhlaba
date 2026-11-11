"""Helaba-styled scene renderer for training-video frames (Pillow + PyMuPDF only)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw, ImageFont

SIZE = (1920, 1080)
_W, _H = SIZE
_LOGO = Path(__file__).parent / "static" / "helaba_logo.svg"
_FONT_DIR = Path(r"C:\Windows\Fonts")
_FONTS = {"bold": ["segoeuib.ttf", "arialbd.ttf"], "regular": ["segoeui.ttf", "arial.ttf"]}
_C = {"primary": "#004874", "blue": "#009ee3", "text": "#1a1a1a", "grey": "#5a6b78", "muted": "#9bafbf",
      "light": "#ccdae3", "coral": "#fe3b61", "mint": "#a0c8af", "white": "#ffffff"}
_TOP, _MARGIN, _CAP_H, _FOOTER = 110, 100, 170, "Demo für den Challenge-Geber (LBS / Helaba) - nicht zur Veröffentlichung"


@lru_cache(maxsize=None)
def _font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    for name in _FONTS[weight]:
        if (_FONT_DIR / name).exists():
            return ImageFont.truetype(str(_FONT_DIR / name), size)
    return ImageFont.load_default(size)


def _wrap(text: str, font: ImageFont.FreeTypeFont, width: int, max_lines: int) -> list[str]:
    """Greedy word wrap; the last allowed line is cut with an ellipsis if text remains."""
    words, lines, line = text.split(), [], ""
    for w in words:
        cand = f"{line} {w}".strip()
        if font.getlength(cand) <= width or not line:
            line = cand
        else:
            lines.append(line)
            line = w
    lines.append(line)
    if len(lines) > max_lines:
        last = " ".join(lines[max_lines - 1:])
        while last and font.getlength(last + "…") > width:
            last = last[:-1].rstrip()
        lines = lines[: max_lines - 1] + [last + "…"]
    return lines


def _text_block(d: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font, fill: str, width: int,
                max_lines: int, spacing: float = 1.25, anchor_center: bool = False) -> int:
    """Draw wrapped text; returns the y just below the block."""
    x, y = xy
    lh = int(font.size * spacing)
    for ln in _wrap(text, font, width, max_lines):
        lx = x + (width - font.getlength(ln)) / 2 if anchor_center else x
        d.text((lx, y), ln, font=font, fill=fill)
        y += lh
    return y


@lru_cache(maxsize=1)
def _logo_white(height: int) -> Image.Image:
    doc = pymupdf.open(str(_LOGO))
    pix = doc[0].get_pixmap(matrix=pymupdf.Matrix(6, 6), alpha=True)
    img = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)
    alpha = img.getchannel("A")
    white = Image.new("RGBA", img.size, (255, 255, 255, 0))
    white.putalpha(alpha)  # keep alpha, recolour everything to white
    return white.resize((int(white.width * height / white.height), height), Image.LANCZOS)


def _bullets(d, y: int, items: list[str], colour: str, marker: str, numbered: bool = False) -> int:
    """Draw up to 4 bullets (2 lines each); shrink the font until the block fits above the caption."""
    width, bottom = _W - 2 * _MARGIN - 70, _H - 70 - _CAP_H - 30
    for size in (40, 36, 32, 28):
        f, lh = _font("regular", size), int(size * 1.25)
        if y + sum(len(_wrap(t, f, width, 2)) * lh + 18 for t in items) <= bottom or size == 28:
            break
    for i, item in enumerate(items, 1):
        if numbered:
            d.rounded_rectangle((_MARGIN, y + 2, _MARGIN + 46, y + 48), radius=8, fill=marker)
            d.text((_MARGIN + 23, y + 25), str(i), font=_font("bold", 30), fill=_C["primary"], anchor="mm")
        else:
            d.rectangle((_MARGIN + 6, y + lh // 2 - 9, _MARGIN + 24, y + lh // 2 + 9), fill=marker)
        y = _text_block(d, (_MARGIN + 70, y), item, f, colour, width, 2) + 18
    return y


def render_scene(scene: dict, out_png: Path) -> Path:
    kind, title = scene.get("kind", "section"), scene.get("title", "")
    bullets, note, caption = scene.get("bullets", [])[:4], scene.get("note", ""), scene.get("caption", "")
    index, total = scene.get("index", 1), scene.get("total", 1)
    img = Image.new("RGB", SIZE, _C["white"])
    d = ImageDraw.Draw(img)

    # top bar, logo, label, progress bar
    d.rectangle((0, 0, _W, _TOP), fill=_C["primary"])
    logo = _logo_white(38)
    img.paste(logo, (_MARGIN, (_TOP - logo.height) // 2), logo)
    d.text((_W - _MARGIN, _TOP // 2), "Wissenstransfer · Schulung", font=_font("regular", 30), fill=_C["white"], anchor="rm")
    d.rectangle((0, _TOP, _W, _TOP + 8), fill=_C["light"])
    d.rectangle((0, _TOP, int(_W * index / max(total, 1)), _TOP + 8), fill=_C["blue"])

    cw, y = _W - 2 * _MARGIN, _TOP + 70
    if kind == "title":
        y = _text_block(d, (_MARGIN, 300), title, _font("bold", 88), _C["primary"], cw, 2, 1.15, True)
        d.rectangle((_W // 2 - 60, y + 34, _W // 2 + 60, y + 42), fill=_C["blue"])
        if scene.get("audience"):
            y = _text_block(d, (_MARGIN, y + 70), f"{'Training for' if scene.get('lang') == 'en' else 'Schulung für'}: {scene['audience']}", _font("regular", 40), _C["grey"], cw, 1, 1.2, True)
        if note:
            _text_block(d, (_MARGIN, y + 16), note, _font("regular", 30), _C["muted"], cw, 1, 1.2, True)
    elif kind == "outro":
        y = _text_block(d, (_MARGIN, 300), "Miteinander mehr möglich machen!", _font("bold", 96), _C["primary"], cw, 2, 1.15, True)
        d.rectangle((_W // 2 - 60, y + 34, _W // 2 + 60, y + 42), fill=_C["blue"])
        y = _text_block(d, (_MARGIN, y + 70), title, _font("regular", 44), _C["grey"], cw, 2, 1.2, True)
        if note:
            _text_block(d, (_MARGIN, y + 16), note, _font("regular", 30), _C["muted"], cw, 1, 1.2, True)
    else:
        y = _text_block(d, (_MARGIN, y), title, _font("bold", 64), _C["primary"], cw, 2, 1.15)
        if note:
            y = _text_block(d, (_MARGIN, y + 8), note, _font("regular", 28), _C["grey"], cw, 1)
        y += 28
        if kind == "history":
            d.rectangle((_MARGIN, y, _W - _MARGIN, y + 64), fill=_C["coral"])
            d.text((_MARGIN + 28, y + 32), "Historical - no longer applies" if scene.get("lang") == "en" else "Historisch - gilt nicht mehr", font=_font("bold", 32), fill=_C["white"], anchor="lm")
            _bullets(d, y + 92, bullets, _C["grey"], _C["muted"])
        elif kind == "quiz":
            d.rectangle((_MARGIN, y - 14, _W - _MARGIN, y - 8), fill=_C["mint"])
            _bullets(d, y + 14, bullets, _C["text"], _C["mint"], numbered=True)
        else:
            _bullets(d, y, bullets, _C["text"], _C["blue"])

    # caption block, footer, counter
    top = _H - 70 - _CAP_H
    d.rounded_rectangle((_MARGIN, top, _W - _MARGIN, top + _CAP_H), radius=22, fill=_C["light"])
    if caption:
        cf, lines = _font("regular", 34), _wrap(caption, _font("regular", 34), cw - 80, 3)
        ty = top + (_CAP_H - len(lines) * int(cf.size * 1.25)) // 2 + 2
        _text_block(d, (_MARGIN + 40, ty), " ".join(lines), cf, _C["text"], cw - 80, 3)
    d.text((_MARGIN, _H - 28), scene.get("footer", _FOOTER), font=_font("regular", 22), fill=_C["muted"], anchor="lm")
    d.text((_W - _MARGIN, _H - 28), f"{index} / {total}", font=_font("regular", 22), fill=_C["muted"], anchor="rm")

    out_png = Path(out_png)
    out_png.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png, "PNG")
    return out_png


if __name__ == "__main__":
    import time
    out = Path(r"C:\Users\honor\AppData\Local\Temp\claude\6a1c4929272c2259\4e555eb9-b689-47c4-869c-569e22e54abb\scratchpad\frames_test")
    cap = ("In diesem Video erfährst du, welche Rabattstufen heute gelten, wer sie freigibt und was sich seit April 2025 "
           "geändert hat. Alle Angaben beziehen sich auf die aktuell gültige Richtlinie.")
    samples = [
        {"kind": "title", "title": "Rabattfreigabe: Was gilt heute?", "audience": "Sales-Team (Account Executives)",
         "note": "Stand: 11.11.2026 · Quelle: Richtlinie Rabattfreigabe v3", "caption": cap},
        {"kind": "section", "title": "Aktuelle Freigabestufen", "note": "Gilt seit 01.04.2025",
         "bullets": ["Bis 10 %: der Account Executive entscheidet allein",
                     "10-20 %: Freigabe durch Head of Sales im CRM (DISC-APP)",
                     "Über 20 %: Freigabe durch die Geschäftsführung, Begründung im CRM dokumentieren – außerdem muss die Marge geprüft werden und die Vertriebsleitung zustimmen",
                     "Jede Freigabe wird im CRM protokolliert und ist prüfungsrelevant"],
         "caption": "Seit April 2025 gilt: Bis zehn Prozent entscheidest du allein, zwischen zehn und zwanzig Prozent braucht es die Freigabe deines Head of Sales über die DISC-APP im CRM."},
        {"kind": "history", "title": "Was früher galt – und heute nicht mehr", "note": "Gültig bis 31.03.2025",
         "bullets": ["Bis 31.03.2025: 15 % ohne Freigabe, Freigabe per E-Mail",
                     "Keine Dokumentationspflicht im CRM", "Sonderkonditionen über den Vertriebsleiter per Telefon"],
         "caption": "Achtung: Die alte Regel mit fünfzehn Prozent ohne Freigabe per E-Mail gilt nicht mehr. Wer sie noch anwendet, verstößt gegen die aktuelle Richtlinie."},
        {"kind": "quiz", "title": "Kurzer Check: Hast du's verstanden?", "note": "Drei Fragen zur Selbstkontrolle",
         "bullets": ["Welchen Rabatt darfst du ohne Freigabe gewähren?",
                     "Wo wird eine Freigabe zwischen 10 und 20 % beantragt?",
                     "Warum ist die E-Mail-Freigabe heute nicht mehr zulässig?"],
         "caption": "Nimm dir einen Moment für die drei Fragen. Die Antworten findest du in der Richtlinie im Wissensportal."},
        {"kind": "outro", "title": "Rabattfreigabe: Was gilt heute?", "note": "Fragen? Dein Head of Sales hilft weiter.",
         "caption": "Danke fürs Zuschauen. Bei Fragen zur Rabattfreigabe wende dich an deinen Head of Sales oder schau ins Wissensportal."},
    ]
    paths = []
    for i, s in enumerate(samples, 1):
        s.update(index=i, total=len(samples))
        t0 = time.perf_counter()
        paths.append(render_scene(s, out / f"scene_{i}.png"))
        print(f"{paths[-1]}  {time.perf_counter() - t0:.2f}s  font={_font('bold', 10).getname()}")
