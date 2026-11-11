"""Offline text-to-speech with Piper (onnx, CPU). Voices live in data/voices/<name>.onnx(+.json).
German: de_DE-thorsten-medium, English: en_US-lessac-medium. Voices are loaded once and cached."""
import logging
import wave
from pathlib import Path

from . import config

logger = logging.getLogger(__name__)
VOICE_DIR = config.ROOT / "data" / "voices"
VOICES = {"de": "de_DE-thorsten-medium", "en": "en_US-lessac-medium"}
_cache: dict[str, object] = {}


def voice_name(lang: str = "de") -> str:
    return VOICES.get((lang or "de").lower()[:2], VOICES["de"])


def available(lang: str = "de") -> bool:
    return (VOICE_DIR / f"{voice_name(lang)}.onnx").exists()


def _voice(lang: str):
    name = voice_name(lang)
    if name not in _cache:
        from piper import PiperVoice
        model = VOICE_DIR / f"{name}.onnx"
        if not model.exists():
            raise FileNotFoundError(f"piper voice missing: {model}")
        _cache[name] = PiperVoice.load(model, model.with_suffix(".onnx.json"))
    return _cache[name]


def synthesize(text: str, out_wav: Path, lang: str = "de") -> float:
    """Write a 16-bit mono WAV for `text`; returns its duration in seconds."""
    voice = _voice(lang)
    out_wav = Path(out_wav)
    with wave.open(str(out_wav), "wb") as wf:
        voice.synthesize_wav(text, wf)
    with wave.open(str(out_wav), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate() or 1)
