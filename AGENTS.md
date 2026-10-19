# MediTrack Agent Instructions

## Project purpose

MediTrack is an early-stage health-center web project. Keep changes aligned with the existing Laravel API and React web client. Confirm product requirements from the user or project documentation before inventing clinical workflows, data fields, or permissions.

## Current architecture

- Backend: Laravel 13, PHP 8.3+; API routes are in `backend/routes/api.php`.
- Web frontend: React 19, Vite, Tailwind CSS 4, JavaScript (not TypeScript yet).
- Database in the Docker Compose development setup: MariaDB 11, compatible with MySQL. The root `.env.example` still defaults to SQLite; follow the active Compose configuration or the user's explicit environment instructions and call out any mismatch.
- Authentication: Laravel Sanctum is installed. Existing API includes register, login, logout, `/me`, and protected `/user` routes.
- Containers: root `docker-compose.yml` defines backend, frontend, and MariaDB services.
- React Native/mobile, real-time broadcasting, and a production deployment setup are not present in the current repository. Treat them as future plans unless asked to implement them.

## Working rules

- Read the relevant code and documentation before changing behavior. Preserve existing work and conventions.
- Keep API validation, authorization, and business rules on the Laravel side. Never rely on frontend-only access checks for protected data.
- Do not place secrets in source files or documentation. Use environment variables and keep `.env` files private.
- Keep frontend components and styling consistent with the existing project; avoid adding libraries without a concrete need.
- Keep docs factual: label implemented behavior separately from ideas and planned work.
- Do not run tests, builds, or browser checks unless the user asks. The project owner handles testing; report static inspection separately from runtime verification.
- Do not modify deployment infrastructure or perform external actions without an explicit request.

## Project locations

- Backend: `backend/`
- Web frontend: `frontend/`
- Compose setup: `docker-compose.yml`
- Project notes and planning: `docs/`
- Laravel-specific instructions may also exist in `backend/AGENTS.md`; read them before changing backend application code.
