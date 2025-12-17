FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git \
    wget \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth=1 https://github.com/comfyanonymous/ComfyUI.git /app

RUN pip install --no-cache-dir -r /app/requirements.txt

ENV CUDA_VISIBLE_DEVICES=""

RUN mkdir -p /app/models/checkpoints

EXPOSE 8188

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8188/system_stats || exit 1

CMD ["python", "main.py", "--listen", "0.0.0.0", "--cpu"]
