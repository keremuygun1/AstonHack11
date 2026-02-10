**Backtrack**

Backtrack is a lost-and-found web app built to help communities reunite people with misplaced belongings. Users can report items they’ve lost or found, attach photos, and pin the exact location on a map. Behind the scenes, an AI-powered matching pipeline helps surface likely matches by combining image–text similarity (CLIP) with optional OCR and a final Gemini verification step.

The goal is simple: make reporting fast, keep information consistent, and help people connect safely when something is likely a match.

**Why Backtrack**

Lost-and-found usually fails because details are incomplete or scattered. Backtrack keeps reports structured (photo + description + location) and puts them in one searchable place, making it easier for a lost item and a found item to “find each other.”

**Key Features**
1) Authenticated Reporting (Auth0)

Backtrack uses Auth0 to protect reporting and keep accountability in the system.

You can browse the landing page without signing in.

You cannot submit a Lost/Found report until you sign in.

Once authenticated, reporting actions become available and your submissions are tied to your user identity.

This keeps spam down and enables future features like user messaging, notifications, and report history.

2) Fast Lost/Found Report Flow

Reporting is designed to be quick, consistent, and mobile-friendly:

Found item report

Upload a photo or capture one with the camera

Provide a short item name

Pin the found location on a map

Submit and trigger matching

Lost item report

Provide name, color, time, and description

Choose the last-known location

Submit and trigger matching

Both flows are intentionally similar so users don’t have to “re-learn” the UI.

3) Map Integration (Leaflet + OpenStreetMap)

Backtrack uses Leaflet with OpenStreetMap tiles for location features:

Embedded “mini map” inside the report flow to drop a pin

Dedicated full-page map view for browsing

Pin precision matters for reuniting items quickly, especially in large campuses or public areas.

4) AI Matching Agent (CLIP + OCR + Gemini)

After a report is submitted, the backend runs an automated matching pipeline that checks for a corresponding record in the opposite collection (lostItems ↔ foundItems).

Step A — CLIP Similarity Search

The system retrieves the top 3 candidates using CLIP cosine similarity:

If the submission is a found item (image) → compare the image against lost item descriptions

If the submission is a lost item (text) → compare the description against found item images

Each candidate includes:

candidate id

summary label (description/name)

CLIP similarity score

Step B — OCR Gate + OCR Agent (Optional)

If the input contains an image, a Gemini “gate” checks whether OCR is worth running.

If the model believes readable identifying text exists (tag, label, ID info, serial, phone number, etc.), it returns should_ocr: true.

The OCR agent then preprocesses the image (thresholding / skew correction), extracts text, and stores it back into Firestore as ocr_output.

This avoids wasting OCR calls on images with no useful text.

Step C — Final Gemini Verdict

Gemini receives a structured decision packet containing:

the source item (image or description)

the top 3 CLIP candidates + scores

OCR output (if available)

It returns a strict JSON verdict:

{
  "decision": "match" | "no_match" | "needs_review",
  "best_candidate_id": "… or null",
  "confidence": 0.0,
  "reasons": ["…"]
}


If confidence is high, the app can display a match notification page that lets users review what was matched.

5) Match Notification Page

When the backend returns "decision": "match", the frontend can route users to a match page that shows:

Lost vs Found item summary

Supporting reasoning (optional)

Next actions (profile, map, follow-up)

This page is designed to make matching transparent and easy to confirm.

6) User Profile

Backtrack includes a profile section powered by Auth0 where users can:

view their account details

see reported lost/found items tied to their identity

prepare for future features like notifications or messaging

How to Use the App

Open the landing page

You can explore the UI and map entry points.

Sign in

Auth0 login is required to submit reports.

Once signed in, reporting buttons become active.

Submit a Found item

Upload/capture a photo

Add the item name

Drop a pin on the map

Submit

Submit a Lost item

Fill in structured details (name, color, time, description, location)

Submit

Automatic matching runs

CLIP selects candidates

OCR runs only if needed

Gemini decides: match / no_match / needs_review

Review match results

If a match is found, the UI can navigate to a match screen and surface the verdict.

Tech Stack

Frontend

React + Vite

Leaflet + OpenStreetMap

Auth0 (authentication)

Backend

Python (FastAPI pipeline endpoint)

CLIP similarity search

Gemini (OCR gate + final verification)

Firestore (storage)

Notes / Best Practices

Reports are strongest when users provide clear photos and descriptive text.

OCR is most helpful for items with tags/labels (luggage tags, pet tags, name labels, serial labels).

The pipeline is built to be extensible (notifications, moderation, more robust candidate retrieval, caching, etc.).