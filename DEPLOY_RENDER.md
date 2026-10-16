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
   - **Start Command**: `bash ./start.sh`
   - **Plan**: Free
4. Add **Environment Variables** in the service settings:
   | Key | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | *(Paste Internal Database URL from Step 1)* | Render Postgres connection string |
   | `SECRET_KEY` | *(Generate a secure random string)* | Django secret key |
   | `DEBUG` | `False` | Production mode |
   | `PYTHON_VERSION` | `3.12.11` | Python 3.12 runtime required for Django 6.0 |
   | `SEED_DB` | `true` | Runs `seed_data.py` on first launch to create default users and data |
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

---

## Default Login Credentials (from `seed_data.py`)

When initial database seeding runs:
- **System Administrator Portal** (access at `/admin`):
  - **Username**: `admin`
  - **Password**: `admin123`
- **Branch Manager Portal** (access at `/login`):
  - **Username**: `manager`
  - **Password**: `manager123`

> [!NOTE]
> The Administrator and Branch Manager accounts have separate portals. If you attempt to log in with `admin` on `/login`, the system will redirect you to the Admin Portal (`/admin`).

---

## Why Users Can't Log In On Deployed Render (Troubleshooting & Fix)

If users encounter "Cannot connect to server" or "Invalid username or password" on the deployed website:

### 1. Verify Your Actual Backend Web Service URL
Render URLs are globally unique. If another user already claimed `fuelflow-backend`, Render will name your service something like:
`https://fuelflow-backend-xxxx.onrender.com`

1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Open your backend web service (e.g., `fuelflow-backend`).
3. Copy the URL under the service title (e.g., `https://fuelflow-backend-xxxx.onrender.com`).
4. Append `/api` to it: `https://fuelflow-backend-xxxx.onrender.com/api`

### 2. Update `VITE_API_URL` on the Frontend Static Site
1. In the Render Dashboard, click on your frontend static site (`fuelflow-frontend`).
2. Navigate to **Environment**.
3. Set or update the key `VITE_API_URL` to your full backend API URL:
   `https://<YOUR-ACTUAL-BACKEND-SLUG>.onrender.com/api`
4. Click **Save Changes**, then go to **Deploys** and click **Trigger Deploy** > **Deploy latest commit** (or **Clear build cache & deploy**).
   *Because Vite is a Single Page Application, environment variables are baked into the static build at compile time.*

### 3. Quick Fix Without Redeploying (In-App Server Settings)
If you need to test or use the site immediately without waiting for a new deploy:
1. Open the deployed website in your browser.
2. At the bottom of the Login or Admin page, click **Server Settings**.
3. Paste your actual Render backend URL (e.g. `https://fuelflow-backend-xxxx.onrender.com/api`).
4. Click **Test Connection**. Once verified, click **Save & Apply**.
5. You can now log in immediately.

### 4. Render Free Tier Spin-Down (Cold Starts)
Render free web services enter sleep mode after 15 minutes of inactivity. When a request is made after sleep:
- The first request can take **45 to 60 seconds** to wake up the backend.
- During this period, the login screen will show: *"Waking up server (Render free tier can take ~50s)..."*. Please allow it to finish waking up.

