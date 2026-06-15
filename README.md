# AI-Enhanced Employee Performance Evaluation and Recommendation System

This repository contains a production-style academic final year project for an intelligent HR decision-support platform. The system helps organizations evaluate employee performance against weighted KPIs using AI-assisted evidence analysis, generate explainable recommendations from those outcomes, track performance trends over time, and present actionable insights through role-based dashboards.

## Core objectives

- Manage employee, department, and KPI records
- Evaluate staff using AI-generated KPI scoring from submitted evidence
- Classify performance levels automatically
- Generate explainable recommendations from evaluation outcomes
- Detect improving, stable, and declining trends
- Provide dashboards, analytics, notifications, and reports

## Required stack

- Frontend: `React`, `TypeScript`, `React Router`, `Tailwind CSS`, `Axios`, `Recharts`
- Backend: `Node.js`, `Express`, `TypeScript`
- Database: `MySQL`
- Authentication: `JWT`, `bcrypt`

## Repository structure

- `frontend/` React client application
- `backend/` Express API and business logic
- `docs/` system architecture, AI logic, and setup notes

## Project modules

1. Authentication
2. Dashboard
3. Employee management
4. Department management
5. KPI management
6. Performance evaluation
7. Recommendation engine
8. Trend analysis
9. Reports and analytics
10. Notifications and audit trail
11. Settings

## User roles

- `admin`
- `hr_manager`
- `employee`

## Key documentation

- [System Architecture](docs/system-architecture.md)
- [Database Schema](docs/database-schema.sql)
- [AI Logic Explanation](docs/ai-logic.md)
- [Implementation Roadmap](docs/implementation-roadmap.md)
- [Deployment Guide](docs/deployment-guide.md)

## Backend overview

The backend is organized into:

- `src/config` for environment and database configuration
- `src/controllers` for route handlers
- `src/routes` for API modules
- `src/services` for business logic
- `src/repositories` for database-facing logic
- `src/middleware` for auth, error handling, and validation
- `src/utils` for helpers
- `src/database` for SQL schema and seed scripts

## Frontend overview

The frontend is organized into:

- `src/layouts` for authenticated and public layouts
- `src/pages` for route-level screens
- `src/components` for reusable UI building blocks
- `src/features` for module-specific UI and hooks
- `src/lib` for API client utilities
- `src/data` for local fallback/demo content

## Planned deliverables

- Full frontend code
- Full backend code
- MySQL schema and seed data
- REST API implementation
- Authentication and authorization
- Reports and dashboard analytics
- AI-assisted evaluation and recommendation engine
- README and installation instructions

## Development flow

1. Finalize architecture and schema
2. Build backend foundation
3. Build frontend foundation
4. Implement authentication
5. Implement employee, KPI, and evaluation workflows
6. Add AI-based evaluation and recommendation logic
7. Add reporting, analytics, notifications, and polish

## Status

This repository is currently being rebuilt from an earlier prototype to match the approved final stack and module requirements above.

## Deployment recommendation

Use a split deployment:

- `frontend/` on `Vercel`
- `backend/` on `Railway`
- `MySQL` on `Railway`

This is the recommended layout for the current architecture because the frontend is a Vite SPA, while the backend relies on persistent Node server behavior, MySQL, file uploads, and scheduled reminder logic.
