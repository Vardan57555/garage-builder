FROM python:3.13-slim

WORKDIR /app

# Install system dependencies (minimal set)
RUN apt-get update && apt-get install -y \
    git \
    wget \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone Comfy
RUN git clone https://github.com/comfyanonymous/ComfyUI.git /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Force CPU mode for PyTorch (no CUDA/GPU)
ENV CUDA_VISIBLE_DEVICES=""

# Remove the placeholder file that git created, then create proper directory
RUN rm -rf /app/models/checkpoints/put_checkpoints_here && \
    mkdir -p /app/models/checkpoints/put_checkpoints_here

# Copy the actual model file from project root
COPY sd_xl_base_1.0.safetensors /app/models/checkpoints/put_checkpoints_here/sd_xl_base_1.0.safetensors

# Expose port
EXPOSE 8188

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8188/system_stats || exit 1

# Start Comfy with CPU mode
CMD ["python", "main.py", "--listen", "0.0.0.0", "--cpu"]
