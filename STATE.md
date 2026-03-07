# Project State — Virtual Try-On Kiosk

> Last updated: 2026-02-26T20:35:35+05:30  
> Session: Latency Optimization & Demographic Filtering Sprint

---

## Current Status

**Phase**: Backend optimisation complete — ready for frontend integration.

---

## Completed Tasks

### Milestone 2 — Backend Optimisations & Demographic Filtering ✅

| Task | Status | File(s) |
|------|--------|---------|
| **TASK 1** — Vision Route (Gender Detection) | ✅ Complete | `backend/routes/vision.py` |
| **TASK 2** — Schema Update (Clothing Metadata) | ✅ Complete | `backend/schemas/clothing.py` |
| **TASK 3** — Try-On Payload Optimisation | ✅ Complete | `backend/services/tryon_service.py` |
| Wire vision router into app | ✅ Complete | `backend/routes/__init__.py`, `backend/main.py` |
| Pass clothing metadata through route → service | ✅ Complete | `backend/routes/tryon.py` |

---

## Task Details

### TASK 1 — Vision Route
- **Endpoint**: `POST /api/vision/gender`  
- **Input**: Base64 image (kiosk camera)  
- **Output**: `{"detected_gender": "Male" | "Female" | "Unisex"}`  
- **Latency optimisation**: `maxOutputTokens: 20`, `temperature: 0.0`  

### TASK 2 — Schema Update
`TryOnRequest` now includes four **optional** clothing metadata fields:
- `clothing_name`, `clothing_category`, `clothing_style`, `gender_target`  
- All optional — existing callers without metadata are fully backward-compatible.

### TASK 3 — Try-On Payload Optimisation
- **`sampleCount: 1`** — forces single-sample generation (faster).  
- **`aspectRatio: "9:16"`** — portrait output for kiosk display.  
- **Dynamic prompt injection** — metadata context + strict constraints appended at runtime:
  - "User identity, facial features, and skin tone MUST remain strictly unchanged."
  - "Keep the exact same body pose, camera angle, and background."
  - "Drape the [style] [category] naturally over the subject."

---

## Next Steps

- [ ] Update frontend `TryOnScreen` to send clothing metadata fields in the try-on request body.
- [ ] Update `Preferences` / recommendations screen to call `POST /api/vision/gender` on capture.
- [ ] Add `gender` column filtering to clothing list endpoint for filtered recommendations.
- [ ] QA: run backend, verify `/api/vision/gender` and `/api/tryon` endpoints respond correctly.

---

## Architecture Notes

- All CORS, DB connection, and error-handling logic preserved untouched.
- Vision route uses the same Vertex AI credentials pipeline as the try-on service.
- No SDK imports added — all calls use raw `httpx` to match existing pattern.
