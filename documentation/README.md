# Garage Builder Documentation

Welcome to the **Garage Builder (Sensei Structure Builder)** documentation! This is an AI-powered platform for designing, visualizing, and estimating costs for garages, sheds, carports, and barns.

## 🚀 Quick Start

```bash
# Clone and start
git clone https://github.com/Vardan57555/garage-builder.git
cd garage-builder
make start

# Access the application
# - Chat UI: http://localhost:8501
# - Backend API: http://localhost:5003
# - Image Generator: http://localhost:5001
# - phpMyAdmin: http://localhost:8080
```

## 📚 Documentation Structure

```
documentation/
├── README.md                          # This file
├── core/                              # Core documentation
│   ├── 00-project-structure.md        # Directory structure
│   ├── 01-overview.md                 # Project overview
│   ├── 02-architecture.md             # System architecture
│   ├── 03-setup.md                    # Setup guide
│   ├── 04-api.md                      # API documentation
│   ├── 04-database-schema.md          # Database schema
│   ├── 05-development-guide.md        # Development workflow
│   └── 06-product-requirements.md     # Product requirements
├── image-generation/                  # Image generation docs
│   ├── 07-image-generation-service.md
│   ├── 08-image-generation-docker-setup.md
│   ├── 09-image-generation-architecture.md
│   └── 10-image-generation-summary.md
└── guides/                            # Guides and references
    ├── 11-access-guide.md
    ├── 12-integration-complete.md
    ├── 13-production-mode.md
    └── 14-testing-guide.md
```

## 📖 Table of Contents

### Core Documentation (`core/`)
| Document | Description |
|----------|-------------|
| [Project Structure](core/00-project-structure.md) | Complete directory structure and file organization |
| [Project Overview](core/01-overview.md) | Features, technology stack, and architecture overview |
| [System Architecture](core/02-architecture.md) | Service architecture, data flow, and components |
| [Setup Guide](core/03-setup.md) | Installation and configuration instructions |
| [API Documentation](core/04-api.md) | REST API reference for chat and image services |
| [Database Schema](core/04-database-schema.md) | Database structure and relationships |
| [Development Guide](core/05-development-guide.md) | Development workflow and debugging |
| [Product Requirements](core/06-product-requirements.md) | Feature specifications and roadmap |

### Image Generation Service (`image-generation/`)
| Document | Description |
|----------|-------------|
| [Service Overview](image-generation/07-image-generation-service.md) | Features, API, and implementation |
| [Docker Setup](image-generation/08-image-generation-docker-setup.md) | Docker configuration and GPU setup |
| [Architecture](image-generation/09-image-generation-architecture.md) | Technical architecture details |
| [Implementation](image-generation/10-image-generation-summary.md) | Implementation summary |

### Guides & References (`guides/`)
| Document | Description |
|----------|-------------|
| [Access Guide](guides/11-access-guide.md) | How to access all services and UIs |
| [Integration Complete](guides/12-integration-complete.md) | Integration status and summary |
| [Production Mode](guides/13-production-mode.md) | Production deployment guide |
| [Testing Guide](guides/14-testing-guide.md) | Testing procedures and commands |

## 🏗️ Key Features

- **🤖 AI Conversational Interface** - Natural language building configuration using LangGraph
- **💰 Dynamic Pricing Engine** - Real-time cost estimation with state/manufacturer support
- **🖼️ Image Generation** - Photorealistic visualizations using ComfyUI + SDXL
- **🏠 Multi-Building Support** - Garages, sheds, carports, and barns

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Streamlit (Python) |
| **Backend** | Node.js, TypeScript, Express.js |
| **AI/ML** | LangChain, LangGraph, Ollama, OpenAI |
| **Image Gen** | ComfyUI, Stable Diffusion XL |
| **Database** | MySQL 8.0, Sequelize ORM |
| **Cache** | Redis |
| **Infrastructure** | Docker, Docker Compose |

## 📋 Common Commands

```bash
# Start/Stop
make start              # Start all services
make dock_down          # Stop all services
make restart            # Restart all services
make clean              # Clean everything

# Database
make run-migrations     # Run database migrations
make run-seeders        # Run database seeders

# Image Generation
make image-gen-demo     # Start demo mode (no GPU)
make image-gen-start    # Start production mode
make image-gen-test     # Run tests
make image-gen-logs     # View logs

# Logs
docker compose logs -f  # View all logs
```

## 🌐 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Streamlit UI | 8501 | http://localhost:8501 |
| Backend API | 5003 | http://localhost:5003 |
| Image Generator | 5001 | http://localhost:5001 |
| ComfyUI | 8188 | http://localhost:8188 |
| Ollama | 11434 | http://localhost:11434 |
| phpMyAdmin | 8080 | http://localhost:8080 |
| MySQL | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |

## 📞 Support

For support, please open an issue on the [GitHub repository](https://github.com/Vardan57555/garage-builder/issues).

## 📄 License

[Specify your license here]
