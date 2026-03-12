# Code Optimizer

AI-powered code optimization and benchmarking platform. Submit a function or code snippet, choose an optimization goal, and let Claude AI generate optimized variants. Each variant is executed in an isolated Docker sandbox and benchmarked for real performance comparison.

## Architecture

```
  Next.js UI (:3000)
       │
  Fastify API (:4000)
       │
  ┌────┼────────────┐
  │    │             │
PostgreSQL  Redis   Claude API
  (:5432)  (:6379)
              │
         BullMQ Worker
              │
      Docker Sandbox (ephemeral, per-run)
```

**Frontend (Next.js)** — submit code, view results with interactive charts.
**API (Fastify)** — stateless REST service. Validates input, persists to DB, enqueues jobs.
**Worker (BullMQ)** — consumes jobs, calls Claude API for optimization, spawns Docker sandbox containers for benchmarking, aggregates scores.
**Sandbox** — ephemeral Docker containers per benchmark run. No network, resource-limited, destroyed after each execution.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts, CodeMirror |
| Backend API | Fastify 5, TypeScript, Drizzle ORM |
| Worker | BullMQ, Anthropic SDK (Claude), Dockerode |
| Database | PostgreSQL 16 |
| Queue | Redis 7 |
| Sandbox | Docker containers (Python, JavaScript, TypeScript, Go) |
| Monorepo | Turborepo |
| CI | GitHub Actions |

## Prerequisites

- **Node.js** >= 20
- **Docker** and **Docker Compose**
- **Anthropic API key** (for Claude AI optimization)

## Quick Start (Docker)

```bash
# Clone and configure
git clone <repo-url> code-optimizer
cd code-optimizer
cp .env.example .env
# Edit .env and set your ANTHROPIC_API_KEY

# Build sandbox images (one-time)
make sandbox-images

# Start everything
make docker-up

# Open http://localhost:3000
```

## Development Setup

```bash
# Install dependencies
npm install

# Start infrastructure (Postgres + Redis)
docker compose up -d postgres redis

# Run database migrations
DATABASE_URL=postgres://optimizer:optimizer_dev@localhost:5432/code_optimizer make migrate

# Start all apps in dev mode (with hot reload)
make dev
```

The frontend runs on http://localhost:3000 and the API on http://localhost:4000.

## Available Commands

| Command | Description |
|---------|------------|
| `make dev` | Start Postgres/Redis + all apps in dev mode with hot reload |
| `make build` | Build all apps and packages |
| `make test` | Run all tests |
| `make lint` | Lint all packages |
| `make typecheck` | Typecheck all packages |
| `make migrate` | Run database migrations |
| `make sandbox-images` | Build Docker sandbox images for all languages |
| `make docker-up` | Start full stack via Docker Compose |
| `make docker-down` | Stop all Docker Compose containers |
| `make clean` | Remove build artifacts and node_modules |

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/submissions` | Submit code for optimization |
| `GET` | `/api/submissions` | List submissions (paginated) |
| `GET` | `/api/submissions/:id` | Get full submission with variants, benchmarks, and scores |
| `GET` | `/api/submissions/:id/status` | Lightweight status polling |
| `GET` | `/api/health` | Health check |

### POST /api/submissions

```json
{
  "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
  "language": "python",
  "optimizationGoal": "performance"
}
```

## How It Works

1. **Submit** — user pastes code, selects a language and optimization goal
2. **Enqueue** — API validates input, stores in PostgreSQL, enqueues a BullMQ job
3. **Optimize** — worker calls Claude AI with a goal-specific prompt to generate 3 optimized variants
4. **Benchmark** — each variant (including the original) is executed 3 times in an isolated Docker container with resource limits
5. **Aggregate** — metrics are normalized and scored; variants are ranked with weighted scoring based on the chosen goal
6. **Display** — frontend polls for status, then renders bar charts, radar charts, and side-by-side code comparison

## Supported Languages

- Python (3.12)
- JavaScript (Node 20)
- TypeScript (via tsx)
- Go (1.22)

## Optimization Goals

| Goal | Focus | Example Strategy |
|------|-------|-----------------|
| Performance | Execution speed, CPU usage | Algorithmic improvements, memoization |
| Memory | Peak memory consumption | Generators, in-place operations |
| Security | Vulnerability elimination | Input validation, safe patterns |
| Reliability | Robustness, fault tolerance | Error handling, edge cases |
| Readability | Clarity, maintainability | Naming, decomposition, idioms |

## Project Structure

```
code-optimizer/
├── apps/
│   ├── api/          # Fastify REST API
│   ├── web/          # Next.js frontend
│   └── worker/       # BullMQ worker (Claude AI + Docker sandbox)
├── packages/
│   └── shared/       # Shared types, validation schemas, constants
├── sandbox-images/   # Dockerfiles for each language sandbox
├── scripts/          # Migration and build scripts
├── docker-compose.yml
├── Makefile
└── turbo.json
```

## Testing

```bash
# Run all tests
make test

# Run tests for a specific package
npx turbo run test --filter=@code-optimizer/api
```

## Sandbox Security

Each benchmark execution runs in an isolated Docker container with:

- **No network access** (`NetworkMode: none`)
- **256MB memory limit** (OOM kill if exceeded)
- **1 CPU core** limit
- **64 PID limit** (prevents fork bombs)
- **All capabilities dropped**
- **No privilege escalation** (`no-new-privileges`)
- **Non-root user** (uid 1000)
- **30-second timeout** (hard kill)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run `make lint && make typecheck && make test`
5. Commit and push
6. Open a pull request
