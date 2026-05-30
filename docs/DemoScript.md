# EYEQ — Demo Script

A repeatable 3–5 minute walkthrough that demonstrates every core capability of the EYEQ platform.

---

## Pre-Demo Setup

1. Ensure all 3 services are running (backend, frontend, AI service)
2. Have 2–3 short CCTV-style videos ready (5–15 seconds each)
3. Ideally, use clips where the **same person** appears in multiple videos

---

## Demo Flow

### 1. Authentication (30 seconds)

1. Open `http://localhost:8080`
2. Show the cinematic landing page
3. Click **Get Started** → Register with a new account
4. Point out: *"Custom JWT auth — no third-party auth providers"*

### 2. Upload & Processing (60 seconds)

1. Click **Upload Source** in the top nav
2. Upload your first video
3. Watch the real-time progress bar update via Socket.IO
4. Point out: *"BullMQ dispatches the job to a Python FastAPI worker. You're watching YOLOv4-tiny run in real-time."*
5. Upload a second video while the first is still processing
6. Point out: *"Job queue — videos are processed sequentially without race conditions"*

### 3. Workspace Intelligence (30 seconds)

1. Click on a processed video in the Workspace
2. Show the video player with detection overlays (bounding boxes)
3. Show the detection summary: persons, vehicles, packages, peak activity
4. Click on individual detections to jump to their exact timestamps
5. Point out: *"Every bounding box is a real YOLO detection stored in MongoDB"*

### 4. Semantic Search (45 seconds)

1. Navigate to **Search**
2. Type: `"person carrying a backpack"`
3. Show the results — real detection crops matched via CLIP cosine similarity
4. Point out: *"This is zero-shot search. CLIP maps text and images to the same 512D vector space. The system finds objects it was never explicitly trained on."*
5. Click on a result to navigate to its exact timestamp in the video

### 5. Cross-Camera Tracking (60 seconds)

1. From a person detection, click **Track Subject**
2. Show the Subject Journey — the same person found across multiple videos
3. Point out: *"OSNet generates a 512D identity signature per person crop. Cosine similarity matching finds the same person across cameras, even with angle changes."*
4. Click **Create Subject Profile** to persist the identity

### 6. Investigation Case (45 seconds)

1. Navigate to **Cases**
2. Click **Create Case** — give it a title like "Lobby Unauthorized Access"
3. Go back to the Workspace, select detections, and click **Add to Case**
4. Return to the Case → show the Evidence tab
5. Click the **Timeline** tab — show the auto-generated chronological reconstruction
6. Click **Notes** → add an investigator annotation
7. Point out: *"The timeline is automatically generated from evidence timestamps"*

### 7. PDF Report (30 seconds)

1. Click the **Report** tab
2. Show the HTML preview
3. Click **Download PDF**
4. Open the downloaded PDF — professional forensic brief with evidence, timeline, and notes
5. Point out: *"Puppeteer renders this server-side using headless Chromium"*

### 8. Analytics & Settings (30 seconds)

1. Navigate to **Analytics** — show real-time throughput, search history, case distribution
2. Navigate to **Settings** — drag the YOLO confidence slider, toggle a notification
3. Point out: *"These aren't UI decorations. The YOLO slider mutates a MongoDB document that the Python inference engine reads on every video upload."*

---

## Key Talking Points

Use these during the demo or Q&A:

- **"Three-service microarchitecture"** — React frontend, Node.js API gateway, Python AI service
- **"Zero-shot search"** — CLIP enables natural language queries without retraining
- **"Cross-camera tracking"** — OSNet ReID, not simple color matching
- **"Settings-driven AI"** — Thresholds are user-configurable, not hardcoded
- **"Job queue orchestration"** — BullMQ with Redis, not synchronous processing
- **"13 MongoDB collections"** — Full relational modeling in a document database
- **"Real-time observability"** — Socket.IO progress, processing metrics, audit logs
- **"Containerized deployment"** — `docker compose up` runs the entire stack

---

## Post-Demo Questions to Expect

| Question | Suggested Answer |
|----------|-----------------|
| "Does the search really work?" | Yes — CLIP encodes text and images to the same vector space. FAISS does sub-millisecond cosine similarity retrieval. |
| "How do you handle concurrent video processing?" | BullMQ job queue with concurrency: 2. Redis persists jobs across restarts. |
| "Why not use GPU?" | Deliberately chose CPU-compatible models (OpenCV DNN, CLIP ViT-B/32) so the system deploys on any machine without CUDA. |
| "How accurate is the ReID?" | OSNet trained on Market1501 achieves ~94% Rank-1 accuracy. Our cosine threshold is user-configurable (default 85%). |
| "Can this scale?" | The microservice architecture allows horizontal scaling. FAISS can be replaced with Pinecone for distributed vector search. |
