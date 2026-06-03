# Deployment Guide

## Recommended hosting layout

- `frontend/` -> Vercel
- `backend/` -> Railway
- `MySQL` -> Railway MySQL

This project uses a Vite React frontend and a separate Express + MySQL backend. The frontend is a good fit for Vercel, while the backend is better hosted on a persistent Node platform because it uses:

- file uploads
- MySQL connections
- background reminder scheduling

## Frontend deployment on Vercel

Set the Vercel project root to `frontend/`.

Recommended build settings:

- Build command: `npm run build`
- Output directory: `dist`

Required environment variable:

- `VITE_API_BASE_URL=https://your-backend-domain/api`

The `frontend/vercel.json` file adds an SPA rewrite so React Router routes resolve correctly.

## Backend deployment on Railway

Set the Railway service root to `backend/`.

Recommended commands:

- Build command: `npm run build`
- Start command: `npm run start`

Required environment variables:

- `PORT`
- `NODE_ENV=production`
- `CLIENT_URL=https://your-frontend-domain`
- `CLIENT_URLS=https://your-frontend-domain`
- `APP_NAME=PerformAI Hub`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=1d`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

## Database setup

Provision a Railway MySQL service, then import:

- `backend/database/schema.sql`
- `backend/database/seed.sql`

## Important production note

The current file upload implementation stores files on the server filesystem. That is acceptable for an academic deployment, but on platforms with ephemeral storage those uploads may not persist across redeployments. For a stronger long-term deployment, move uploads to object storage later.
