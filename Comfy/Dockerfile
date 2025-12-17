FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

<<<<<<< Updated upstream
RUN git clone --depth=1 https://github.com/comfyanonymous/ComfyUI.git /app

RUN pip install --no-cache-dir -r /app/requirements.txt

ENV CUDA_VISIBLE_DEVICES=""
=======
RUN ln -s /usr/bin/python3 /usr/bin/python

RUN git clone https://github.com/comfyanonymous/ComfyUI.git /app

RUN pip install --no-cache-dir \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 && \
    pip install --no-cache-dir -r requirements.txt
>>>>>>> Stashed changes

RUN mkdir -p /app/models/checkpoints

ENV CUDA_VISIBLE_DEVICES=0
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH
ENV PATH=/usr/local/cuda/bin:$PATH

EXPOSE 8188

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8188/system_stats || exit 1

CMD ["python", "main.py", "--listen", "0.0.0.0"]
