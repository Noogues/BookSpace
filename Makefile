COMPOSE = docker compose -f docker-compose.yml
DEV_COMPOSE = $(COMPOSE) -f docker-compose.dev.yml

.PHONY: dev dev-logs dev-down server https logs down ps backup restore

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

## Copia de seguridad de BD + portadas en backups/
backup:
	@TS=$$(date +%Y%m%d_%H%M%S); \
	mkdir -p backups/$$TS; \
	docker compose -f docker-compose.yml exec -T postgres sh -c \
	  'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" | gzip' \
	  > backups/$$TS/database.sql.gz; \
	tar -czf backups/$$TS/covers.tar.gz -C data covers; \
	echo "Backup en backups/$$TS"; ls -lh backups/$$TS

## Restaurar desde el backup más reciente
restore:
	@TS=$$(ls -t backups | head -1); \
	echo "Restaurando desde backups/$$TS"; \
	docker compose -f docker-compose.yml exec -T postgres sh -c \
	  'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"' && \
	docker compose -f docker-compose.yml exec -T postgres sh -c \
	  'gunzip | psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' \
	  < backups/$$TS/database.sql.gz; \
	tar -xzf backups/$$TS/covers.tar.gz -C data; \
	echo "Restauración completada"

ps:
	$(COMPOSE) ps