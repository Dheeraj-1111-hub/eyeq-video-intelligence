@echo off
echo Starting EYEQ AI Service on port 8001...
cd /d "%~dp0"

IF EXIST "venv\Scripts\activate.bat" (
    echo Activating Virtual Environment...
    call venv\Scripts\activate.bat
) ELSE (
    echo WARNING: Virtual environment not found. Running on global Python.
)

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
