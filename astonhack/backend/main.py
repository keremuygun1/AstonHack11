import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import get_firestore
import tempfile
from pathlib import Path
import mimetypes
import clip_input
import gate
import traceback
import requests
import ocr_agent
import json
from PIL import Image
from io import BytesIO
from google import genai
from google.genai import types

from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class MatchRequest(BaseModel):
    itemId: str

class MatchResponse(BaseModel):
    decision: Literal["match", "no_match", "needs_review"]
    given_id: str
    matched_id: Optional[str] = None
    confidence: float
    reasons: List[str]

    class Config:
        extra = "forbid"  # ensures you don't accidentally return old keys
        
app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*'],
)

@app.post("/match", response_model=MatchResponse)
def run_match(req: MatchRequest):
    try:
        result = final_verdict(req.itemId)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def calculate_margin(candidates):
    # candidates: list[dict] sorted by clip_score desc (top first)
    if not candidates or len(candidates) < 2:
        return 0.0
    return float(candidates[0]["clip_score"]) - float(candidates[1]["clip_score"])

        

def url_to_temp_path(image_url: str) -> str:
    r = requests.get(image_url, timeout=20)
    r.raise_for_status()

    # Prefer the server’s content-type; fallback to URL extension; final fallback .jpg
    content_type = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
    ext = mimetypes.guess_extension(content_type) if content_type else None
    if not ext:
        ext = Path(image_url).suffix or ".jpg"

    f = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    f.write(r.content)
    f.close()
    return f.name


db = get_firestore()

def final_verdict(item_id):

    text = ""          # default: no OCR output
    should_ocr = False # default: don't OCR
    img_url = None     # default: no image url yet
    #First, run the clip model with the image
    # 1) Try lostItems/{item_id}
    lost_ref = db.collection("lostItems").document(item_id)
    lost_snap = lost_ref.get()
    found_ref = db.collection("foundItems").document(item_id)
    found_snap = found_ref.get()
    if lost_snap.exists:
        data = lost_snap.to_dict() or {}
        data["_doc_id"] = lost_snap.id
        collection = 'lostItems'
        best_three = clip_input.match_text(data.get('description'))
    elif found_snap.exists:
        data = found_snap.to_dict() or {}
        data["_doc_id"] = found_snap.id
        collection = 'foundItems'
        best_three = clip_input.match_img(data.get('imageUrl'))
    else:
        # 3) Not found
        raise ValueError(f"Item id not found in lostItems or foundItems: {item_id}")

    #now, run the image thorugh the gate
    best_three_structured = []
    for rank, cand in enumerate(best_three, start=1):
        best_three_structured.append({
            "rank": rank,
            "candidate_id": cand["candidate_id"],
            "text": cand.get("text") or cand.get("image_names") or "",
            "clip_score": float(cand["clip_score"]),
        })
    margin = calculate_margin(best_three)
    print(margin)

    if collection == 'foundItems':
        doc_ref = db.collection(collection).document(item_id)

        snap = doc_ref.get() 

        if not snap.exists:
            raise ValueError("Document not found")

        data = snap.to_dict()
        img_url = data.get("imageUrl")   

        r = requests.get(img_url, timeout=20)
        r.raise_for_status()

        #get the json
        json_file = gate.ocr_gate_from_file(img_url, r, snap.id, collection)
        should_ocr = bool(json_file.get("should_ocr", False))

        if should_ocr:
            tmp_path = url_to_temp_path(img_url)
            try:
                text = ocr_agent.run_ocr_agent_on_path(tmp_path)
                print(text)
                doc_ref.update({"ocr_output": text})
            finally:
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass
    if collection == 'foundItems':
        tmp_path = url_to_temp_path(img_url)
        input_q = Image.open(tmp_path).convert("RGB")
    elif collection == 'lostItems':
        input_q = data.get('description')

        
    #now, combine everything and give it to the gemini agent to decide on the final verdict
    decision_packet = {
        "given_id": item_id,
        "clip.score_margin": margin,
        "candidates" : best_three,
        "should_ocr" : should_ocr,
        "ocr_results" : text,
    }
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=GEMINI_API_KEY)


    PROMPT = """
    You are a strict verifier for a lost-and-found matching system.
    You will receive a JSON object with a source item and up to 3 candidate matches.
    Each candidate includes a CLIP similarity score and may include OCR output text.

    Decide whether any candidate is a real match.

    item identification:

    Rules:

    Prefer strong identifiers from OCR (person name, ID number, phone, email, pet name, serial) over CLIP score.

    If OCR output is empty or generic (brand-only, “Made in …”), do not treat it as identifying.

    If evidence is weak or ambiguous, choose "needs_review" rather than guessing.

    Only choose "match" if there is clear alignment (identifiers or highly consistent attributes).

    CLIP score interpretation (IMPORTANT):
    The clip_score is a cosine similarity and is not an absolute “high/low” scale.
    You MUST judge CLIP primarily using rank and separation:

    Use ranking.score_margin as the main signal.

    If ranking.score_margin >= 0.05, treat the top candidate as strongly separated from the others.
    When the rule of score_margin is satisfied, you MUST output "decision":"match".

    If ranking.score_margin < 0.03, treat it as ambiguous.

    If ranking.score_margin < 0.01, treat it as a no_match. you MUST output "decision":"no_match"

    Decision rule (MUST FOLLOW):

    If OCR contains a matching identifier (name/id/phone/email/serial) between source and a candidate → output "decision":"match" and set that candidate’s id.

    Else, if ranking.score_margin >= 0.05 AND the top candidate’s summary is consistent with the source item → output "decision":"match" (do NOT downgrade to needs_review just because the number “looks low”).

    Else if evidence conflicts → "no_match".

    Otherwise → "needs_review".

    Output ONLY valid JSON with exactly these keys(MUST FOLLOW):
    {
    "decision": "match" | "no_match" | "needs_review",
    "given_id": string,
    "matched_id": string | null,
    "confidence": number,
    "reasons": [string]
    }
    """

    resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[PROMPT,input_q,json.dumps(decision_packet)],
            config=types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json",
                max_output_tokens=400,
            ),
        )

    raw_text = resp.candidates[0].content.parts[0].text  # <-- this is the JSON string
    raw_text = raw_text.strip()

    # If your model ever wraps in ```json fences, strip them defensively:
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```", 2)[1].strip()
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()

    structured = json.loads(raw_text)  # <-- now it's a dict with your keys

    # OPTIONAL: validate keys so you don't accidentally return wrong shape
    required = {"decision", "given_id", "matched_id", "confidence", "reasons"}
    if set(structured.keys()) != required:
        raise ValueError(f"Model returned unexpected keys: {structured.keys()}")

    print(structured)
    return structured  # in Flask: return jsonify(structured)

if __name__ == '__main__':
    uvicorn.run(gate, host= "0.0.0.0",port = 8000)
