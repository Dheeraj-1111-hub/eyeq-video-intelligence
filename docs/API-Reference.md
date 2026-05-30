# EYEQ — API Reference

All endpoints are prefixed with `/api`. Unless noted, all routes require a valid JWT token in the `Authorization: Bearer <token>` header.

---

## Authentication

| Method | Path                | Auth | Description                    | Request Body                        | Response                           |
|--------|---------------------|------|--------------------------------|-------------------------------------|------------------------------------|
| POST   | `/api/auth/register`| No   | Create a new account           | `{ name, email, password }`         | `{ user, token }`                  |
| POST   | `/api/auth/login`   | No   | Login with credentials         | `{ email, password }`               | `{ user, token }`                  |
| GET    | `/api/auth/me`      | Yes  | Get current user profile       | —                                   | `{ _id, name, email, role }`       |

---

## Videos

| Method | Path                         | Auth | Description                        | Request Body / Params              | Response                           |
|--------|------------------------------|------|------------------------------------|------------------------------------|------------------------------------|
| POST   | `/api/videos/upload`         | Yes  | Upload a video file                | `multipart/form-data: video_file`  | Video document                     |
| GET    | `/api/videos`                | Yes  | List all user's videos             | —                                   | Video[]                            |
| GET    | `/api/videos/:id`            | Yes  | Get single video metadata          | —                                   | Video document                     |
| GET    | `/api/videos/:id/stream`     | Yes  | Stream video (HTTP 206 range)      | `?token=jwt` (query param allowed) | Binary video stream                |
| GET    | `/api/videos/:id/detections` | Yes  | Get all detections for a video     | —                                   | Detection[]                        |
| GET    | `/api/videos/:id/summary`    | Yes  | Get detection summary stats        | —                                   | `{ persons, vehicles, packages, peak_activity }` |
| GET    | `/api/videos/:id/pipeline`   | Yes  | Get processing pipeline status     | —                                   | Pipeline object                    |
| POST   | `/api/videos/:id/progress`   | No*  | AI webhook: update progress        | `{ progress, message }`            | `{ success: true }`               |

> *The progress endpoint is an internal webhook called by the Python AI service. It does not require JWT authentication.

---

## Semantic Search

| Method | Path                    | Auth | Description                           | Request Body                                      | Response                    |
|--------|-------------------------|------|---------------------------------------|---------------------------------------------------|-----------------------------|
| POST   | `/api/search`           | Yes  | Natural language video search         | `{ query, threshold?, limit? }`                   | Detection[] with scores     |
| GET    | `/api/search/metadata`  | Yes  | Get search index statistics           | —                                                  | `{ totalDetections, ... }`  |

---

## Person Re-Identification

| Method | Path                    | Auth | Description                           | Request Body                              | Response                                    |
|--------|-------------------------|------|---------------------------------------|-------------------------------------------|---------------------------------------------|
| POST   | `/api/reid/track`       | Yes  | Find same person across videos        | `{ detectionId, threshold? }`             | Match[] (sorted chronologically)            |
| POST   | `/api/reid/subjects`    | Yes  | Create a persistent subject profile   | `{ matches, sourceDetectionId }`          | Subject document                            |

---

## Cases

| Method | Path                              | Auth | Description                      | Request Body                                                    | Response              |
|--------|-----------------------------------|------|----------------------------------|-----------------------------------------------------------------|-----------------------|
| POST   | `/api/cases`                      | Yes  | Create a new case                | `{ title, description, priority }`                              | Case document         |
| GET    | `/api/cases`                      | Yes  | List user's cases                | —                                                                | Case[] with clipsCount|
| GET    | `/api/cases/:id`                  | Yes  | Get full case details            | —                                                                | `{ case, evidence, timeline, notes, summary }` |
| PUT    | `/api/cases/:id`                  | Yes  | Update case status/priority      | `{ status, priority }`                                          | Updated Case          |
| POST   | `/api/cases/:id/evidence`         | Yes  | Add evidence to a case           | `{ videoId, detectionId, timestamp, timestampSeconds, label, confidence, thumbnailPath }` | Evidence document |
| POST   | `/api/cases/:id/notes`            | Yes  | Add investigator note            | `{ content }`                                                   | CaseNote document     |
| GET    | `/api/cases/:id/report/preview`   | Yes  | Get HTML report preview          | —                                                                | `{ html }`            |
| GET    | `/api/cases/:id/report`           | Yes  | Download PDF report              | —                                                                | `application/pdf`     |

---

## Analytics

| Method | Path                        | Auth | Description                        | Response                                              |
|--------|-----------------------------|------|------------------------------------|-------------------------------------------------------|
| GET    | `/api/analytics/overview`   | Yes  | Platform statistics                | `{ totalVideos, totalDetections, totalCases }`        |
| GET    | `/api/analytics/processing` | Yes  | Processing throughput metrics      | `{ videosIndexed, framesProcessed, avgProcessingTime, recentMetrics }` |
| GET    | `/api/analytics/search`     | Yes  | Search usage analytics             | `{ totalSearches, topQueries, avgSearchTimeMs }`      |
| GET    | `/api/analytics/investigation`| Yes | Case status distribution          | `{ totalCases, casesClosed, openCases, statusDistribution }` |

---

## Settings

| Method | Path                          | Auth | Description                      | Request Body                                          | Response              |
|--------|-------------------------------|------|----------------------------------|-------------------------------------------------------|-----------------------|
| GET    | `/api/settings`               | Yes  | Get user settings                | —                                                      | UserSettings document |
| PUT    | `/api/settings`               | Yes  | Update AI/notification settings  | Partial UserSettings object                            | Updated UserSettings  |
| PUT    | `/api/settings/profile`       | Yes  | Update name/password             | `{ name?, password? }`                                 | Updated User          |
| DELETE | `/api/settings/storage/:type` | Yes  | Clear data (cascade delete)      | `:type` = `videos` or `cases`                          | `{ message }`         |

---

## Notifications

| Method | Path                      | Auth | Description                     | Response                  |
|--------|---------------------------|------|---------------------------------|---------------------------|
| GET    | `/api/notifications`      | Yes  | Get user's notifications        | Notification[]            |

---

## Administration

| Method | Path                    | Auth  | Description                        | Response                                        |
|--------|-------------------------|-------|------------------------------------|-------------------------------------------------|
| GET    | `/api/admin/metrics`    | Admin | System-wide metrics + audit log    | `{ metrics: { users, videos, cases }, activity }` |
| GET    | `/api/admin/storage`    | Admin | Disk usage statistics              | `{ uploadsSizeBytes, thumbnailsSizeBytes }`       |

> Admin endpoints require the `admin` role (enforced by RBAC middleware).

---

## AI Service (Python FastAPI)

| Method | Path        | Description                    | Request Body                                                   | Response                        |
|--------|-------------|--------------------------------|----------------------------------------------------------------|---------------------------------|
| POST   | `/process`  | Start AI processing pipeline   | `{ videoId, videoPath, detectionThreshold?, reidThreshold? }`  | `{ message, videoId }`          |
| POST   | `/search`   | Semantic vector search         | `{ query, threshold?, limit? }`                                | `{ results: [...] }`           |
| GET    | `/health`   | Health check                   | —                                                               | `{ status: "ok" }`             |
