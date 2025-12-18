# Project Structure

Complete directory structure and file organization for the Garage Builder project.

## Root Directory

```
garage-builder/
├── README.md                           # Project overview
├── Makefile                            # Build and deployment commands
├── docker-compose.yml                  # Main services orchestration
├── db-compose.yml                      # Database services (MySQL, Redis)
├── Dockerfile                          # Main backend container
├── package.json                        # Node.js dependencies (pnpm)
├── pnpm-lock.yaml                      # pnpm lock file
├── pnpm-workspace.yaml                 # pnpm workspace config
├── tsconfig.json                       # TypeScript configuration
├── biome.json                          # Biome linter/formatter config
├── .gitignore                          # Git ignore rules
├── .env.example                        # Environment variables template
├── .sequelizerc                        # Sequelize CLI configuration
├── pricing_engine_pre.sql              # Database initialization SQL
│
├── documentation/                      # 📚 All project documentation
├── tests/                              # 🧪 All test files
├── client/                             # 🎨 Streamlit frontend
├── garage-image-service/               # 🖼️  Image generation service
├── source/                             # 💻 Backend source code (TypeScript)
├── scripts/                            # 🔧 Utility scripts
├── sequelize/                          # 🗄️  Database migrations & seeders
└── Comfy/                              # 🎨 ComfyUI Dockerfile
```

## Documentation (`documentation/`)

All project documentation in one centralized location.

```
documentation/
├── README.md                          # Documentation index
│
├── core/                              # Core documentation
│   ├── 00-project-structure.md        # This file
│   ├── 01-overview.md                 # Project overview
│   ├── 02-architecture.md             # System architecture
│   ├── 03-setup.md                    # Setup instructions
│   ├── 04-api.md                      # API documentation
│   ├── 04-database-schema.md          # Database schema
│   ├── 05-development-guide.md        # Development guide
│   └── 06-product-requirements.md     # Product requirements
│
├── image-generation/                  # Image Generation Service
│   ├── 07-image-generation-service.md     # Service overview
│   ├── 08-image-generation-docker-setup.md # Docker setup
│   ├── 09-image-generation-architecture.md # Architecture
│   └── 10-image-generation-summary.md     # Implementation summary
│
└── guides/                            # Guides & References
    ├── 11-access-guide.md             # Access all services
    ├── 12-integration-complete.md     # Integration summary
    ├── 13-production-mode.md          # Production deployment
    └── 14-testing-guide.md            # Testing procedures
```

## Testing (`tests/`)

All test files organized by category.

```
tests/
├── README.md                          # Testing documentation
│
├── image-generation/                  # Image service tests
│   └── test_service.py               # API and generation tests
│
├── integration/                       # Integration tests
│   └── (future tests)
│
└── unit/                             # Unit tests
    └── (future tests)
```

## Frontend (`client/`)

Streamlit-based user interface.

```
client/
├── Dockerfile                         # Frontend container
├── requirements.txt                   # Python dependencies
├── app.py                            # Main Streamlit app
│
└── pages/                            # Streamlit pages
    ├── image_generator.py            # Image generation page
    └── (other pages)
```

## Image Generation Service (`garage-image-service/`)

AI-powered image generation microservice.

```
garage-image-service/
├── Docker Configuration
├── Dockerfile.complete                # Production image
├── Dockerfile.demo                    # Demo/testing image
├── docker-compose.yml                 # Production compose
├── docker-compose.demo.yml            # Demo compose
├── supervisord.conf                   # Process management
├── download_models.sh                 # Model downloader
│
├── Application
├── app.py                            # FastAPI production app
├── app_demo.py                       # FastAPI demo app
├── requirements.txt                   # Python dependencies
│
├── services/                         # Service modules
│   ├── __init__.py
│   ├── prompt_builder.py             # Prompt generation
│   ├── image_generator.py            # ComfyUI interface
│   └── storage.py                    # File management
│
├── static/                           # Web interface
│   └── index.html                    # Standalone UI
│
└── outputs/                          # Generated images
    └── (generated files)
```

## Backend (`source/`)

Node.js/TypeScript backend API with AI-powered conversational agents.

