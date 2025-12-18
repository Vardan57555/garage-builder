# Development Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- **Node.js** 18+ with **pnpm** package manager
- **Python** 3.9+
- **Docker** & **Docker Compose** v2.0+
- **Git**
- **NVIDIA GPU** (optional, for image generation)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vardan57555/garage-builder.git
   cd garage-builder
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (defaults work for development)
   ```

3. **Install dependencies**
   ```bash
   # Install pnpm if not installed
   npm install -g pnpm
   
   # Backend dependencies (from project root)
   pnpm install
   
   # Frontend dependencies
   cd client
   pip install -r requirements.txt
   ```

4. **Start development services**
   ```bash
   # From project root - starts everything
   make start
   
   # Or start just databases
   docker compose -f db-compose.yml up -d
   ```

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Commit Message Format
```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

**Types:**
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks

### Pull Requests
1. Create a feature branch from `develop`
2. Make your changes with tests
3. Update documentation if needed
4. Run tests and linters
5. Create a PR to `develop`
6. Get at least one approval
7. Squash and merge

## Coding Standards

### JavaScript/TypeScript
- Use ES6+ features
- Follow Airbnb JavaScript Style Guide
- Use TypeScript for new code
- Write JSDoc for public APIs

### Python
- Follow PEP 8
- Use type hints
- Write docstrings
- Use f-strings over .format()

### Database
- Use migrations for schema changes
- Index foreign keys
- Use transactions for multiple operations
- Avoid N+1 queries

## Testing

### Running Tests
```bash
# Backend tests (from project root)
pnpm test

# Custom test runner
pnpm run test:custom

# Image generation tests
make image-gen-test
# or directly:
python tests/image-generation/test_service.py
```

### Test Coverage
```bash
# Generate coverage report
pnpm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Writing Tests
- Follow AAA pattern (Arrange-Act-Assert)
- Test one thing per test case
- Use descriptive test names
- Mock external services

## Debugging

### Backend Debugging
```bash
# Start with hot reload (development mode)
pnpm run dev

# View container logs
docker logs garage-backend -f

# Access container shell
docker exec -it garage-backend sh
```

### AI Agent Debugging
```bash
# Enable LangSmith tracing (set in .env)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key

# View agent logs
docker logs garage-backend 2>&1 | grep "\[LeadAgent\]"
```

### Frontend Debugging
```bash
# View Streamlit logs
docker logs streamlit-client -f

# Run locally with debug
cd client
streamlit run app.py --logger.level=debug
```

### Database Debugging
```bash
# Connect to MySQL via Docker
docker exec -it mysql mysql -u pricing_engine -psecret garage

# Or use phpMyAdmin
open http://localhost:8080

# Show slow queries
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Slow_queries';
```

### Image Generation Debugging
```bash
# View image service logs
make image-gen-logs

# Check ComfyUI status
curl http://localhost:8188/system_stats

# Check GPU status
make image-gen-gpu
```

## Performance Optimization

### AI Agent Performance
- Use fuzzy matching before LLM calls (faster)
- Batch dimension detection with regex
- Cache frequently used database queries
- Session timeout management (30 min default)

### Backend
- Redis caching for session state
- Connection pooling via Sequelize
- Optimize database queries with indexes
- Use `EXPLAIN` for slow query analysis

### Image Generation
- Use preview mode (512x512) for faster iteration
- Cache generated images by parameter hash
- Consider queue system for production (Celery/RQ)
- GPU memory management

### Database
- 134 models with proper indexing
- Use migrations for schema changes
- Avoid N+1 queries in Sequelize
- Consider read replicas for heavy loads

## Security Considerations

### Authentication & Authorization
- Use JWT with secure settings
- Implement role-based access control
- Store secrets in environment variables
- Use HTTPS in production

### Input Validation
- Validate all user inputs
- Use parameterized queries
- Sanitize HTML output
- Implement CSRF protection

### Dependencies
- Keep dependencies updated
- Use `npm audit` and `safety check`
- Pin dependency versions
- Review third-party code

## Deployment

### Development
```bash
# Start all services
make start

# Start with fresh database
make clean
make start
```

### Production
```bash
# Build production images
docker compose build --no-cache

# Start services
docker compose -f db-compose.yml up -d
docker compose up -d

# For image generation (requires GPU)
make image-gen-build
make image-gen-start
```

### Database Migrations
```bash
# Run all migrations
make run-migrations

# Run all seeders
make run-seeders

# Undo migrations
make undo-migrations

# Using Sequelize CLI directly
pnpm sequelize-cli db:migrate
pnpm sequelize-cli db:migrate:undo
```

## Troubleshooting

### Common Issues

**Docker Compose Fails to Start**
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose up --build
```

**Database Connection Issues**
- Verify database is running
- Check connection string in .env
- Ensure user has correct permissions

**Frontend Not Updating**
- Clear browser cache
- Check console for errors
- Restart Streamlit server

### Getting Help
1. Check the project's GitHub issues
2. Search the documentation
3. Ask in the team's Slack channel
4. Pair with a team member

## Monitoring and Logging

### Application Logs
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f garage-backend
docker compose logs -f streamlit-client
docker compose logs -f comfyui
docker compose logs -f ollama

# View image generation logs
make image-gen-logs
```

### Logging Configuration
- Backend uses **Pino** logger
- Logs include module name and timestamp
- LangSmith for AI agent tracing
- Container logs via Docker

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
