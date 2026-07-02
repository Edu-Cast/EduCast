# EduCast Python Test Suite

All tests live in the root `tests/` directory and are written with `pytest`.

## Structure

```text
tests/
  unit/          # Python unit/contract tests for source code and configuration
  integration/   # API integration tests against a running backend stack
  e2e/           # End-to-end smoke tests against the public frontend
```

## Install test dependencies

```powershell
py -m pip install -r tests\requirements.txt
```

## Run unit tests only

Unit tests do not require Docker or a running API.

```powershell
py -m pytest tests\unit
```

## Run integration and end-to-end tests locally

```powershell
docker compose up --build -d
py -m pytest tests\integration tests\e2e
```

## Run the full suite locally

```powershell
docker compose up --build -d
py -m pytest tests
```

## Run tests against the VM

```powershell
$env:EDUCAST_BASE_URL="http://10.93.27.50"
$env:EDUCAST_FRONTEND_URL="http://10.93.27.50"
py -m pytest tests
```

## Covered areas

- Unit tests: backend security rules, service branch contracts, Docker Compose, Dockerfiles, nginx proxy, frontend API/store/helper contracts.
- Integration tests: auth API, podcast API, protected interaction endpoints, request validation, invalid token behavior.
- E2E tests: frontend HTML serving and SPA fallback through nginx.
