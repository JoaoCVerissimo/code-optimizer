.PHONY: dev build test lint typecheck migrate sandbox-images docker-up docker-down clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start all services in dev mode (postgres + redis via Docker, apps via turbo)
	docker compose up -d postgres redis
	set -a && . ./.env && set +a && npx turbo run dev --parallel

build: ## Build all apps and packages
	npx turbo run build

test: ## Run all tests
	npx turbo run test

lint: ## Lint all packages
	npx turbo run lint

typecheck: ## Typecheck all packages
	npx turbo run typecheck

migrate: ## Run database migrations
	npx tsx scripts/migrate.ts

sandbox-images: ## Build all sandbox Docker images
	bash scripts/build-sandbox-images.sh

docker-up: ## Start full stack via Docker Compose
	docker compose up --build

docker-down: ## Stop all Docker Compose containers
	docker compose down

clean: ## Remove build artifacts and node_modules
	npx turbo run clean
	rm -rf node_modules
