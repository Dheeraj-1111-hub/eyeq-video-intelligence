# EYEQ — System Design Decisions

This document explains the architectural tradeoffs, design rationale, and engineering decisions behind EYEQ.

---

## Why Microservices?

EYEQ splits into three services rather than a monolith because the workloads have fundamentally different resource profiles:

| Service        | Workload Type | CPU Profile        | Memory Profile      |
|---------------|---------------|--------------------|---------------------|
| Frontend       | I/O bound     | Minimal (static)   | Minimal              |
| Backend        | I/O bound     | Low (API routing)  | Moderate (Mongoose)  |
| AI Service     | CPU bound     | Very High (PyTorch)| High (model weights) |

Running YOLO inference inside the Node.js process would block the event loop and make the API unresponsive during video processing. The microservice split allows:

- **Independent scaling**: Deploy more AI workers without touching the API
- **Language optimization**: Python for ML (ecosystem), Node.js for I/O (async)
- **Fault isolation**: If PyTorch crashes, the API and frontend remain available

---

## Why BullMQ Over Direct HTTP?

**Problem:** When a user uploads a video, the AI pipeline takes 30–120 seconds. We cannot block the HTTP response.

**Considered Approaches:**

| Approach           | Pros                    | Cons                              |
|--------------------|-------------------------|-----------------------------------|
| Direct HTTP        | Simple                  | No retry, no queue visibility     |
| BullMQ + Redis     | Retry, ordering, observability | Requires Redis                |
| RabbitMQ           | Enterprise-grade        | Overkill, complex setup          |
| AWS SQS            | Managed                 | Cloud lock-in, cost              |

**Decision:** BullMQ with Redis. It provides:
- **Job persistence** — survives service restarts
- **Concurrency control** — process 2 videos at a time
- **Event hooks** — `completed` and `failed` handlers for observability
- **Graceful fallback** — when Redis is unavailable (local dev), the system falls back to direct HTTP dispatch

---

## Why FAISS Over Pinecone/Weaviate?

| Option         | Hosting     | Latency | Cost   | Complexity |
|---------------|-------------|---------|--------|------------|
| Pinecone       | Cloud       | ~50ms   | Paid   | Medium     |
| Weaviate       | Self-hosted | ~20ms   | Free   | High       |
| FAISS (in-mem) | In-process  | <1ms    | Free   | Low        |

**Decision:** FAISS in-memory. For a single-instance deployment with <100K vectors, FAISS delivers sub-millisecond search latency with zero infrastructure overhead. If EYEQ needed to scale to millions of vectors across distributed nodes, we would migrate to a dedicated vector database.

---

## Why JWT Over Sessions?

| Approach       | Stateless? | Scalable? | Frontend Complexity |
|---------------|------------|-----------|---------------------|
| Session cookies| No         | Needs Redis store | Low          |
| JWT            | Yes        | Yes       | Medium              |

**Decision:** JWT with `localStorage`. The token contains `userId` and `role`, enabling stateless authentication across all API routes. No server-side session store required.

**Security measures:**
- bcrypt password hashing (salt rounds: 10)
- Token expiration (configurable)
- Query parameter fallback for video streaming (allows authenticated `<video>` src URLs)

---

## Multi-Tenant Data Isolation

Even though EYEQ is primarily a single-user portfolio project, the data model is designed for multi-tenant isolation:

```
Every query filters by userId
    ↓
User A cannot see User B's:
    Videos
    Cases
    Evidence
    Search History
    Processing Metrics
    Notifications
    Settings
```

This is enforced at the **controller level**, not the database level. Every controller extracts `userId` from the JWT token and uses it as a query filter.

**Why not database-level isolation?** Multi-database or multi-collection tenancy would add complexity without benefit at this scale. The per-query filter approach is the standard pattern for SaaS applications with <10,000 tenants.

---

## Settings-Driven AI Pipeline

A critical design decision: **AI thresholds are not hardcoded.** They flow from the database to the inference engine:

```
UserSettings (MongoDB)
    ↓ read on video upload
Backend Queue Worker
    ↓ pass as request payload
FastAPI /process endpoint
    ↓ inject into pipeline
YOLOv4-tiny conf_threshold
CLIP search similarity cutoff
OSNet ReID cosine threshold
```

This means a supervisor could set stricter thresholds for production investigations while a trainee uses relaxed thresholds for learning — all from the same deployment.

---

## Report Generation Architecture

**Problem:** Generate professional PDF investigation reports from dynamic case data.

**Considered Approaches:**

| Approach           | Quality | Dynamic Content | Complexity |
|--------------------|---------|-----------------|------------|
| pdfkit (raw)       | Low     | Hard            | High       |
| jsPDF (client)     | Medium  | Medium          | Medium     |
| Puppeteer (Chrome) | High    | Easy (HTML/CSS) | Medium     |

**Decision:** Puppeteer with HTML templating. We generate a full HTML document with styled tables, headers, and evidence thumbnails, then use headless Chromium to convert it to PDF. This gives us pixel-perfect control over the output while allowing standard CSS for styling.

---

## Real-Time Progress Updates

**Problem:** Video processing takes 30–120 seconds. Users need live feedback.

**Architecture:**

1. Python AI service sends HTTP webhook to `POST /api/videos/:id/progress`
2. Backend receives webhook and broadcasts via Socket.IO to room `video_{id}`
3. Frontend subscribes to the room and updates the progress bar

**Why not direct WebSocket from Python to Browser?** The Node.js backend serves as a centralized message broker, avoiding a direct dependency between the browser and the AI service. This maintains clean service boundaries.

---

## Notification System Design

Notifications are **event-driven** and **settings-aware**:

```
Event occurs (video processed, evidence added, report generated)
    ↓
Check UserSettings.notifications[eventType]
    ↓
If enabled → Create Notification document
If disabled → Skip silently
```

This gives users genuine control over their alert volume, which is a production-grade feature most student projects omit entirely.

---

## Cascade Deletion Strategy

When a user clears their storage via Settings, the system performs a proper cascade:

**Clear Videos:**
```
Find user's videos → Get video IDs
    → Delete Detections (by video_id)
    → Delete Videos
```

**Clear Cases:**
```
Find user's cases → Get case IDs
    → Delete Evidence (by caseId)
    → Delete TimelineEvents (by caseId)
    → Delete CaseNotes (by caseId)
    → Delete Cases
```

This ensures zero orphaned documents remain in the database after a destructive operation.
