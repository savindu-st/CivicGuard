# Civic Guard — Disaster Response Intelligence & Coordination Platform

> **CodeArena '26 Ideathon · Topic 04: Disaster Response**  
> An end-to-end civic emergency coordination platform that verifies citizen disaster reports using multi-signal hybrid intelligence, alerts affected citizens with safe routes, dispatches field crews, matches relief shelters, and synchronizes real-time public hazard maps.

---

## 🏗️ Repository & Architecture Overview

This platform is architected as a lightweight, modular microservice ecosystem orchestrated via Docker Compose and fronted by the Kong API Gateway:

```text
disaster-platform/
│
├── web/                                  # Operations Web App (React + Vite + TypeScript + Leaflet)
│   ├── src/pages/officer/                # Council Officer Triage & Ward Control Center
│   ├── src/pages/crew/                   # Field Crew Mobile Portal (Photo-verified completion)
│   ├── src/pages/relief/                 # Relief Desk (SOS Help Requests ↔ Shelters/Supplies)
│   └── src/pages/public/                 # Live Public Hazard Map & Road Closures
│
├── backend/                              # Microservices Layer (Node.js & Python)
│   ├── services/
│   │   ├── incident-service/             # Case Builder, 5-Signal Hybrid Verification & Aggregator
│   │   ├── ticket-service/               # Council Tickets, Crew Assignments & Job Lifecycle
│   │   ├── notification-service/         # Socket.IO Real-Time Dispatch & Area Alerts
│   │   ├── relief-service/               # SOS Requests, Shelter Bed Capacity & Resource Allocation
│   │   └── ai-service/                   # Python FastAPI + YOLO (Image Vision, Location & Risk AI)
│   └── shared/                           # Shared TypeScript Types, Constants & Utility Helpers
│
├── kong/                                 # Kong API Gateway declarative routing configuration
├── database/                             # Supabase PostgreSQL DDL migrations & Sri Lanka demo seed data
└── docker-compose.yml                    # Multi-container orchestration
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Python (3.10+)

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

### 3. Spin Up Services with Docker
```bash
docker compose up --build
```

---

## 🚦 Port Reference

| Service | Port | Description |
| :--- | :--- | :--- |
| **Kong API Gateway** | `8000` | External API Entrypoint |
| **Operations Web** | `3000` | React Dashboard (Officer, Crew, Relief) |
| **Incident Service** | `4001` | Incident Case Builder & Verification |
| **Ticket Service** | `4002` | Council Ticket & Crew Dispatch |
| **Notification Service** | `4003` | Socket.IO Real-time Hub |
| **Relief Service** | `4004` | SOS Requests & Shelter Management |
| **AI Service** | `5000` | FastAPI YOLO Image & Risk Classifier |