```
source/
├── main.ts                           # Application entry point
├── app.ts                            # Express application setup
│
├── agents/                           # 🤖 AI Agent System (LangGraph)
│   ├── LeadAgent.ts                  # Main conversational agent
│   ├── LeadAgentGraph.ts             # LangGraph workflow definition
│   ├── LeadAgentState.ts             # Agent state management
│   ├── LeadAgentHelpers.ts           # Helper functions
│   ├── IntentDetectionNode.ts        # Intent detection node
│   ├── LangSmithConfig.ts            # LangSmith tracing config
│   ├── tools/                        # Agent tools
│   │   ├── impl/                     # Tool implementations
│   │   │   ├── ParameterExtractionNode.ts
│   │   │   ├── PriceCalculationNode.ts
│   │   │   ├── ColorServiceImpl.ts
│   │   │   ├── AddonServiceImpl.ts
│   │   │   ├── GarageImageGeneratorNode.ts
│   │   │   ├── ComfyUIClientNode.ts
│   │   │   ├── FuzzyIntentMatcher.ts
│   │   │   ├── AIDimensionDetector.ts
│   │   │   └── ... (30+ tool implementations)
│   │   ├── io/                       # Tool I/O interfaces
│   │   └── validators/               # Input validators
│   └── validators/                   # Agent validators
│
├── modules/                          # 📦 Business Modules
│   ├── building-service/             # Building configuration
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   ├── chat-service/                 # Chat API endpoints
│   ├── manufacturer-service/         # Manufacturer data
│   ├── price-service/                # Pricing calculations
│   └── states-service/               # State/region data
│
├── common/                           # 🔧 Shared Components
│   ├── controller/                   # Base controllers
│   ├── io/                           # Interfaces & types
│   ├── middleware/                   # Express middleware
│   └── routes/                       # Route definitions
│
├── config/                           # ⚙️ Configuration
│   ├── db/                           # Database config
│   │   ├── MySqlManager.ts           # MySQL connection manager
│   │   └── models/                   # Sequelize models (134 models)
│   ├── redis/                        # Redis configuration
│   └── system-config/                # App configuration
│
├── configs/                          # 📄 Config Files
│   ├── app.json                      # App settings
│   ├── mysql.json                    # MySQL settings
│   └── redis-config.json             # Redis settings
│
├── errors/                           # ❌ Error handling
├── llm/                              # 🧠 LLM configuration
└── utils/                            # 🛠️ Utilities
    ├── cors/                         # CORS utilities
    ├── logger/                       # Logging (Pino)
    └── session/                      # Session management
```

## Scripts (`scripts/`)

Utility and deployment scripts.

```
scripts/
├── initialize_services/              # Service initialization
│   ├── initialize.sh                 # Main initialization script
│   ├── run-all-migrations.sh         # Run database migrations
│   ├── run-all-seeders.sh            # Run database seeders
│   ├── ollama-init.sh                # Initialize Ollama models
│   ├── ollama-wait.sh                # Wait for Ollama service
│   ├── ollama-model-wait.sh          # Wait for model download
│   ├── comfyui-checkpoint.sh         # Download ComfyUI checkpoints
│   ├── wait-for-comfyui.sh           # Wait for ComfyUI service
│   ├── wait-for-db.sh                # Wait for database
│   └── wait-for-db-docker.sh         # Wait for DB in Docker
│
└── clean_services/                   # Cleanup scripts
    ├── clean_project.sh              # Clean project files
    ├── undo-all-migrations.sh        # Undo migrations
    └── undo-all-seeders.sh           # Undo seeders
```

## Database (`sequelize/`)

Sequelize ORM migrations and seeders.

```
sequelize/
├── migrations/                       # Database migrations (134 files)
│   ├── 20251001151041-create_additional_features.js
│   ├── 20251001151211-create_addon.js
│   ├── 20251001151245-create_addons_width.js
│   └── ... (131 more migration files)
│
└── seeders/                          # Seed data (124 files)
    ├── 20251002062207-seed-additional-features.js
    ├── 20251002062402-seed-addon.js
    ├── 20251002062503-seed-addons-width.js
    └── ... (121 more seeder files)
```

**Note:** The `pricing_engine_pre.sql` file in root contains the complete database initialization (~961MB).

## Key Files

### Configuration Files

| File | Purpose |
|------|---------|
| `Makefile` | Build, test, and deployment commands |
| `docker-compose.yml` | Main services (app, Streamlit, Ollama) |
| `db-compose.yml` | Database services (MySQL, Redis, phpMyAdmin) |
| `package.json` | Node.js dependencies and scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `.env.example` | Environment variables template |

### Docker Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Main application container |
| `client/Dockerfile` | Streamlit frontend container |
| `garage-image-service/Dockerfile.complete` | Production image generation |
| `garage-image-service/Dockerfile.demo` | Demo image generation |

### Entry Points

