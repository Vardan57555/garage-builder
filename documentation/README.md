# Garage Builder Documentation

Welcome to the Garage Builder documentation! This guide will help you understand, set up, and contribute to the project.

## Documentation Structure

```
documentation/
├── README.md                          # This file
├── core/                              # Core documentation
├── image-generation/                  # Image generation docs
└── guides/                            # Guides and references
```

## Table of Contents

### Core Documentation (`core/`)
- [Project Structure](core/00-project-structure.md) - Complete directory structure
- [Project Overview](core/01-overview.md) - Project goals and features
- [System Architecture](core/02-architecture.md) - System design
- [Setup Guide](core/03-setup.md) - Installation instructions
- [API Documentation](core/04-api.md) - REST API reference
- [Database Schema](core/04-database-schema.md) - Database structure
- [Development Guide](core/05-development-guide.md) - Development workflow
- [Product Requirements](core/06-product-requirements.md) - Feature specifications

### Image Generation Service (`image-generation/`)
- [Service Overview](image-generation/07-image-generation-service.md) - Features and capabilities
- [Docker Setup](image-generation/08-image-generation-docker-setup.md) - Docker configuration
- [Architecture](image-generation/09-image-generation-architecture.md) - Technical details
- [Implementation](image-generation/10-image-generation-summary.md) - Implementation summary

### Guides & References (`guides/`)
- [Access Guide](guides/11-access-guide.md) - How to access all services
- [Integration Complete](guides/12-integration-complete.md) - Integration status
- [Production Mode](guides/13-production-mode.md) - Production deployment
- [Testing Guide](guides/14-testing-guide.md) - Testing procedures

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/Vardan57555/garage-builder.git
   cd garage-builder
   ```

2. Start the application:
   ```bash
   make start
   ```

3. Access the application:
   - Frontend: http://localhost:8501
   - API: http://localhost:5003
   - Image Generator: http://localhost:5001

## Image Generation Service

The project includes an AI-powered image generation service for creating photorealistic visualizations of garages and sheds.

### Quick Start

```bash
# Build and start the image generation service
make image-gen-build
make image-gen-start

# Check service health
make image-gen-health
```

### Access Points
- **Streamlit UI**: http://localhost:8501 (Navigate to "Image Generator" page)
- **Direct API**: http://localhost:5001
- **Web Interface**: http://localhost:5001 (standalone)

### Available Commands

```bash
make image-gen-build      # Build the Docker image
make image-gen-start      # Start the service
make image-gen-stop       # Stop the service
make image-gen-restart    # Restart the service
make image-gen-logs       # View logs
make image-gen-test       # Run tests
make image-gen-health     # Check health
make image-gen-gpu        # Check GPU status
make image-gen-shell      # Access container shell
make image-gen-clean      # Clean up
```

For detailed setup instructions, see:
- [Image Generation Service](07-image-generation-service.md)
- [Docker Setup Guide](08-image-generation-docker-setup.md)
- [Service Architecture](09-image-generation-architecture.md)

## Support

For support, please open an issue on the [GitHub repository](https://github.com/Vardan57555/garage-builder/issues).

## License

[Specify your license here]
