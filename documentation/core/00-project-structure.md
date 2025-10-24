# Project Structure

Complete directory structure and file organization for the Garage Builder project.

## Root Directory

```
garage-builder/
├── README.md                           # Project overview
├── Makefile                            # Build and deployment commands
├── docker-compose.yml                  # Main services orchestration
├── db-compose.yml                      # Database services
├── Dockerfile                          # Main application container
├── package.json                        # Node.js dependencies
├── tsconfig.json                       # TypeScript configuration
├── .gitignore                          # Git ignore rules
├── .env.example                        # Environment variables template
│
├── documentation/                      # 📚 All project documentation
├── tests/                             # 🧪 All test files
├── client/                            # 🎨 Streamlit frontend
├── garage-image-service/              # 🖼️  Image generation service
├── src/                               # 💻 Backend source code
├── scripts/                           # 🔧 Utility scripts
└── database/                          # 🗄️  Database files
```

## Documentation (`documentation/`)

All project documentation in one centralized location.

```
documentation/
├── README.md                          # Documentation index
│
├── Core Documentation
├── 00-project-structure.md            # This file
├── 01-overview.md                     # Project overview
├── 02-architecture.md                 # System architecture
├── 03-setup.md                        # Setup instructions
├── 04-api.md                          # API documentation
├── 04-database-schema.md              # Database schema
├── 05-development-guide.md            # Development guide
├── 06-product-requirements.md         # Product requirements
│
├── Image Generation Service
├── 07-image-generation-service.md     # Service overview
├── 08-image-generation-docker-setup.md # Docker setup
├── 09-image-generation-architecture.md # Architecture
├── 10-image-generation-summary.md     # Implementation summary
│
└── Guides & References
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

## Backend (`src/`)

Node.js/TypeScript backend API.

```
src/
├── app/
│   ├── controllers/                  # Request handlers
│   ├── models/                       # Data models
│   ├── routes/                       # API routes
│   ├── services/                     # Business logic
│   ├── middleware/                   # Express middleware
│   └── utils/                        # Utility functions
│
├── config/                           # Configuration
│   ├── database.ts                   # DB configuration
│   ├── redis.ts                      # Redis configuration
│   └── ollama.ts                     # Ollama configuration
│
└── server.ts                         # Application entry point
```

## Scripts (`scripts/`)

Utility and deployment scripts.

```
scripts/
├── setup.sh                          # Initial setup
├── migrate.sh                        # Database migrations
├── seed.sh                           # Database seeding
└── deploy.sh                         # Deployment script
```

## Database (`database/`)

Database schemas and migrations.

```
database/
├── migrations/                       # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_add_sheds.sql
│   └── ...
│
├── seeds/                           # Seed data
│   ├── pricing_data.sql
│   └── test_data.sql
│
└── schemas/                         # Schema definitions
    ├── garage_schema.sql
    └── pricing_schema.sql
```

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
| `src/server.ts` | Backend API server |
| `client/app.py` | Streamlit frontend |
| `garage-image-service/app.py` | Image generation service |

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
- `tests/README.md` - Testing guide
- `docker-compose.yml` - Service configuration
- `garage-image-service/app.py` - Image generation logic

### Most Important Directories
- `documentation/` - All docs
- `tests/` - All tests
- `garage-image-service/` - Image generation
- `client/pages/` - Streamlit pages
- `src/` - Backend code

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
