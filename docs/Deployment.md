# EYEQ — Deployment Guide

## Local Development (Docker Compose)

The fastest way to run the entire EYEQ platform locally.

### Prerequisites

- [Docker Desktop](https://docs.docker.com/get-docker/) installed and running
- At least 4 GB RAM available for containers

### Start

```bash
git clone https://github.com/your-username/Video-Intelligence.git
cd Video-Intelligence
docker compose up --build
```

> **Note:** The first build takes 5–10 minutes as it downloads YOLOv4-tiny weights (~24 MB), PyTorch, and headless Chromium.

### Access

| Service        | URL                          |
|---------------|------------------------------|
| Frontend       | http://localhost:8080         |
| Backend API    | http://localhost:5000         |
| AI Service     | http://localhost:8001         |
| FastAPI Docs   | http://localhost:8001/docs    |

### Stop

```bash
docker compose down
```

To also remove the MongoDB volume:

```bash
docker compose down -v
```

---

## Manual Setup (Without Docker)

For development with hot-reloading on each service.

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- MongoDB (local or Atlas)

### 1. MongoDB

Either run a local instance:

```bash
mongod --dbpath /data/db
```

Or use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier). Copy your connection string.

### 2. AI Service

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-intelligence
JWT_SECRET=your-secret-key-here
AI_SERVICE_URL=http://localhost:8001
```

```bash
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable         | Required | Default                    | Description                           |
|-----------------|----------|----------------------------|---------------------------------------|
| `PORT`          | No       | `5000`                     | Express server port                   |
| `MONGODB_URI`   | Yes      |                            | MongoDB connection string             |
| `JWT_SECRET`    | Yes      |                            | Secret for JWT signing                |
| `AI_SERVICE_URL`| No       | `http://localhost:8001`    | Python AI service base URL            |
| `REDIS_URL`     | No       |                            | Redis connection string (enables BullMQ) |
| `REDIS_HOST`    | No       | `127.0.0.1`               | Redis host (alternative to URL)       |
| `REDIS_PORT`    | No       | `6379`                     | Redis port                            |

### AI Service (`ai-service/.env`)

| Variable         | Required | Default                    | Description                           |
|-----------------|----------|----------------------------|---------------------------------------|
| `MONGODB_URI`   | Yes      |                            | MongoDB connection string             |
| `BACKEND_URL`   | No       | `http://backend:5000`      | Backend URL for progress webhooks     |
| `AI_SERVICE_PORT`| No      | `8001`                     | FastAPI server port                   |

### Frontend

| Variable         | Required | Default                    | Description                           |
|-----------------|----------|----------------------------|---------------------------------------|
| `VITE_API_URL`  | No       | `http://localhost:5000`    | Backend API base URL                  |

---

## Health Check Endpoints

| Service    | Endpoint                | Expected Response              |
|-----------|-------------------------|--------------------------------|
| Backend    | `GET /api/auth/me`      | 401 (confirms server is up)    |
| AI Service | `GET /health`           | `{"status": "ok"}`             |

---

## Cloud Deployment Recommendations

### Frontend → Vercel

1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set build command: `npm run build`
4. Set output directory: `.output/public` (TanStack Start SSR)
5. Set environment variable: `VITE_API_URL=https://your-backend.render.com`

### Backend → Render

1. Create a new Web Service from the GitHub repo
2. Set root directory to `backend`
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Configure environment variables (see table above)

### AI Service → Railway

1. Create a new service from the GitHub repo
2. Set root directory to `ai-service`
3. Use the existing `Dockerfile`
4. Configure environment variables

### MongoDB → MongoDB Atlas

Use the free M0 cluster tier. Whitelist your backend's IP address.

### Redis → Upstash

Use the free tier for BullMQ job queuing. Copy the Redis connection URL into `REDIS_URL`.

---

## Docker Compose Configuration

The `docker-compose.yml` at the project root defines 5 services:

| Service      | Image/Build         | Ports     | Volumes                        |
|-------------|---------------------|-----------|--------------------------------|
| `redis`     | `redis:7-alpine`    | 6379      |                                |
| `mongodb`   | `mongo:6.0`         | 27017     | `mongodb_data` (persistent)    |
| `ai-service`| Build `./ai-service` | 8001     | `static/`, `uploads/` (shared) |
| `backend`   | Build `./backend`    | 5000     | `uploads/` (shared)            |
| `frontend`  | Build `./frontend`   | 8080     |                                |

The `uploads/` directory is shared between backend and AI service so the Python process can read video files written by Multer.
