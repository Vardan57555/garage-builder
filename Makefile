DB_COMPOSE_FILE = db-compose.yml
MAIN_COMPOSE_FILE = docker-compose.yml

.PHONY: start down dock_down dock_up restart logs run-migrations run-seeders undo-migrations undo-seeders

start:
	echo "Building services..."
	docker compose build --no-cache

	echo "Starting databases..."
	docker compose -f $(DB_COMPOSE_FILE) up -d

	chmod +x ./scripts

	sh	./scripts/initialize_services/wait-for-db.sh

	echo "Installing dependencies..."
	sh ./scripts/initialize_services/initialize.sh

	echo "Starting main services..."
	docker compose -f $(MAIN_COMPOSE_FILE) up -d

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
