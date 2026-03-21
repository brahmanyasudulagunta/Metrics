# Metrics Dashboard

A Kubernetes-native monitoring dashboard that provides real-time visibility into your cluster health, pod performance, and HTTP traffic metrics.

---

## 🚀 Installation

Follow these steps to deploy the Metrics Dashboard to your Kubernetes cluster using Helm.

### 1. Prepare Environment
Add the official repository and create a dedicated namespace.

```bash
helm repo add metrics https://brahmanyasudulagunta.github.io/Metrics/
helm repo update
kubectl create namespace metrics
```

### 2. Deploy Dashboard

Choose the scenario that matches your cluster setup:

#### Scenario A: Fresh Cluster (Recommended)
This installs the dashboard along with a pre-configured Prometheus stack.

```bash
helm upgrade --install metrics metrics/metrics -n metrics
```

#### Scenario B: Existing Prometheus
If you already have Prometheus running (e.g., `kube-prometheus-stack`), point the dashboard to your existing service.

```bash
helm upgrade --install metrics metrics/metrics \
  -n metrics \
  --set monitoring.enabled=false \
  --set prometheus.url="http://prometheus-operated.monitoring:9090"
```

### 3. Access the Dashboard
Once the pods are running, use port-forwarding to access the UI:

```bash
kubectl port-forward svc/metrics-frontend 3001:3001 -n metrics
```
You can then open the dashboard at [http://localhost:3001](http://localhost:3001).


---


## Features
- **Overview:** Real-time CPU/Memory stats for the entire cluster.
- **Kubernetes Explorer:** Deep dive into Pods, Deployments, and Events.
- **Optimization:** Identify resource-heavy pods and scaling opportunities.

---

## 🤝 How This Complements Grafana (Not Competes)

Great question that often comes up: *"How does this fit alongside Grafana?"*

Think of them as two tools with different jobs on the same team:

| | **This Dashboard** | **Grafana** |
|---|---|---|
| **Primary Focus** | Kubernetes-native operator experience | General-purpose metric visualization |
| **Setup Effort** | Zero-config — deploys via a single Helm chart | Requires data sources, panel config, and dashboard JSON |
| **Target User** | Developer / SRE who needs quick cluster context | Data analyst / SRE building custom observability |
| **Scope** | Pod health, events, deployments, HTTP traffic | Any metric from any source (logs, traces, APM, etc.) |
| **Interaction Model** | Unified UI with cluster actions (no CLI jumping) | Read-only dashboards with rich query (PromQL/LogQL) |

### The Complementary Workflow

1. **Day-to-day triage** → use this dashboard to check pod health, spot resource hogs, and review recent events — all without leaving a single UI or writing a PromQL query.
2. **Deep investigation / capacity planning** → hand off to Grafana for custom dashboards, alert rules, long-term trend analysis, and multi-cluster aggregation.
3. **Shared data layer** → both tools can point at the same Prometheus instance (see *Scenario B* above), so there is zero duplication of scraping or storage.

In short: this dashboard lowers the barrier to *daily* Kubernetes observability, while Grafana remains the power tool for *custom* monitoring. They are better together than either is alone.
