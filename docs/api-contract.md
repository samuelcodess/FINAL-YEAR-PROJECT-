# API Contract

## Base URL

`/api`

## Authentication

### `POST /auth/login`

Authenticates a user and returns a JWT-backed session payload.

### `POST /auth/forgot-password`

Placeholder for password reset workflow.

### `GET /auth/me`

Returns the currently authenticated user.

## Dashboards

### `GET /dashboard/admin`

Admin metrics, department breakdown, and system analytics.

### `GET /dashboard/hr`

HR metrics, latest evaluations, and recommendation summary.

### `GET /dashboard/employee`

Employee self-service dashboard with history and recommendations.

## Employees

### `GET /employees`

List employees with department and latest evaluation summary.

### `GET /employees/:employeeId`

Get a single employee profile and evaluation history.

## KPIs

### `GET /kpis`

List KPI configuration records.

## Evaluations

### `GET /evaluations`

List evaluation headers with linked detail and recommendation information.

### `POST /evaluations`

Submit evaluation inputs and receive calculated score, trend, and recommendation summary.

## Recommendations

### `GET /recommendations`

List recommendation records available to the signed-in user role.

## Notifications

### `GET /notifications`

List system alerts and recommendation-triggered notices.

## Reports

### `GET /reports`

Return high-level reporting metadata and export-ready summary information.
