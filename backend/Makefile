.PHONY: help install lint format test run-dev run-prod migrate seed celery beat docker-up docker-down

help:
	@echo "CollabFlow Backend Development Commands:"
	@echo "  make install     - Install all pinned dependencies"
	@echo "  make migrate     - Run Django database migrations"
	@echo "  make seed        - Seed demo users, workspaces, channels, tasks, events"
	@echo "  make run-dev     - Run Daphne ASGI server in development mode"
	@echo "  make celery      - Start Celery worker"
	@echo "  make beat        - Start Celery Beat scheduler"
	@echo "  make test        - Run backend test suite via pytest"
	@echo "  make lint        - Run ruff and mypy"
	@echo "  make format      - Run ruff and black auto-formatters"
	@echo "  make docker-up   - Start full stack in Docker (Postgres + Redis + Daphne + Workers)"
	@echo "  make docker-down - Stop full stack Docker containers"

install:
	pip install -r requirements.txt

migrate:
	python manage.py migrate

seed:
	python manage.py seed_demo

run-dev:
	daphne -b 0.0.0.0 -p 8000 config.asgi:application

celery:
	celery -A config worker -l info

beat:
	celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

test:
	pytest

lint:
	ruff check .
	mypy .

format:
	ruff check --fix .
	black .

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
