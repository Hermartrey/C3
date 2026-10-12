# Deploying C3 (FuelFlow) to Render

This repository is fully configured for deployment on [Render](https://render.com). It contains:
1. **Django Backend (Web Service)** running Python & Gunicorn
2. **PostgreSQL Database** (Render Managed PostgreSQL)
3. **React / Vite Frontend (Static Site)** with Single Page Application (SPA) routing

---

## Prerequisites
- A [Render](https://render.com) account (Free tier available).
- Your repository pushed to GitHub or GitLab.

---

## Method 1: Instant Blueprint Deployment (Recommended)

Render Blueprints automatically spin up all services defined in `render.yaml`:

1. Commit and push all files to your GitHub repository:
   ```bash
   git add .
   git commit -m "Prepare project for Render deployment"
   git push origin main
   ```
2. Go to the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository (`C3`).
5. Render will automatically detect [`render.yaml`](./render.yaml) and display:
   - **`fuelflow-db`** (PostgreSQL Database)
   - **`fuelflow-backend`** (Python Web Service)
   - **`fuelflow-frontend`** (Static Site)
6. Click **Apply**.
7. Once deployed, find your backend URL (e.g., `https://fuelflow-backend-xxxx.onrender.com`).
8. If your backend service name was assigned a random suffix, update the frontend's `VITE_API_URL` environment variable under **fuelflow-frontend > Environment**:
   - `VITE_API_URL`: `https://<YOUR-ACTUAL-BACKEND-URL>.onrender.com/api`
   - Trigger a manual deploy on the frontend to apply the new URL.

---

## Method 2: Manual Deployment via Render Dashboard

If you prefer setting up services individually in the Render UI:

### Step 1: Create PostgreSQL Database
1. In Render Dashboard, click **New +** > **PostgreSQL**.
2. **Name**: `fuelflow-db`
3. **Database**: `fuelflow`
4. **User**: `fuelflow_user`
5. **Region**: Choose closest to you (e.g. Oregon, Frankfurt, Singapore).
6. **Plan**: Free.
7. Click **Create Database**.
8. Copy the **Internal Database URL** once it is created.

---

### Step 2: Deploy Django Backend (Web Service)
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `fuelflow-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Branch**: `main`
   - **Build Command**: `bash ./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application`
   - **Plan**: Free
4. Add **Environment Variables** in the service settings:
   | Key | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | *(Paste Internal Database URL from Step 1)* | Render Postgres connection string |
   | `SECRET_KEY` | *(Generate a secure random string)* | Django secret key |
   | `DEBUG` | `False` | Production mode |
   | `PYTHON_VERSION` | `3.11.9` | Stable runtime |
   | `SEED_DB` | `true` | Runs `seed_data.py` on first build to create default users and data |
5. Click **Create Web Service**.
6. Wait for the build to finish. Once live, copy your backend URL (e.g. `https://fuelflow-backend.onrender.com`).

---

### Step 3: Deploy Vite / React Frontend (Static Site)
1. Click **New +** > **Static Site**.
2. Connect your GitHub repository.
3. Configure the static site:
   - **Name**: `fuelflow-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-backend-url>.onrender.com/api` |
5. Configure **Redirects / Rewrites** (under Settings > Redirects/Rewrites):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   *(This ensures React Router works when refreshing pages or navigating directly to `/login`, `/dashboard`, etc.)*
6. Click **Create Static Site**.

---

## Default Login Credentials (from `seed_data.py`)

When `SEED_DB=true` is executed:
- **Admin**:
  - Username: `admin`
  - Password: `admin123`
- **Branch Manager**:
  - Username: `manager`
  - Password: `manager123`

---

## Troubleshooting
- **CORS Errors**: The backend has `CORS_ALLOW_ALL_ORIGINS = True` configured in `settings.py`.
- **404 on Refresh in React**: Make sure the rewrite rule `/* -> /index.html` is added to the Frontend Static Site.
- **Render Free Tier Spin-Down**: Free tier web services go to sleep after 15 minutes of inactivity. The first request may take 30-50 seconds to wake up.
