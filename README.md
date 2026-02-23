# 📊 Metrics Dashboard

A full-stack **DevOps monitoring dashboard** built with **FastAPI**, **React**, and **Prometheus**. Monitor system resources, Docker containers, and run ad-hoc PromQL queries — all from a sleek, dark-themed UI.

---

## ✨ Features

### System Monitoring
- **CPU, Memory & Disk** — Real-time usage with threshold-based health indicators (Healthy / Warning / Critical)
- **System Uptime** — Human-readable uptime display
- **Load Average** — 1 / 5 / 15 minute load averages
- **Process Count** — Running and blocked processes
- **Temperature** — Hardware temperature monitoring (when available)

### Container Monitoring
- **Container List** — Live view of all running Docker containers with CPU & memory stats
- **Container Detail** — Per-container CPU/memory time-series charts, live logs, and running processes (`docker top`)

### PromQL Explorer
- **Raw PromQL Queries** — Execute any PromQL query and visualize the results as interactive time-series charts, similar to the Prometheus UI

### Network
- **Network RX / TX** — Receive and transmit traffic charts over time

### Auth & Security
- **JWT Authentication** — Signup/Login with hashed passwords (bcrypt)
- **Rate Limiting** — API-level rate limiting via SlowAPI
- **Protected Routes** — All dashboard routes require authentication

---

## 🏗️ Architecture

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│    Frontend     │ ───▶ │    Backend     │ ───▶ │   Prometheus   │
│  React + MUI   │      │    FastAPI     │      │    + Exporters │
│  Port 3001     │      │    Port 8000   │      │    Port 9090   │
└────────────────┘      └───────┬────────┘      └────────────────┘
                                │                        ▲
                        ┌───────▼────────┐      ┌────────┴───────┐
                        │   PostgreSQL   │      │  Node Exporter │
                        │   Port 5433    │      │  + cAdvisor    │
                        └────────────────┘      └────────────────┘
```

| Service | Role |
|---|---|
| **Frontend** | React 19 + MUI 7 + Recharts — dark-themed dashboard UI |
| **Backend** | FastAPI — proxies Prometheus queries, manages auth, connects to Docker |
| **Prometheus** | Scrapes metrics from Node Exporter, cAdvisor, and the backend |
| **Node Exporter** | Exposes host-level system metrics (CPU, memory, disk, network) |
| **cAdvisor** | Exposes per-container resource metrics |
| **PostgreSQL** | Stores user accounts for authentication |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, MUI 7, Recharts, Axios, React Router 7 |
| **Backend** | Python 3.12, FastAPI, Uvicorn, SQLAlchemy, Pydantic |
| **Auth** | JWT (python-jose), bcrypt (passlib), SlowAPI rate limiting |
| **Monitoring** | Prometheus, Node Exporter, cAdvisor |
| **Database** | PostgreSQL 16 |
| **Infra** | Docker, Docker Compose, Nginx |

---

## 🚀 Getting Started

### Prerequisites

- **Docker** & **Docker Compose** installed
- Ports `3001`, `8000`, `9090`, `9100`, `9000`, `5433` available

### 1. Clone the repository

```bash
git clone https://github.com/brahmanyasudulagunta/Metrics-Dashboard.git
cd Metrics-Dashboard
```

### 2. Build the Docker images

```bash
# Build backend
docker build -t backend-metrics:v1 ./backend

# Build frontend
docker build -t frontend-metrics:v1 ./frontend
```

### 3. Start all services

```bash
docker compose -f infra/docker-compose.yml up -d
```

### 4. Access the dashboard

| Service | URL |
|---|---|
| **Dashboard** | [http://localhost:3001](http://localhost:3001) |
| **Backend API** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) |

### 5. Create an account

1. Navigate to [http://localhost:3001/signup](http://localhost:3001/signup)
2. Create a username and password
3. Log in to access the dashboard

---

## 📁 Project Structure

```
Metrics-Dashboard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py          # All API endpoints
│   │   │   ├── auth.py            # JWT token creation & validation
│   │   │   └── security.py        # Password hashing utilities
│   │   ├── services/
│   │   │   ├── prometheus_client.py  # PromQL query wrapper
│   │   │   └── docker_client.py      # Docker SDK for logs & processes
│   │   ├── db/
│   │   │   ├── database.py        # SQLAlchemy engine & session
│   │   │   ├── models.py          # User model
│   │   │   └── init_db.py         # Database initialization
│   │   └── main.py                # FastAPI app entry point
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env                       # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Overview.tsx       # System overview with metric cards & charts
│   │   │   ├── Containers.tsx     # Container list with stats
│   │   │   ├── ContainerDetail.tsx # Per-container detail view
│   │   │   ├── Explorer.tsx       # Raw PromQL query explorer
│   │   │   ├── Network.tsx        # Network traffic charts
│   │   │   └── Settings.tsx       # App settings
│   │   ├── components/
│   │   │   ├── MetricCharts.tsx   # Reusable Recharts chart component
│   │   │   ├── Login.tsx          # Login form
│   │   │   ├── Signup.tsx         # Signup form
│   │   │   └── layout/            # Sidebar & layout shell
│   │   ├── App.tsx                # Routes & auth guard
│   │   ├── theme.ts               # MUI dark theme configuration
│   │   └── config.ts              # API URL config
│   ├── Dockerfile                 # Multi-stage build (Node → Nginx)
│   └── nginx.conf                 # Nginx config for SPA routing
└── infra/
    ├── docker-compose.yml         # All 6 services
    ├── prometheus/
    │   ├── prometheus.yml         # Scrape configs
    │   └── rules.yml              # Alert rules
    └── data/                      # Persistent data volume
```

---

## � API Endpoints

All endpoints are prefixed with `/api` and require JWT auth (except signup/login).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/signup` | Create a new user account |
| `POST` | `/api/login` | Login and receive a JWT token |
| `GET` | `/api/metrics/cpu` | CPU usage over time |
| `GET` | `/api/metrics/memory` | Memory usage over time |
| `GET` | `/api/metrics/disk` | Disk usage over time |
| `GET` | `/api/metrics/network/rx` | Network receive traffic |
| `GET` | `/api/metrics/network/tx` | Network transmit traffic |
| `GET` | `/api/metrics/uptime` | System uptime |
| `GET` | `/api/metrics/load` | Load averages (1/5/15 min) |
| `GET` | `/api/metrics/processes` | Running/blocked process counts |
| `GET` | `/api/metrics/temperature` | Hardware temperature |
| `GET` | `/api/metrics/containers` | List of containers with stats |
| `GET` | `/api/metrics/containers/cpu` | Container CPU usage over time |
| `GET` | `/api/metrics/containers/memory` | Container memory usage over time |
| `GET` | `/api/metrics/containers/logs` | Live container logs |
| `GET` | `/api/metrics/containers/processes` | Container process list |
| `GET` | `/api/metrics/query` | Raw PromQL query execution |

> All time-series endpoints accept optional `start`, `end` (unix timestamps), and `step` query parameters.

---

## ⚙️ Environment Variables

Configure the backend via `backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `devsecret` | Secret key for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token validity (24 hours) |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |
| `PROMETHEUS_URL` | `http://prometheus:9090` | Prometheus server URL |
| `SQLALCHEMY_DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |

---

## 🛑 Stopping the Stack

```bash
docker compose -f infra/docker-compose.yml down
```

To also remove persisted PostgreSQL data:

```bash
docker compose -f infra/docker-compose.yml down -v
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
