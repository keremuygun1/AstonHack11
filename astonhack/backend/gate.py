import os
import json
import requests
from io import BytesIO
from PIL import Image
import mimetypes
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).with_name(".env"))

from google import genai
from google.genai import types
from database import get_firestore

db = get_firestore()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("API key loaded?", bool(GEMINI_API_KEY))
client = genai.Client(api_key=GEMINI_API_KEY)


GATE_PROMPT = """
You are an OCR routing gate for a lost-and-found system.

Task: Look at the image and decide whether running OCR would likely produce useful identifying text
(e.g., person name, student ID, phone number, email, pet name, serial number, luggage label, brand_name).
Do not recommend OCR if text is absent, tiny, blurred, cut off, stylized, or not identity-relevant.

Return ONLY valid JSON with exactly these keys:
{
  "should_ocr": true,
  "readability": "high",
  "doc_type": "id_card",
  "likely_identifiers": ["person_name", "id_number", "brand_name"],
  "reason": "short reason"
}

Rules:
- readability: high|medium|low|none
- doc_type: id_card|pet_tag|luggage_tag|label|serial|receipt|screen|none|other
- likely_identifiers items: person_name|pet_name|id_number|phone|email|serial|address|other
"""

def ocr_gate_from_file(url, r, img_id, img_collection) -> dict:
    mime, _ = mimetypes.guess_type(url)
    mime = mime or "image/jpeg"

    image_bytes = r.content
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime)

    resp = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[image_part, GATE_PROMPT],
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
            max_output_tokens=400,
        ),
    )

    item = db.collection(img_collection).document(img_id)
    item.set(json.loads(resp.text), merge=True)

    # resp.text should be JSON because of response_mime_type
    return json.loads(resp.text)
