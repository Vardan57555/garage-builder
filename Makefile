DB_COMPOSE_FILE = db-compose.yml
MAIN_COMPOSE_FILE = docker-compose.yml
IMAGE_GEN_DIR = garage-image-service

.PHONY: start down dock_down dock_up restart logs run-migrations run-seeders undo-migrations undo-seeders
.PHONY: image-gen-build image-gen-start image-gen-stop image-gen-restart image-gen-logs image-gen-test image-gen-health
.PHONY: image-gen-demo image-gen-demo-stop image-gen-demo-logs comfyui-health comfyui-logs

start:
	@echo "🚀 Building services..."
	docker compose build --no-cache

	@echo "🗄️  Starting databases..."
	docker compose -f $(DB_COMPOSE_FILE) up -d

	chmod +x ./scripts

	sh ./scripts/initialize_services/wait-for-db.sh

	@echo "🎨 Starting ComfyUI service..."
	docker compose -f $(MAIN_COMPOSE_FILE) up -d comfyui

	@echo "🤖 Starting Ollama service..."
	docker compose -f $(MAIN_COMPOSE_FILE) up -d ollama

	@echo "📊 Starting phpMyAdmin..."
	docker compose -f $(MAIN_COMPOSE_FILE) up -d phpmyadmin

	@echo "📦 Installing dependencies..."
	sh ./scripts/initialize_services/initialize.sh

	@echo "🔧 Starting main services..."
	docker compose -f $(MAIN_COMPOSE_FILE) up -d garage-backend streamlit-client

	@echo "✅ All services started!"

db: down
	docker compose -f $(DB_COMPOSE_FILE) up -d
	make run-migrations
	make run-seeders

run-migrations:
	sh ./scripts/initialize_services/run-all-migrations.sh

run-seeders:
	sh ./scripts/initialize_services/run-all-seeders.sh

undo-migrations:
	sh ./scripts/clean_services/undo-all-migrations.sh

undo-seeders:
	sh ./scripts/clean_services/undo-all-seeders.sh

restart: down start

down: undo-seeders undo-migrations
	docker compose -f $(MAIN_COMPOSE_FILE) down
	docker compose -f $(DB_COMPOSE_FILE) down

dock_down:
	docker compose -f $(MAIN_COMPOSE_FILE) down
	docker compose -f $(DB_COMPOSE_FILE) down

dock_up:
	docker compose -f $(DB_COMPOSE_FILE) up -d
	make run-migrations
	make run-seeders

clean: down
	@echo "Removing all project containers, networks, and volumes..."
	docker compose -f $(MAIN_COMPOSE_FILE) down --rmi all --volumes --remove-orphans
	docker compose -f $(DB_COMPOSE_FILE) down --volumes --remove-orphans

	@echo "Removing project-specific volumes..."
	-docker volume rm garage-builder_ollama-data garage-builder_redis-data garage-builder_mysql-data 2>/dev/null || true

	@echo "Project cleanup complete!"

# ============================================================================
# Image Generation Service Commands
# ============================================================================

image-gen-build:
	@echo "🔨 Building image generation service..."
	cd $(IMAGE_GEN_DIR) && docker compose build

image-gen-start:
	@echo "🚀 Starting image generation service..."
	cd $(IMAGE_GEN_DIR) && docker compose up -d
	@echo "✅ Image generation service started at http://localhost:5001"

image-gen-stop:
	@echo "🛑 Stopping image generation service..."
	cd $(IMAGE_GEN_DIR) && docker compose down

image-gen-restart: image-gen-stop image-gen-start
	@echo "♻️  Image generation service restarted"

image-gen-logs:
	@echo "📋 Viewing image generation logs (Ctrl+C to exit)..."
	cd $(IMAGE_GEN_DIR) && docker compose logs -f

image-gen-test:
	@echo "🧪 Running image generation tests..."
	python tests/image-generation/test_service.py

image-gen-health:
	@echo "🏥 Checking image generation service health..."
	@curl -s http://localhost:5001/health | python -m json.tool || echo "Service not running"

image-gen-shell:
	@echo "🐚 Accessing image generation container shell..."
	docker exec -it garage-image-generator bash

image-gen-gpu:
	@echo "🎮 Checking GPU status..."
	@docker exec garage-image-generator nvidia-smi || echo "Container not running"

image-gen-clean:
	@echo "🧹 Cleaning up image generation service..."
	cd $(IMAGE_GEN_DIR) && docker compose down -v
	@echo "✅ Image generation cleanup complete"

# ============================================================================
# Image Generation Demo Mode (No GPU Required)
# ============================================================================

image-gen-demo:
	@echo "🎨 Starting image generation service in DEMO mode..."
	@echo "📝 This generates placeholder images for testing"
	@echo "⚡ No GPU or ComfyUI required!"
	cd $(IMAGE_GEN_DIR) && docker compose -f docker-compose.demo.yml up -d --build
	@echo "✅ Demo service started at http://localhost:5001"
	@echo ""
	@echo "Test it with:"
	@echo "  make image-gen-test"
	@echo "Or open Streamlit at http://localhost:8501 → Image Generator"

image-gen-demo-stop:
	@echo "🛑 Stopping demo service..."
	cd $(IMAGE_GEN_DIR) && docker compose -f docker-compose.demo.yml down

image-gen-demo-logs:
	@echo "📋 Viewing demo service logs..."
	cd $(IMAGE_GEN_DIR) && docker compose -f docker-compose.demo.yml logs -f
