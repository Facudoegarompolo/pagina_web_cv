"""Compatibility entry point: now builds both languages from supplied public JSON."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("create-cv.py")), run_name="__main__")
