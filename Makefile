# Makefile for social-network-api.
#
# Docker-first: every target runs inside Docker; nothing is verified on the host.
#
# Compose project name is namespaced per repo (CLAUDE.md R4): social-network-api-p5.
# The app port defaults to the first port of this repo's reserved block
# (projects/info/state/ports.md: social-network-api : 20170-20179).
#
# Targets:
#   build     - build all compose images (app runtime, test, lint, mongo)
#   test      - run the test suite inside the test stage (fails if tests fail)
#   verify    - build + test  (the Phase 5 gate)
#   up        - start the stack, only after verify passes (detached)
#   run       - start the stack in the foreground, only after verify passes
#   down      - stop and remove the stack (volumes kept)
#   lint      - run ESLint inside the test image
#   format    - no formatter in the toolchain; lint is the check
#   shell     - open a shell in the app container
#   logs      - follow compose logs
#   migrate   - n/a (Mongoose schemas are declarative)
#   seed      - n/a (no seed script)
#   security  - scan the runtime image + audit dependencies
#   clean     - stop containers and remove images (volumes/var/ kept)
#   clean-volumes - ALSO remove DB volumes and var/ state (DANGEROUS, CONFIRM=1)
#   help      - list targets

SHELL := /bin/sh
.EXPORT_ALL_VARIABLES:

COMPOSE_PROJECT_NAME ?= social-network-api-p5
APP_PORT ?= 20170
MONGO_PORT ?= 20171

COMPOSE := docker compose
DOCKER := docker

IMAGE_APP     := $(COMPOSE_PROJECT_NAME)-app
IMAGE_TEST    := $(COMPOSE_PROJECT_NAME)-test
IMAGE_RUNTIME := $(COMPOSE_PROJECT_NAME)-runtime

.PHONY: build test verify up run down lint format shell logs migrate seed security clean clean-volumes help

help:
	@echo "Targets: build test verify up run down lint format shell logs migrate seed security clean clean-volumes help"

build: ## Build all compose images (app runtime, test, lint, mongo).
	$(COMPOSE) build

test: build ## Run the test suite inside the test stage; fails if any test fails.
	$(COMPOSE) --profile test run --rm test

verify: build test ## Build + test (the Phase 5 gate; `up` depends on this).

up: verify ## Start the stack (detached), only after verify passes.
	$(COMPOSE) up -d

run: verify ## Start the stack in the foreground, only after verify passes.
	$(COMPOSE) up

down: ## Stop and remove the stack; volumes and var/ state are kept.
	$(COMPOSE) down --remove-orphans

lint: build ## Run ESLint inside the test image.
	$(COMPOSE) --profile test run --rm lint

format: ## No formatter is part of the toolchain (eslint.config.js covers behaviour rules only); lint is the check.
	@echo "No formatter configured; run 'make lint' instead." >&2
	@exit 1

shell: build ## Open a shell in the app container.
	$(COMPOSE) run --rm app sh

logs: ## Follow compose logs.
	$(COMPOSE) logs -f

migrate: ## No database migrations in this repo (Mongoose schemas are declarative).
	@echo "No migrations in this repo (Mongoose schemas are declarative)."
	@exit 0

seed: ## No seed script in this repo.
	@echo "No seed script in this repo."
	@exit 0

security: build ## Scan the runtime image (docker scout) and audit dependencies (npm audit).
	$(DOCKER) scout cves $(IMAGE_RUNTIME) || true
	$(COMPOSE) --profile test run --rm --entrypoint npm test audit --audit-level=high

clean: ## Stop containers and remove images for this project (volumes and var/ state kept).
	$(COMPOSE) down --rmi all --remove-orphans

clean-volumes: ## ALSO remove DB volumes and var/ state (DANGEROUS - user data). Requires CONFIRM=1.
	@if [ "$$CONFIRM" != "1" ]; then echo "Refusing to remove volumes/user data without CONFIRM=1"; exit 1; fi
	$(COMPOSE) down -v --remove-orphans
	rm -rf var
