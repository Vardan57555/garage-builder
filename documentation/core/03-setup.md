# Setup Guide

## Prerequisites

### Required
- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git**
- **~1GB disk space** for database initialization

### Optional (for GPU features)
- **NVIDIA GPU** with 12GB+ VRAM (RTX 3090 or better)
- **NVIDIA Drivers** (525.60.13+)
- **NVIDIA Container Toolkit**

## Quick Start (Recommended)

The easiest way to get started is using the Makefile:

```bash
# Clone the repository
git clone https://github.com/Vardan57555/garage-builder.git
cd garage-builder

# Start everything (databases, backend, frontend, AI services)
make start
```

This command will:
1. Build all Docker images
2. Start MySQL and Redis databases
3. Wait for database to be ready
4. Start ComfyUI and Ollama services
5. Start phpMyAdmin
6. Install dependencies and run migrations
7. Start the backend and Streamlit frontend

## Manual Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (optional - defaults work for development)
```

### 2. Start Database Services

```bash
# Start MySQL and Redis
docker compose -f db-compose.yml up -d

# Wait for MySQL to be ready
./scripts/initialize_services/wait-for-db.sh
```

### 3. Run Migrations and Seeders

```bash
# Run all migrations
make run-migrations

# Run all seeders
make run-seeders
```

### 4. Start Application Services

```bash
# Start all main services
docker compose up -d
```

## Access Points

After successful startup:

| Service | URL | Purpose |
|---------|-----|---------|
| **Streamlit UI** | http://localhost:8501 | Main chat interface |
| **Backend API** | http://localhost:5003 | REST API |
| **Image Generator** | http://localhost:5001 | Image generation UI |
| **phpMyAdmin** | http://localhost:8080 | Database management |
| **ComfyUI** | http://localhost:8188 | Image generation backend |
| **Ollama** | http://localhost:11434 | LLM API |

## Development Setup

### Backend Development

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install dependencies
pnpm install

# Start development server with hot reload
pnpm run dev
```

### Frontend Development

```bash
cd client

# Create virtual environment (optional)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run Streamlit
streamlit run app.py
```

### Image Generation Service

```bash
cd garage-image-service

# For demo mode (no GPU required)
make image-gen-demo

# For production mode (requires GPU)
make image-gen-build
make image-gen-start
```

## Database Management

### Using Makefile Commands

```bash
# Run all migrations
make run-migrations

# Run all seeders
make run-seeders

# Undo all migrations
make undo-migrations

# Undo all seeders
make undo-seeders
```

### Using Sequelize CLI

```bash
# Run migrations
pnpm sequelize-cli db:migrate

# Undo last migration
pnpm sequelize-cli db:migrate:undo

# Run seeders
pnpm sequelize-cli db:seed:all

# Undo seeders
pnpm sequelize-cli db:seed:undo:all
```

## GPU Configuration

### Verify NVIDIA Setup

```bash
# Check NVIDIA driver
nvidia-smi

# Test Docker GPU access
docker run --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### Install NVIDIA Container Toolkit

```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### Configure Docker for GPU

Add to `/etc/docker/daemon.json`:
```json
{
    "runtimes": {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    },
    "default-runtime": "nvidia"
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if MySQL is running
docker ps | grep mysql

# View MySQL logs
docker logs mysql

# Connect to MySQL directly
docker exec -it mysql mysql -u pricing_engine -psecret garage
```

### Service Not Starting

```bash
# View all container logs
docker compose logs

# View specific service logs
docker compose logs garage-backend
docker compose logs streamlit-client

# Restart all services
make restart
```

### Port Conflicts

If ports are already in use:
```bash
# Check what's using a port
lsof -i :8501
lsof -i :5003

# Kill process using port
kill -9 <PID>
```

### Clean Restart

```bash
# Stop and remove all containers, volumes
make clean

# Start fresh
make start
```

## Common Commands

```bash
# Start all services
make start

# Stop all services
make dock_down

# View logs
docker compose logs -f

# Restart services
make restart

# Clean everything
make clean

# Image generation (demo mode)
make image-gen-demo

# Image generation (production)
make image-gen-start
```