| File | Purpose |
|------|---------|
| `source/main.ts` | Backend API server entry point |
| `source/app.ts` | Express application setup |
| `client/app.py` | Streamlit frontend (chat interface) |
| `garage-image-service/app.py` | Image generation service (FastAPI) |
| `garage-image-service/app_demo.py` | Demo mode (no GPU required) |

## File Naming Conventions

### Documentation
- Numbered files (00-14): Core documentation in reading order
- Descriptive names: Clear purpose from filename
- Markdown format: All docs in `.md` format

### Code Files
- TypeScript: `.ts` extension
- Python: `.py` extension
- Configuration: `.json`, `.yml`, `.conf`
- Scripts: `.sh` extension with executable permission

### Test Files
- Prefix: `test_` for test files
- Location: Organized by test type in `tests/` directory
- Format: Python test files (`.py`)

## Important Directories

### Generated/Runtime
```
outputs/                              # Generated images (gitignored)
node_modules/                         # Node dependencies (gitignored)
__pycache__/                          # Python cache (gitignored)
.pytest_cache/                        # Pytest cache (gitignored)
```

### Docker Volumes
```
comfyui-models/                       # SDXL model storage (Docker volume)
ollama-data/                          # Ollama models (Docker volume)
redis-data/                           # Redis persistence (Docker volume)
mysql-data/                           # MySQL data (Docker volume)
```

## Access Points

### Web Interfaces
- Main App: http://localhost:8501
- Image Generator: http://localhost:5001
- phpMyAdmin: http://localhost:8080

### API Endpoints
- Backend API: http://localhost:5003
- Image Generation API: http://localhost:5001/generate-image
- Ollama API: http://localhost:11434

### Database
- MySQL: localhost:3306
- Redis: localhost:6379

## Size Information

### Docker Images
- Base application: ~500MB
- Streamlit frontend: ~200MB
- Image generation (demo): ~200MB
- Image generation (production): ~15GB

### Models
- SDXL model: ~7GB
- Ollama models: Variable (2-8GB per model)

### Generated Content
- Preview images: ~50-100KB each
- Standard images: ~1-2MB each
- High-res images: ~3-5MB each

## Development Workflow

### 1. Start Services
```bash
make start                            # Start main application
make image-gen-start                  # Start image generation
```

### 2. Development
```bash
# Edit code in:
- src/                                # Backend
- client/                             # Frontend
- garage-image-service/               # Image service
```

### 3. Testing
```bash
make image-gen-test                   # Run image tests
python tests/image-generation/test_service.py
```

### 4. Documentation
```bash
# Update docs in:
- documentation/                      # All documentation
```

## Maintenance

### Logs
```bash
make logs                             # Main app logs
make image-gen-logs                   # Image service logs
docker logs <container-name>          # Specific container
```

### Cleanup
```bash
make clean                            # Clean main app
make image-gen-clean                  # Clean image service
docker system prune                   # Clean Docker
```

### Backups
```bash
# Database backup
docker exec mysql mysqldump -u root -p garage > backup.sql

# Volume backup
docker run --rm -v comfyui-models:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/models-backup.tar.gz /data
```

## Quick Reference

### Most Used Commands
```bash
make start                            # Start everything
make image-gen-demo                   # Start demo mode
make image-gen-start                  # Start production mode
make image-gen-test                   # Run tests
make logs                             # View logs
make down                             # Stop everything
```

### Most Important Files
- `Makefile` - All commands
- `documentation/README.md` - Documentation index
- `docker-compose.yml` - Main service configuration
- `db-compose.yml` - Database services
- `source/agents/LeadAgent.ts` - Main AI agent logic
- `source/agents/LeadAgentGraph.ts` - LangGraph workflow
- `garage-image-service/app.py` - Image generation logic
- `client/app.py` - Streamlit chat interface

### Most Important Directories
- `documentation/` - All docs
- `source/agents/` - AI agent system
- `source/modules/` - Business logic modules
- `source/config/db/models/` - Database models (134 models)
- `garage-image-service/` - Image generation
- `client/` - Streamlit frontend
- `sequelize/` - Database migrations & seeders

## Navigation Tips

1. **Start here**: `README.md` (project root)
2. **Learn the system**: `documentation/README.md`
3. **Set up**: `documentation/03-setup.md`
4. **Develop**: `documentation/05-development-guide.md`
5. **Test**: `tests/README.md`
6. **Deploy**: `documentation/13-production-mode.md`

## Related Documentation

- [Documentation Index](README.md)
- [Setup Guide](03-setup.md)
- [Development Guide](05-development-guide.md)
- [Testing Guide](14-testing-guide.md)
