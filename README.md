# AI-Powered News Aggregator

[![Node.js](https://img.shields.io/badge/Node.js-24%20LTS-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10-blue.svg)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-oriented full-stack web platform that aggregates real-time news across legitimate international publishers, organizes articles by category, and utilizes NLP to analyze article readability, sentiment tone, linguistic intensity, and potential bias indicators with explicit uncertainty and transparent provenance.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph NewsProviders["News Providers & External Feeds"]
        RSS["Legitimate RSS Feeds\n(BBC, NPR, Reuters, TechCrunch, CNBC)"]
        NewsAPI["NewsAPI v2 REST Adapter"]
        GNews["GNews v4 REST Adapter"]
        Mock["Deterministic Mock Adapter\n(Zero-Credential Resilience)"]
    end

    subgraph BackendAPI["apps/api - Express + TypeScript (Port 5000)"]
        PM["Provider Manager &\nDeduplication Engine"]
        Ingest["Scheduled News Ingestion Job"]
        Cache["CacheService\n(Redis with Memory Fallback)"]
        Repo["Article & User Repositories"]
        ExpressRoutes["REST API Controllers\n(/api/news, /api/bookmarks, etc.)"]
    end

    subgraph NLPService["services/nlp - FastAPI + Transformers (Port 8000)"]
        FastAPIApp["FastAPI Engine"]
        HF["Hugging Face Pipeline\n(distilbert-base-uncased-finetuned-sst-2)"]
        ReadabilityCalc["Readability Engine\n(Flesch Reading Ease & FK Grade)"]
        BiasDetector["Linguistic Cue & Subjectivity Detector"]
    end

    subgraph DataStorage["Persistence & Cache"]
        Postgres["PostgreSQL / Supabase\n(Managed via Prisma ORM)"]
        RedisStore["Redis 7\n(Feed & NLP Hash Caching)"]
    end

    subgraph Frontend["apps/web - React 18 + Vite (Port 5173)"]
        TanStack["TanStack React Query"]
        UI["Tailwind CSS UI Components\n(Feed, Analysis Modal, Bookmarks)"]
    end

    NewsProviders --> PM
    PM --> Ingest
    Ingest --> Repo
    Ingest --> Cache
    Ingest --> FastAPIApp

    FastAPIApp --> HF
    FastAPIApp --> ReadabilityCalc
    FastAPIApp --> BiasDetector

    Repo --> Postgres
    Cache --> RedisStore

    ExpressRoutes --> Repo
    ExpressRoutes --> Cache

    TanStack --> ExpressRoutes
    TanStack --> UI
```

---

## Core Features

- **Multi-Provider News Aggregation**: Ingests live news from RSS feeds (BBC, CNBC, Wired, TechCrunch, NPR, Phys.org, ScienceDaily, ESPN), NewsAPI, GNews, or offline mock feeds without required API keys.
- **Deterministic Deduplication**: Normalizes canonical URLs (strips tracking query strings, lowercases domains, normalizes paths) and performs title token Jaccard similarity analysis.
- **AI Readability Analysis**: Calculates Flesch Reading Ease (0-100 ease scale), Flesch-Kincaid Grade Level, and Automated Readability Index (ARI) with explicit grade-level classifications.
- **Transparent Linguistic & Bias Analysis**: Detects emotionally loaded vocabulary, sensationalism, absolute claims, and framing markers with exact textual context and clear scientific disclaimers.
- **Sentiment & Subjectivity Classification**: Classifies tone (positive, neutral, negative) and subjectivity (factual reporting vs. evaluative opinion) using pretrained transformer models.
- **Comprehensive Quality Score**: Transparent 0-100 rating based on defined criteria: prose accessibility (30%), content completeness (35%), linguistic neutrality (25%), and baseline structure (10%).
- **Bookmarks & Preferences**: Save reading lists and customize topic preferences with guest session fallback or Supabase Auth.
- **Resilient Caching**: Redis caching for news feeds, search queries, and content-hash-keyed NLP results with an automatic, zero-crash in-memory fallback.
- **Responsive Web UI**: Built with React 18, Vite, Tailwind CSS, Lucide icons, loading skeletons, and interactive modal dialogs.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query v5, Lucide React, Axios |
| **Backend** | Node.js (v24 LTS), Express.js, TypeScript, Zod, Helmet, Morgan, Axios, RSS-Parser |
| **NLP Service** | Python 3.10, FastAPI, Uvicorn, Pydantic v2, PyTorch / Hugging Face Transformers |
| **ORM & Database**| Prisma ORM, PostgreSQL (Compatible with local Postgres and Supabase) |
| **Caching** | Redis (ioredis) with automatic fallback to synchronized in-memory LRU cache |
| **Testing** | Vitest, React Testing Library, JSDOM, Supertest, Python unittest |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## Monorepo Directory Structure

```text
news-aggregator/
├── apps/
│   ├── web/                    # React Vite TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/     # Navbar, ArticleCard, DetailModal, FilterBar, etc.
│   │   │   ├── services/       # Typed API client
│   │   │   ├── types/          # TypeScript contracts
│   │   │   └── App.tsx         # Main application orchestrator
│   │   ├── Dockerfile
│   │   └── package.json
│   └── api/                    # Express REST backend
│       ├── src/
│       │   ├── config/         # Environment variables and structured logger
│       │   ├── controllers/    # News, Bookmarks, Preferences, Health
│       │   ├── middleware/     # Auth, error handling, rate limiting
│       │   ├── providers/      # RSS, NewsAPI, GNews, Mock adapters & Manager
│       │   ├── repositories/   # Prisma PostgreSQL & memory fallback store
│       │   ├── services/       # CacheService, IngestionService, NLPClientService
│       │   ├── schemas/        # Zod validation schemas
│       │   ├── jobs/           # Scheduled background news ingestion job
│       │   ├── server.ts       # Express bootstrap & lifecycle
│       │   └── __tests__/      # Automated backend API tests
│       ├── prisma/
│       │   ├── schema.prisma   # PostgreSQL database schema
│       │   └── seed.ts         # Database seed script
│       ├── Dockerfile
│       └── package.json
├── services/
│   └── nlp/                    # Python NLP microservice
│       ├── app/
│       │   ├── analyzer.py     # Readability formulas, linguistic cues, sentiment
│       │   ├── model_loader.py # Hugging Face transformer pipeline loader
│       │   ├── schemas.py      # Pydantic request/response schemas
│       │   └── main.py         # FastAPI application entrypoint
│       ├── tests/              # NLP automated test suite
│       ├── Dockerfile
│       └── requirements.txt
├── .env.example                # Documented configuration template
├── docker-compose.yml          # Container configuration for full stack
├── package.json                # Root monorepo workspace configuration
└── README.md
```

---

## Data Model & Prisma Schema

The application uses Prisma ORM with PostgreSQL. The schema is located in `apps/api/prisma/schema.prisma`:

- **`NewsSource`**: id, name, domain, provider (`rss` | `newsapi` | `gnews` | `mock`), homepageUrl, createdAt.
- **`Article`**: id, providerArticleId, title, description, content, canonicalUrl (unique), imageUrl, author, sourceId, category, publishedAt, fetchedAt.
- **`ArticleAnalysis`**: id, articleId (unique), modelName, modelVersion, readabilityScore, readabilityLabel, linguisticSignals (JSON), sentimentLabel, sentimentConfidence, subjectivityScore, potentialBiasScore, potentialBiasLevel, qualityScore, explanation, analyzedAt.
- **`User`**: id (Supabase UUID or guest ID), email, name, createdAt, updatedAt.
- **`Bookmark`**: id, userId, articleId, createdAt (`@@unique([userId, articleId])`).
- **`UserPreference`**: id, userId (unique), preferredCategories (JSON array), preferredSources (JSON array).

---

## NLP Models & Methodology

### 1. Readability Analysis
- **Formula 1**: Flesch Reading Ease (FRE)
  $$\text{FRE} = 206.835 - 1.015 \left(\frac{\text{words}}{\text{sentences}}\right) - 84.6 \left(\frac{\text{syllables}}{\text{words}}\right)$$
  Normalized to 0–100. Higher scores represent easier, more accessible prose.
- **Formula 2**: Flesch-Kincaid Grade Level (FKGL)
  $$\text{FKGL} = 0.39 \left(\frac{\text{words}}{\text{sentences}}\right) + 11.8 \left(\frac{\text{syllables}}{\text{words}}\right) - 15.59$$
- **Formula 3**: Automated Readability Index (ARI) for character-level cross-validation.

### 2. Sentiment Classification
- **Model**: `distilbert/distilbert-base-uncased-finetuned-sst-2-english` (Hugging Face Transformers).
- **Task**: Classifies emotional tone of headlines and summaries into Positive, Neutral, or Negative with calibrated confidence scores.
- **Fallback**: Lexicon-based analyzer when operating in resource-constrained environments.

### 3. Linguistic Signal & Potential Bias Analysis
- **Detected Cues**:
  - *Loaded Language*: Emotionally charged adjectives/verbs (e.g., "unmitigated disaster", "catastrophic", "shocking").
  - *Absolute Claims*: Sweeping, categorical assertions that dismiss uncertainty (e.g., "undeniably", "everyone knows that").
  - *Sensationalism*: Conflict-amplifying words (e.g., "bombshell", "jaw-dropping", "obliterates").
  - *Subjective Framing*: Presupposition markers (e.g., "obviously", "needless to say").
- **Scientific Limitation Notice**:
  > [!IMPORTANT]
  > Linguistic signals evaluate writing style, subjective descriptors, and emotional intensity. **They DO NOT measure factual accuracy, objective truthfulness, or publisher reliability.**

---

## REST API Documentation

### Operations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Reports health and connectivity for database, cache, and NLP service |
| `GET` | `/ready` | Service readiness probe |

### News Feeds & Search
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/news` | `page`, `limit`, `category`, `sourceId`, `search`, `minReadability`, `sentiment`, `sortBy`, `order` | Paginated, filterable news feed |
| `GET` | `/api/news/latest` | `limit` (default: 10) | Returns most recently published articles |
| `GET` | `/api/news/search` | `q`, `category`, `page`, `limit` | Full-text keyword search across headlines & descriptions |
| `GET` | `/api/categories` | None | Returns list of supported news categories |
| `GET` | `/api/sources` | None | Returns list of discovered news publishers |
| `GET` | `/api/news/:id` | None | Returns individual article by ID |
| `GET` | `/api/news/:id/analysis` | None | Returns cached or on-demand AI analysis for article |
| `POST` | `/api/news/:id/analyze` | None | Re-runs on-demand NLP analysis |
| `POST` | `/api/news/ingest` | `category` (optional) | Triggers on-demand ingestion pass |

### Authentication & User Sessions
| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ "email": "...", "password": "...", "name": "..." }` | Creates a new user account with hashed password & JWT session |
| `POST` | `/api/auth/login` | `{ "email": "...", "password": "..." }` | Authenticates user credentials and issues signed JWT |
| `POST` | `/api/auth/guest` | `{ "guestId": "..." }` (optional) | Initializes zero-barrier guest session with localized bookmarks |
| `GET` | `/api/auth/me` | None (`Bearer <token>`) | Returns profile and role data of current user session |

### Bookmarks
| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/bookmarks` | None | Returns user's saved reading list |
| `POST` | `/api/bookmarks` | `{ "articleId": "..." }` | Saves article to bookmarks |
| `DELETE`| `/api/bookmarks/:id` | None | Removes article from bookmarks |

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or v24 LTS
- **Python**: 3.10 or higher
- **PostgreSQL & Redis** (Optional: the platform automatically engages its zero-crash in-memory store and memory cache when external servers are absent).

### 1. Installation

Clone the repository and install dependencies:

```bash
# Install root and workspace npm dependencies
npm install

# Install Python NLP service dependencies
pip install fastapi uvicorn pydantic httpx pytest
```

### 2. Environment Configuration

Copy the example configuration file:

```bash
cp .env.example .env
```

Key configuration options:
- `ENABLE_REDIS`: Set to `false` for zero-setup local development (defaults to in-memory caching).
- `NEWS_API_KEY`: (Optional) NewsAPI key. The app includes real RSS feeds from BBC, CNBC, Wired, TechCrunch, and NPR that work without an API key.
- `GNEWS_API_KEY`: (Optional) GNews API key.
- `DATABASE_URL`: Connection URL for PostgreSQL or Supabase.

### 3. Database Setup (When PostgreSQL / Supabase is configured)

```bash
# Generate Prisma Client
npm --workspace=@news-aggregator/api run prisma:generate

# Push schema to database
npm --workspace=@news-aggregator/api run prisma:push

# Seed default sources and sample analyzed articles
npm --workspace=@news-aggregator/api run prisma:seed
```

### 4. Running the Services Locally

You can run all three services (API, Frontend, and Python NLP) simultaneously in a single terminal or with a single click:

```bash
# Option A: Single command in one terminal (API + Web + NLP)
npm run dev

# Option B: On Windows, double-click start.bat in the root folder
```

Alternatively, you can run each service individually in separate terminals:

```bash
# Terminal 1: Start Python NLP Service (Port 8000)
npm run dev:nlp

# Terminal 2: Start Express Backend API (Port 5000)
npm run dev:api

# Terminal 3: Start React Vite Frontend (Port 5173)
npm run dev:web
```

Open your browser at **`http://localhost:5173`**.

---

## Running with Docker Compose

To start all 5 services (PostgreSQL, Redis, Python NLP, Express API, and React Web) in Docker containers:

```bash
docker compose up --build
```

- Web UI: `http://localhost:5173`
- API Backend: `http://localhost:5000`
- Python NLP: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## Running Automated Tests

The monorepo contains comprehensive automated tests for all components:

```bash
# 1. Run Backend API tests (16 tests)
npm --workspace=@news-aggregator/api run test

# 2. Run Frontend Web tests (6 tests)
npm --workspace=@news-aggregator/web run test

# 3. Run Python NLP tests (8 tests)
python -m unittest services/nlp/tests/test_nlp.py
```

### Actual Test Results
- **NLP Tests**: `Ran 8 tests in 0.007s — OK`
- **Backend API Tests**: `16 passed (16) — 4.24s duration`
- **Frontend Web Tests**: `6 passed (6) — 94ms duration`
- **Total**: `30 tests passing, 0 failures`

---

## Supabase Integration Guide

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings > Database** and copy the **Connection string (URI)**.
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
   SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
   ```
4. Run `npm --workspace=@news-aggregator/api run prisma:push` to sync tables.

---

## Known Limitations & Responsible AI Notice

1. **Linguistic Scope vs. Factual Veracity**: The model evaluates lexical patterns (emotional vocabulary, absolute declarations, reading complexity). It cannot autonomously verify external real-world facts or assess whether a statement is objectively accurate.
2. **External API Quotas**: NewsAPI free-tier plans limit requests to 100 queries/day. The system automatically handles this limit using the RSS adapter and in-memory/Redis feed caching.
3. **Attribution**: All articles display original publisher source metadata, author attribution, and direct external links to publisher websites in accordance with legitimate syndication standards.
