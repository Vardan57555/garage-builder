# Garage Builder (Sensei Structure Builder)

An AI-powered platform for designing, visualizing, and estimating costs for garages, sheds, carports, and barns. Built with modern technologies including LangChain, ComfyUI, and Stable Diffusion XL.

## 🚀 Features

- **🤖 AI Conversational Interface** - Natural language building configuration using LangGraph and LangChain
- **💰 Dynamic Pricing Engine** - Real-time cost estimation with state/manufacturer support
- **🖼️ Image Generation** - Photorealistic visualizations using ComfyUI + Stable Diffusion XL
- **🏠 Multi-Building Support** - Garages, sheds, carports, and barns
- **📊 Real-time Chat** - Interactive Streamlit-based user interface
- **🔌 RESTful API** - Comprehensive backend API for all services
- **🗄️ Database Management** - MySQL with Sequelize ORM and migrations
- **⚡ Caching Layer** - Redis for performance optimization

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Streamlit (Python), httpx |
| **Backend** | Node.js, TypeScript, Express.js |
| **AI/ML** | LangChain, LangGraph, Ollama, OpenAI |
| **Image Generation** | ComfyUI, Stable Diffusion XL, FastAPI |
| **Database** | MySQL 8.0, Sequelize ORM |
| **Cache** | Redis |
| **Infrastructure** | Docker, Docker Compose, Nginx |
| **Package Manager** | pnpm (Node.js), pip (Python) |

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.13+ (for local development)
- pnpm (Node.js package manager)
- GPU with CUDA support (for production image generation, optional for demo mode)

## 🔧 Installation

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/Vardan57555/garage-builder.git
cd garage-builder

# Start all services
make start

# Access the application
# - Streamlit UI: http://localhost:8501
# - Backend API: http://localhost:5003
# - Image Generator: http://localhost:5001
# - phpMyAdmin: http://localhost:8080
```

### Manual Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install Dependencies**
   ```bash
   # Backend dependencies
   pnpm install

   # Client dependencies
   cd client
   pip install -r requirements.txt
   cd ..

   # Image service dependencies
   cd garage-image-service
   pip install -r requirements.txt
   cd ..
   ```

3. **Database Setup**
   ```bash
   make db
   ```

## 📖 Usage

### Starting Services

```bash
# Start all services
make start

# Stop all services
make dock_down

# Restart all services
make restart

# Clean everything (removes volumes)
make clean
```

### Database Management

```bash
# Run migrations
make run-migrations

# Run seeders
make run-seeders

# Undo migrations
make undo-migrations

# Undo seeders
make undo-seeders
```

### Image Generation Service

```bash
# Demo mode (no GPU required)
make image-gen-demo

# Production mode (requires GPU)
make image-gen-start

# Test image generation
make image-gen-test

# View logs
make image-gen-logs

# Stop service
make image-gen-stop
```

### Development

```bash
# Build backend
pnpm build

# Run backend in development mode
pnpm dev

# Run linting
pnpm lint

# Run tests
pnpm test
```

## 🏗️ Project Structure

```
garage-builder-backend/
├── client/                      # Streamlit frontend application
│   ├── app.py                  # Main Streamlit application
│   ├── pages/                  # Streamlit pages
│   └── requirements.txt        # Python dependencies
├── garage-image-service/        # Image generation microservice
│   ├── app.py                  # FastAPI application
│   ├── services/               # Service modules
│   └── requirements.txt        # Python dependencies
├── source/                      # Backend TypeScript application
│   ├── agents/                 # AI agents and workflows
│   ├── modules/                # Feature modules
│   ├── config/                 # Configuration files
│   ├── utils/                  # Utility functions
│   ├── app.ts                  # Express app setup
│   └── main.ts                 # Application entry point
├── Comfy/                       # ComfyUI Docker configuration
├── ComfyUI/                     # ComfyUI source code
├── sequelize/                   # Database migrations and seeders
├── scripts/                     # Utility scripts
├── documentation/               # Detailed documentation
├── gateway/                     # Nginx gateway configuration
├── docker-compose.yml          # Main Docker Compose configuration
├── db-compose.yml              # Database Docker Compose configuration
├── Dockerfile                  # Backend Docker image
├── Makefile                    # Build and automation commands
├── package.json                # Node.js dependencies
└── tsconfig.json               # TypeScript configuration
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
| Nginx Gateway | 8088 | http://localhost:8088 |
| MySQL | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |

## 🔌 API Endpoints

### Chat API
- `POST /api/v1/chat/` - Send chat messages and get AI responses
- `GET /api/v1/chat/history` - Get chat history

### Image Generation API
- `POST /generate` - Generate images from prompts
- `GET /health` - Health check endpoint
- `GET /status` - Service status

For detailed API documentation, see [documentation/core/04-api.md](documentation/core/04-api.md)

## 📚 Documentation

Comprehensive documentation is available in the `documentation/` directory:

- [Project Overview](documentation/core/01-overview.md) - Features and architecture
- [Setup Guide](documentation/core/03-setup.md) - Detailed setup instructions
- [API Documentation](documentation/core/04-api.md) - Complete API reference
- [Database Schema](documentation/core/04-database-schema.md) - Database structure
- [Development Guide](documentation/core/05-development-guide.md) - Development workflow
- [Image Generation Service](documentation/image-generation/07-image-generation-service.md) - Image generation details
- [Testing Guide](documentation/guides/14-testing-guide.md) - Testing procedures

## 🧪 Testing

```bash
# Run unit tests
pnpm test:unit

# Run API tests
pnpm test:api

# Run image generation tests
make image-gen-test

# Run custom tests
pnpm test:custom
```

## 🐛 Debugging

### View Logs

```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f garage-backend
docker compose logs -f streamlit-client
docker compose logs -f comfyui
```

### Common Issues

1. **Port conflicts** - Ensure ports 8501, 5003, 5001, 8188, 11434, 8080 are available
2. **GPU not detected** - Check NVIDIA drivers and CUDA installation for image generation
3. **Database connection** - Verify MySQL is running and credentials are correct
4. **Memory issues** - Adjust Docker resource limits in docker-compose.yml

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Environment Variables

Key environment variables (see `.env` for complete list):

- `APP_PORT` - Backend port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `OLLAMA_API_HOST` - Ollama service URL
- `COMFYUI_URL` - ComfyUI service URL
- `MYSQL_DB_HOST` - MySQL host
- `MYSQL_DB` - Database name
- `MYSQL_USER` - Database user
- `MYSQL_PASSWORD` - Database password
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port

## 🔒 Security

- Never commit `.env` files or sensitive data
- Use strong secrets for `SESSION_SECRET` and `JWT_SECRET`
- Keep dependencies updated
- Use HTTPS in production
- Implement proper authentication and authorization

## 📄 License

[Specify your license here]

## 📞 Support

For support, please open an issue on the [GitHub repository](https://github.com/Vardan57555/garage-builder/issues).

## 🙏 Acknowledgments

- LangChain and LangGraph for AI orchestration
- ComfyUI and Stable Diffusion for image generation
- Streamlit for the frontend interface
- The open-source community
