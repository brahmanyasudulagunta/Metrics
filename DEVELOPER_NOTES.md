# 🚀 Installation Steps

## 1. Local Development (Docker Compose)
Use this for rapid development without Kubernetes.
```bash
# Start the Backend and Frontend
docker compose -f infra/docker-compose.yml up -d --build
```

## 2. Kubernetes Setup (Kind)
Use this to test the full cluster management features.
```bash
# 1. Create the local cluster
kind create cluster --name gitops

# 2. Ensure context is set
kubectl config use-context kind-gitops
```

## 3. Helm Deployment
Use this to deploy the application into the cluster.
```bash
# 1. Update chart dependencies
helm dependency update ./charts

# 2. Install/Upgrade the metrics stack
helm upgrade --install metrics ./charts \
  --namespace metrics \
  --create-namespace \
  --set monitoring.enabled=true \
  --set prometheus.url="http://prometheus-server:9090"
```

## 4. Verification
```bash
# Check if pods are running
kubectl get pods -n metrics

# Forward the frontend port (if not using Ingress)
kubectl port-forward svc/metrics-dashboard 3000:3001 -n metrics
```
