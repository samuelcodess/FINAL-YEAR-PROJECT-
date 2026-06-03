# System Architecture

## Overview

The application is a three-layer web platform for intelligent employee performance management:

1. `Presentation layer`
   React frontend for admins, HR managers, and employees.
2. `Application layer`
   Express API for authentication, business rules, dashboards, evaluations, and reporting.
3. `Data layer`
   MySQL relational database for users, employees, departments, KPIs, evaluations, recommendations, notifications, and activity logs.

## Architectural style

The system follows a modular monolith architecture. This is academically strong and practical because:

- it is easier to explain and defend than microservices
- it keeps the codebase maintainable
- it supports future separation into services if needed
- it allows rule-based AI logic to live close to the evaluation domain

## High-level flow

1. A user signs in with email and password.
2. The backend verifies credentials and issues a JWT.
3. The frontend stores the session token and loads the user dashboard.
4. HR managers create KPI-based evaluations for employees.
5. The backend calculates weighted totals and performance level.
6. The recommendation engine analyzes score bands and historical trends.
7. The system stores recommendations, notifications, and activity logs.
8. Dashboards and reports visualize results over time.

## Frontend architecture

### Public area

- Login page
- Register page
- Forgot password page

### Protected application area

- Admin dashboard
- HR dashboard
- Employee dashboard
- Employees
- KPIs
- Evaluations
- Recommendations
- Reports
- Notifications
- Settings

### Frontend design principles

- dashboard-first layout
- top navigation with user actions
- sidebar navigation for modules
- clean responsive cards and tables
- consistent form design
- chart-driven analytics

## Backend architecture

### API layers

- `routes`
  Maps HTTP endpoints to controllers
- `controllers`
  Handles request parsing and response formatting
- `services`
  Contains business rules and orchestration
- `repositories`
  Encapsulates database access
- `middleware`
  Handles auth, RBAC, validation, and error processing
- `utils`
  Shared helper functions

### Major backend modules

- Authentication
- Users and role management
- Departments
- Employees
- KPI management
- Evaluations
- Recommendations
- Dashboard analytics
- Reports
- Notifications
- Activity logs
- Settings

## Database architecture

The database is relational because:

- employee evaluations depend on strong entity relationships
- KPI scores must be tied to evaluation headers and details
- departments, users, and employees have clear one-to-many relationships
- historical performance analysis works well with structured query patterns

## Security architecture

- bcrypt password hashing
- JWT-based stateless authentication
- role-based authorization middleware
- request validation at API boundaries
- environment-based secrets
- prepared SQL statements through database driver usage
- centralized error handling

## Rule-based AI architecture

The recommendation engine is intentionally not machine-learning heavy. It is implemented as an explainable domain service that:

- computes weighted KPI totals
- assigns performance classifications
- checks recent evaluation history
- identifies consecutive decline or improvement
- generates human-readable recommendations
- creates notifications when warning conditions are met

This keeps the project realistic, functional, and easy to defend academically.

## Deployment view

### Frontend

- React SPA served in development by Vite
- production build can be hosted on Netlify, Vercel static hosting, or Nginx

### Backend

- Express server hosted on Node.js runtime
- environment variables for secrets and database connection

### Database

- MySQL server with schema and seed scripts

## Defense-ready justification

This architecture is suitable for a final year project because it demonstrates:

- software engineering structure
- database design
- secure authentication
- practical decision-support logic
- analytics and reporting
- maintainable separation of concerns
