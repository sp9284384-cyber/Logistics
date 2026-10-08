# Logistics

Ganraj Logistics Service & Fleet Tracker Platform.

## Overview
- **Frontend**: Ganraj Logistics Service website & booking dashboard (Next.js, TypeScript, Tailwind CSS, shadcn/ui).
- **Backend (`fleettracker-backend`)**: Java 21, Spring Boot 3, Spring Data JPA, MySQL 8, Flyway, and JWT authentication.

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd fleettracker-backend
cp .env.example .env
# Configure MySQL and run
./mvnw spring-boot:run
```
