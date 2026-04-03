# Kubernetes Observability Platform

A Kubernetes-native monitoring dashboard that provides real-time visibility into your cluster health, pod performance, and HTTP traffic metrics.

---

## Installation

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

Use username `admin` to sign in to the dashboard.

If you need to reveal current Helm credentials from Kubernetes Secret (`<release-name>-secret`), for this install it is `metrics-secret`:

```bash
kubectl get secret metrics-secret -n metrics -o jsonpath='{.data.ADMIN_PASSWORD}' | base64 -d && echo
kubectl get secret metrics-secret -n metrics -o jsonpath='{.data.JWT_SECRET}' | base64 -d && echo
kubectl get secret metrics-secret -n metrics -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d && echo
```


---


## Features
- **Overview:** Real-time CPU/Memory stats for the entire cluster.
- **Kubernetes Explorer:** Deep dive into Pods, Deployments, and Events.
- **Optimization:** Identify resource-heavy pods and scaling opportunities.
