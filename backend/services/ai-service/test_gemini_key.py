#!/usr/bin/env python3
"""
Quick CLI diagnostic tool to verify your Gemini API key against Google Gemini 2.5 Flash.
Run with:
    python3 backend/services/ai-service/test_gemini_key.py
"""

import sys
import os
from pathlib import Path

# Find project root and load .env
root_dir = Path(__file__).resolve().parent.parent.parent.parent
env_file = root_dir / ".env"

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key and env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("GEMINI_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

print("\n" + "=" * 60)
print("🔑 CIVIC GUARD - GEMINI 3.5 FLASH-LITE API KEY DIAGNOSTIC")
print("=" * 60)

if not api_key:
    print("❌ ERROR: No GEMINI_API_KEY found in environment or root .env file.")
    sys.exit(1)

masked_key = api_key[:6] + "..." + api_key[-4:] if len(api_key) > 10 else "***"
print(f"• Key Detected: {masked_key} (Length: {len(api_key)})")

try:
    from google import genai
except ImportError:
    print("❌ ERROR: 'google-genai' package is not installed.")
    venv_py = Path(__file__).resolve().parent / ".venv" / "bin" / "python"
    if venv_py.exists():
        print(f"💡 Found virtual environment. Run with:\n    {venv_py} {Path(__file__).name}")
    else:
        print("Run: pip install google-genai")
    sys.exit(1)

target_model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
print(f"• Connecting to Google Gemini API ({target_model})...")

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=target_model,
        contents="Respond with: CIVIC_GUARD_ONLINE"
    )
    if response.text is not None:
        result_text = response.text.strip()
        print("✅ CONNECTION SUCCESSFUL!")
        print(f"• Model: {target_model}")
        print(f"• Response from Gemini: {result_text}")
        print("=" * 60)
        print("🎉 Your Gemini API key is valid and working!\n")
    else:
        finish_reason = None
        if response.candidates and len(response.candidates) > 0:
            finish_reason = getattr(response.candidates[0], "finish_reason", None)
        print("⚠️ API CALL SUCCEEDED BUT RETURNED NO TEXT:")
        print(f"• Model: {target_model}")
        print(f"• Finish Reason: {finish_reason}")
        print(f"• Raw Response: {response}")
        print("=" * 60 + "\n")
        sys.exit(1)
except Exception as e:
    print(f"❌ API CALL FAILED: {e}")
    print("=" * 60 + "\n")
    sys.exit(1)
