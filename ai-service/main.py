"""
EYEQ AI Service — FastAPI entry point.
Runs on port 8001 by default.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from fastapi.staticfiles import StaticFiles
from app.routes.process import router as process_router
from app.routes.search import router as search_router

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

load_dotenv()

app = FastAPI(
    title="EYEQ AI Service",
    description="YOLOv4-tiny object detection pipeline for CCTV footage",
    version="1.0.0",
)

# Ensure static directory exists
os.makedirs("static/thumbnails", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(process_router)
app.include_router(search_router)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("============= 422 VALIDATION ERROR =============")
    print("Errors:", exc.errors())
    print("Body:", exc.body)
    print("================================================")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "EYEQ AI"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("AI_SERVICE_PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
