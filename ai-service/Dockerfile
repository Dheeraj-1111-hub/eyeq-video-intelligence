FROM python:3.10-slim

# Install system dependencies for OpenCV and FFmpeg
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    libsm6 \
    libxext6 \
    git \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Step 1: Install PyTorch first (CPU-only to keep image size manageable)
RUN pip install --no-cache-dir torch==2.5.1 torchvision==0.20.1 --index-url https://download.pytorch.org/whl/cpu

# Step 2: Install the rest of the requirements (these contain numpy, scipy, opencv, etc.)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Step 3: Install Cython and torchreid directly from GitHub
RUN pip install --no-cache-dir Cython gdown yacs h5py tensorboard tb-nightly future
RUN pip install --no-cache-dir git+https://github.com/KaiyangZhou/deep-person-reid.git

COPY . .

# Ensure thumbnails directory exists
RUN mkdir -p static/thumbnails

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
