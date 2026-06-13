# SpeakUp - Production Deployment Guide 🚀

This document outlines the deployment instructions and required configuration variables for the **SpeakUp Anonymous Crime Reporting Platform**.

---

## 1. Cloud Database Integration (Supabase PostgreSQL)

SpeakUp is migrated to use a PostgreSQL database. Follow these steps to prepare your cloud database:

1. Create a free account on **Supabase** (or Neon / AWS RDS).
2. Start a new project to provision a PostgreSQL database.
3. Retrieve your **Transaction Connection String** (URI) from the Database Settings panel.
4. Replace the placeholder values with your credentials. Your connection string will look similar to this:
   `postgresql://postgres.xxxxxx:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
5. Ensure the password is URL-encoded if it contains any special characters (e.g., `@` becomes `%40`).
6. The backend automatically initializes the `reports` table schema on server startup if it doesn't exist. No manual seeding or table creation is required.

---

## 2. Environment Variables Configuration

Ensure the following variables are configured in your hosting environment:

### Backend Environment Variables (Render, Heroku, or Railway)
- `PORT`: Set to `5055` (or dynamically configured by host).
- `NODE_ENV`: Set to `production` (enables SSL rejecting unauthorized check for pg).
- `DATABASE_URL`: Your Supabase transaction pooler URI.
- `OPENAI_API_KEY`: *(Optional)* Your OpenAI secret key (e.g., `sk-proj-...`) to enable AI Redaction and Severity Analysis. If left blank, the server automatically falls back to secure regex redaction and keyword-matching analysis.

### Frontend Environment Variables (Vercel or Netlify)
- `VITE_API_URL`: The deployed domain of your backend server (e.g. `https://speakup-backend.onrender.com`). Do not append a trailing slash.

---

## 3. Deploying the Backend (Render)

1. Connect your GitHub repository to **Render**.
2. Select **Web Service** as the deployment target.
3. Configure the following build properties:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add all required environment variables under the **Environment** tab.

---

## 4. Deploying the Frontend (Vercel)

1. Connect your GitHub repository to **Vercel**.
2. Create a new project, selecting the **frontend** folder as the project directory.
3. Configure the following build properties:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add `VITE_API_URL` under the **Environment Variables** tab.
5. Deploy the application!
