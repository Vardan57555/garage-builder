# Garage Builder - Project Overview

## Introduction

Garage Builder (Sensei Structure Builder) is an AI-powered platform for designing, visualizing, and estimating costs for various small structures including garages, sheds, carports, and barns. The application features a conversational AI interface that guides users through the building configuration process, provides real-time pricing, and generates photorealistic visualizations.

## Key Features

### 🤖 AI-Powered Conversational Interface
- Natural language understanding for building specifications
- Intent detection and parameter extraction
- Fuzzy matching for user inputs
- Context-aware conversation flow using LangGraph

### 💰 Dynamic Pricing Engine
- Real-time cost estimation based on dimensions, materials, and features
- State-specific pricing with tax calculations
- Add-on and customization pricing
- Manufacturer-specific pricing data

### 🖼️ Image Generation
- AI-powered photorealistic building visualizations
- ComfyUI integration with SDXL models
- Customizable styles, colors, and lighting
- Demo mode for testing without GPU

### 🏗️ Building Configuration
- Multiple building types: Garage, Shed, Carport, Barn
- Customizable dimensions (width, length, height)
- Roof types: Gable, Hip, Gambrel, Flat, A-Frame
- Color selection with manufacturer-specific options
- Add-ons: Windows, doors, insulation, electrical, etc.

### 📊 Multi-Manufacturer Support
- Support for multiple building manufacturers
- Manufacturer-specific pricing and options
- State/region availability

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Sequelize with MySQL
- **Package Manager**: pnpm

### AI/ML
- **Agent Framework**: LangChain + LangGraph
- **LLM Providers**: Ollama (local), OpenAI (cloud)
- **Image Generation**: ComfyUI with SDXL
- **Tracing**: LangSmith

### Frontend
- **Framework**: Streamlit (Python)
- **Chat Interface**: Custom conversational UI
- **Image Display**: Integrated gallery

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: MySQL 8.0
- **Cache**: Redis
- **GPU**: NVIDIA CUDA for AI workloads

## Project Structure

```
garage-builder/
├── source/              # Backend TypeScript code
│   ├── agents/          # AI agent system (LangGraph)
│   ├── modules/         # Business logic modules
│   └── config/          # Configuration & DB models
├── client/              # Streamlit frontend
├── garage-image-service/ # Image generation service
├── sequelize/           # Database migrations & seeders
├── scripts/             # Utility scripts
├── documentation/       # Project documentation
└── Comfy/               # ComfyUI Dockerfile
```

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Streamlit     │────▶│  Express Backend │────▶│    MySQL        │
│   Frontend      │     │  (LeadAgent)     │     │    Database     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌──────────────┐      ┌──────────────┐
            │   Ollama     │      │   ComfyUI    │
            │   (LLM)      │      │   (Images)   │
            └──────────────┘      └──────────────┘
```

## Quick Start

```bash
# Clone and start
git clone https://github.com/Vardan57555/garage-builder.git
cd garage-builder
make start

# Access points
# - Chat UI: http://localhost:8501
# - Backend API: http://localhost:5003
# - Image Generator: http://localhost:5001
# - phpMyAdmin: http://localhost:8080
```
