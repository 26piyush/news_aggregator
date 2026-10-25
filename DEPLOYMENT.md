# Deployment Guide: AI News Aggregator

This document provides step-by-step instructions to deploy the AI News Aggregator online.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │            Frontend (Web)             │
                      │  React + Vite + Tailwind (Vercel/CDN) │
                      └──────────────────┬────────────────────┘
                                         │  HTTPS / API calls
                                         ▼
                      ┌───────────────────────────────────────┐
                      │           Backend API (Node)          │
                      │       Express + Prisma (Render)       │
                      └───┬───────────────────────────────┬───┘
                          │                               │
        Internal / HTTPS  │                               │  PostgreSQL (Port 6543/5432)
                          ▼                               ▼
    ┌───────────────────────────┐           ┌───────────────────────────┐
    │     NLP Service (Python)  │           │      Database (Supabase)  │
    │  FastAPI + BERT (Render)  │           │  Hosted Cloud PostgreSQL  │
    └───────────────────────────┘           └───────────────────────────┘
```

Your database is **already hosted live on Supabase** (`lhzoqznxeehogxkugpem`). You only need to deploy the application code.

---

## Step 0: Push Code to GitHub

Before deploying to any cloud host, push your codebase to a private or public GitHub repository:

```bash
# Initialize git if not already done
git init
git add .
git commit -m "feat: complete news aggregator with auth and sentiment analysis"

# Create a repo on GitHub (or use GitHub CLI: gh repo create)
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git branch -M main
git push -u origin main
```

---

## Option 1: Vercel (Frontend) + Render (Backend API) ⭐ (Recommended & Free)

This is the easiest and most popular setup with generous free tiers.

### 1. Deploy the Backend API on Render.com

1. Go to [Render.com](https://render.com) and log in with GitHub.
2. Click **New +** > **Web Service**.
3. Select your GitHub repository.
4. Fill in the settings:
   - **Name**: `news-aggregator-api`
   - **Region**: Choose the closest region to your Supabase DB (e.g. Frankfurt or Singapore or Oregon).
   - **Root Directory**: Leave blank (monorepo root).
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && cd apps/api && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```bash
     npm --workspace=apps/api run start
     ```
   - **Instance Type**: `Free`
5. In **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `DATABASE_URL` | Your Supabase pooled URL (`postgresql://postgres.lhzoqznxeehogxkugpem:...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`) |
   | `DIRECT_URL` | Your Supabase direct URL (`postgresql://postgres.lhzoqznxeehogxkugpem:...@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`) |
   | `JWT_SECRET` | Any strong random string (e.g. `news-aggregator-super-secret-key-prod-2026`) |
   | `ENABLE_MOCK_FALLBACK` | `true` |
6. Click **Deploy Web Service**.
7. Once deployed, copy your API URL: `https://news-aggregator-api.onrender.com`.

*(Note: The API automatically uses built-in linguistic fallback if the Python service is not deployed, so your sentiment tone, readability, and bias analysis work immediately out of the box).*

---

### 2. Deploy the Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** > **Project**.
3. Import your repository.
4. In **Project Configuration**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `apps/web`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | Your Render API URL from Step 1 (e.g., `https://news-aggregator-api.onrender.com`) |
6. Click **Deploy**.
7. In ~60 seconds, your site is live with a custom `.vercel.app` URL and free SSL!

---

### 3. (Optional) Deploy the Python NLP Service on Render

If you want deep BERT neural transformer inference rather than the built-in heuristic analyzer:
1. On Render, click **New +** > **Web Service**.
2. Select your repository.
3. Configure:
   - **Name**: `news-aggregator-nlp`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r services/nlp/requirements.txt`
   - **Start Command**: `python -m uvicorn services.nlp.app.main:app --host 0.0.0.0 --port $PORT`
4. Copy the resulting URL (e.g., `https://news-aggregator-nlp.onrender.com`).
5. Go back to your `news-aggregator-api` service on Render, add the environment variable:
   `NLP_SERVICE_URL=https://news-aggregator-nlp.onrender.com`
   and trigger a redeploy.

---

## Option 2: Railway.app (All-in-One Monorepo)

Railway is great because all services live in one dashboard with private networking:

1. Sign in to [Railway.app](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Add 2 (or 3) services from the same repo:
   - **Service 1 (Backend API)**:
     - Root directory: `/`
     - Build Command: `npm install && cd apps/api && npx prisma generate && npm run build`
     - Start Command: `npm --workspace=apps/api run start`
     - Env vars: `DATABASE_URL`, `DIRECT_URL`, `PORT=5000`, `NODE_ENV=production`.
   - **Service 2 (Frontend Web)**:
     - Root directory: `apps/web`
     - Build Command: `npm run build`
     - Env vars: `VITE_API_URL=https://${{news-aggregator-api.RAILWAY_PUBLIC_DOMAIN}}`
   - **Service 3 (Redis Cache - Optional)**:
     - Click **New** > **Database** > **Redis**.
     - Connect the `REDIS_URL` directly into the Backend API service.

---

## Option 3: Single VPS with Docker Compose (DigitalOcean, AWS EC2, Hetzner)

If you prefer self-hosting on a single $4-6/mo Ubuntu server:

1. SSH into your VPS:
   ```bash
   ssh root@your-server-ip
   ```
2. Install Docker & Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   ```
3. Clone your repository:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   cd <YOUR_REPO_NAME>
   ```
4. Create a `.env` file in the root with your Supabase credentials:
   ```bash
   DATABASE_URL="postgresql://postgres.lhzoqznxeehogxkugpem:...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.lhzoqznxeehogxkugpem:...@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
   NODE_ENV="production"
   ```
5. Start all containers:
   ```bash
   docker compose up -d --build
   ```
6. Access your app at `http://your-server-ip:5173` (or set up Nginx reverse proxy + Certbot SSL on port 80/443).

---

## Production Verification Checklist

Once deployed, verify:
- [ ] **Health Endpoint**: Visit `https://<your-api-domain>/health` - should return `200 OK` with database status.
- [ ] **Articles Feed**: Visit your frontend URL - articles should render with categories, images, and **Tone badges**.
- [ ] **Deep AI Analysis**: Click "Inspect AI Analysis" on any article to ensure readability, tone, and subjective bias details load.
- [ ] **Auth / Guest**: Test creating an account or clicking "Continue as Guest".
- [ ] **Refresh Feed**: Test the "Refresh Feed" button in the header.
