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
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- MySQL 8.0+
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vardan57555/garage-builder.git
   cd garage-builder
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**
   ```bash
   # Backend dependencies
   cd source
   npm install
   
   # Frontend dependencies
   cd ../client
   pip install -r requirements.txt
   ```

4. **Start development services**
   ```bash
   # From project root
   docker-compose -f docker-compose.dev.yml up -d
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
# Backend tests
cd source
npm test

# Frontend tests
cd ../client
pytest
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage

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
# Start with debugger
npm run debug

# Attach VS Code debugger
# Use launch.json configuration
```

### Frontend Debugging
```bash
# Enable debug logging
DEBUG=app:* streamlit run app.py
```

### Database Debugging
```bash
# Connect to MySQL
mysql -u root -p -h 127.0.0.1 -P 3306

# Show slow queries
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Slow_queries';
```

## Performance Optimization

### Frontend
- Lazy load components
- Optimize images
- Minimize bundle size
- Use React.memo/PureComponent

### Backend
- Implement caching
- Optimize database queries
- Use connection pooling
- Implement rate limiting

### Database
- Add appropriate indexes
- Normalize/denormalize as needed
- Use EXPLAIN for query optimization
- Consider read replicas for heavy read loads

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

### Staging
```bash
# Deploy to staging
git checkout develop
git pull
docker-compose -f docker-compose.staging.yml up -d --build
```

### Production
```bash
# Deploy to production
git checkout main
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Migrations
```bash
# Run migrations
cd sequelize
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo
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
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

### Performance Monitoring
- New Relic for APM
- Prometheus + Grafana for metrics
- ELK Stack for log analysis

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
