COMPOSE = docker compose -f docker-compose.yml
DEV_COMPOSE = $(COMPOSE) -f docker-compose.dev.yml

.PHONY: dev dev-logs dev-down server https logs down ps

## Modo desarrollador (hot reload, puertos 5173/3000/5433)
dev:
	$(DEV_COMPOSE) up --build

dev-logs:
	$(DEV_COMPOSE) logs -f

dev-down:
	$(DEV_COMPOSE) down

## Modo servidor (HTTP en :8080)
server:
	$(COMPOSE) up -d --build

## Modo servidor con HTTPS (Caddy + No-IP en :80/:443)
https:
	$(COMPOSE) --profile https up -d --build

logs:
	$(COMPOSE) logs -f

down:
	$(COMPOSE) down

ps:
	$(COMPOSE) ps