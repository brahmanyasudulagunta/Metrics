# 📊 Metrics

A **Kubernetes-native monitoring dashboard** that gives you real-time visibility into system resources, Docker containers, and Kubernetes clusters — all from a clean dark-themed UI powered by Prometheus.

![License](https://img.shields.io/badge/license-MIT-blue)
![Helm](https://img.shields.io/badge/helm-v3-blue)
![Kubernetes](https://img.shields.io/badge/kubernetes-1.25%2B-blue)

## Features

- **System Metrics** — CPU, Memory, Disk, Load Average, Uptime, Temperature
- **Container Monitoring** — Live container stats, logs & processes
- **Kubernetes** — Namespaces, Pods (with live logs), Deployments & Services
- **Network** — RX/TX throughput with time-series charts
- **PromQL Explorer** — Run raw Prometheus queries and visualize results
- **Auth** — JWT login with token expiry and rate limiting

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, MUI, Recharts |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Kubernetes Client |
| **Monitoring** | Prometheus, Node Exporter |
| **Infra** | Helm, Docker, Nginx |

---

## 🚀 Install via Helm

### Add the Helm Repository

```bash
helm repo add metrics https://brahmanyasudulagunta.github.io/Metrics
helm repo update
```

### Option 1: Fresh Cluster (No Prometheus)

If your cluster **does not** have Prometheus installed, the chart will install it for you automatically (via [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)):

```bash
helm install metrics metrics/metrics \
  --namespace metrics \
  --create-namespace
```

This deploys:
- ✅ Metrics Dashboard (frontend + backend)
- ✅ Prometheus (auto-installed)
- ✅ Node Exporter
- ✅ Kube State Metrics

### Option 2: Existing Prometheus

If your cluster **already has** Prometheus running (standalone, kube-prometheus-stack, or any other setup), skip the bundled install and point to your existing Prometheus:

```bash
helm install metrics metrics/metrics \
  --namespace metrics \
  --create-namespace \
  --set monitoring.enabled=false \
  --set prometheus.url="http://<prometheus-service>.<namespace>:9090"
```

**Examples:**

```bash
# Prometheus in "monitoring" namespace
--set prometheus.url="http://prometheus-server.monitoring:9090"

# kube-prometheus-stack in "monitoring" namespace
--set prometheus.url="http://monitoring-kube-prometheus-prometheus.monitoring:9090"

# Prometheus in "observability" namespace
--set prometheus.url="http://prometheus.observability:9090"
```

> **Tip:** Find your Prometheus service with:
> ```bash
> kubectl get svc --all-namespaces | grep prometheus
> ```

---

## 🌐 Access the Dashboard

After installation, port-forward the frontend:

```bash
kubectl port-forward svc/metrics-dashboard 3001:3001 -n metrics
```

Open **http://localhost:3001** and log in.

| Service | Command | URL |
|---|---|---|
| **Dashboard** | `kubectl port-forward svc/metrics-dashboard 3001:3001 -n metrics` | http://localhost:3001 |
| **API Docs** | `kubectl port-forward svc/metrics-api 8000:8000 -n metrics` | http://localhost:8000/docs |
| **Prometheus** | `kubectl port-forward svc/metrics-monitoring-prometheus 9090:9090 -n metrics` | http://localhost:9090 |

> Replace `metrics` with your release name if you used a different one.

---

## ⚙️ Configuration

All configurable values in `values.yaml`:

### Core

| Parameter | Default | Description |
|---|---|---|
| `api.image` | `ashrith2727/backend-metrics` | Backend Docker image |
| `api.tag` | `v1` | Backend image tag |
| `dashboard.image` | `ashrith2727/frontend-metrics` | Frontend Docker image |
| `dashboard.tag` | `v1` | Frontend image tag |
| `api.adminPassword` | `admin` | Initial admin password |
| `api.jwtSecret` | `supersecretkey` | JWT signing secret |

### Prometheus

| Parameter | Default | Description |
|---|---|---|
| `monitoring.enabled` | `true` | Install Prometheus via subchart |
| `prometheus.url` | `http://prometheus-server:9090` | External Prometheus URL (when `monitoring.enabled=false`) |

### Infrastructure

| Parameter | Default | Description |
|---|---|---|
| `persistence.enabled` | `true` | Enable persistent storage |
| `persistence.size` | `1Gi` | PVC size |
| `ingress.enabled` | `false` | Enable ingress |
| `ingress.host` | `metrics.example.com` | Ingress hostname |

---

## 🔄 Upgrade

```bash
helm repo update
helm upgrade metrics metrics/metrics -n metrics
```

## 🗑️ Uninstall

```bash
helm uninstall metrics -n metrics
```

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   Backend   │────▶│    Prometheus     │
│  (React UI)  │     │  (FastAPI)  │     │   (metrics src)  │
│  port: 3001  │     │  port: 8000 │     │   port: 9090     │
└─────────────┘     └──────┬──────┘     └────────▲─────────┘
                           │                      │
                      ┌────▼────┐          ┌──────┴───────┐
                      │ SQLite  │          │ Node Exporter │
                      │  (auth) │          │ + kube-state  │
                      └─────────┘          └──────────────┘
```

## 📝 Local Development (Docker Compose)

```bash
# Build
docker build -t backend-metrics:v1 ./backend
docker build -t frontend-metrics:v1 ./frontend

# Run
docker compose -f infra/docker-compose.yml up -d

# Stop
docker compose -f infra/docker-compose.yml down
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:3001 |
| API Docs | http://localhost:8000/docs |
| Prometheus | http://localhost:9090 |

---

## License

MIT
