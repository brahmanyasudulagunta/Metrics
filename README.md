# Metrics Dashboard

A Kubernetes-native monitoring dashboard that provides real-time visibility into your cluster health, pod performance, and HTTP traffic metrics.

---

## Quick Start (Local Installation)

If you are developing locally (e.g., using Kind or Minikube), follow these steps to get the full experience.


### 2. Install the Dashboard
We recommend starting fresh in a dedicated namespace.

```bash
# 1. Create the namespace
kubectl create namespace metrics

# 2. Update local dependencies
helm dependency update ./charts

# 3. Install the chart (pointing to your existing Prometheus)
helm upgrade --install metrics ./charts \
  -n metrics \
  --set monitoring.enabled=false \
  --set monitoring.releaseName=monitoring \
  --set prometheus.url="http://monitoring-kube-prometheus-prometheus.monitoring:9090" \
  --set gateway.enabled=true
```

---


## Features
- **Overview:** Real-time CPU/Memory stats for the entire cluster.
- **Kubernetes Explorer:** Deep dive into Pods, Deployments, and Events.
- **Optimization:** Identify resource-heavy pods and scaling opportunities.
