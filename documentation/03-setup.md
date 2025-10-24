# Setup Guide

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- NVIDIA GPU with drivers installed (for GPU acceleration)
- NVIDIA Container Toolkit
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vardan57555/garage-builder.git
   cd garage-builder
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env` and update the values
   - Configure database credentials
   - Set up API keys and other environment-specific variables

3. **Build and Start Services**
   ```bash
   # Start all services
   make start
   
   # Or manually with docker-compose
   docker-compose up -d --build
   ```

4. **Verify Installation**
   - Frontend: http://localhost:8501
   - Backend API: http://localhost:5003
   - Database: Configured in `db-compose.yml`

## Development Setup

1. **Install Dependencies**
   ```bash
   # Backend dependencies
   cd source
   npm install
   
   # Frontend dependencies
   cd ../client
   pip install -r requirements.txt
   ```

2. **Start Development Servers**
   ```bash
   # Backend (from source/ directory)
   npm run dev
   
   # Frontend (from client/ directory)
   streamlit run app.py
   ```

## Database Setup

1. **Run Migrations**
   ```bash
   # From project root
   cd sequelize
   npx sequelize-cli db:migrate
   ```

2. **Seed Initial Data**
   ```bash
   npx sequelize-cli db:seed:all
   ```

## GPU Configuration

The application is configured to use GPU acceleration for AI workloads. Ensure:

1. NVIDIA drivers are installed
2. NVIDIA Container Toolkit is set up
3. Docker is configured to use the NVIDIA runtime

Verify GPU access:
```bash
docker run --gpus all nvidia/cuda:11.0-base nvidia-smi
```
