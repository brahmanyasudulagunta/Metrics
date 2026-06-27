# 🚀 Developer Workflow: From Code Change to Deployment

Whenever you make changes to the backend or frontend source code, follow these exact steps in order to build, deploy, and release your updates.

---

## Step 1: Build & Push New Docker Images
After editing your code, you must package those changes into new Docker images and push them to your registry (e.g., Docker Hub) so Kubernetes can pull them.

```bash
# 1. Define your new version tag (e.g., v1.1.9)
VERSION="v1.1.9"

# 2. Build and push the Backend image
docker build -t brahmanya/backend-metrics:${VERSION} ./backend
docker push brahmanya/backend-metrics:${VERSION}

# 3. Build and push the Frontend image
docker build -t brahmanya/frontend-metrics:${VERSION} ./frontend
docker push brahmanya/frontend-metrics:${VERSION}
```

---

## Step 2: Update the Helm Chart
Now tell your Kubernetes configuration to use the newly built images.

1. Open `charts/values.yaml` and update the image tags:
```yaml
api:
  image: brahmanya/backend-metrics
  tag: "v1.1.9"  # <-- Update to your new backend tag

dashboard:
  image: brahmanya/frontend-metrics
  tag: "v1.1.9"  # <-- Update to your new frontend tag
```

2. Open `charts/Chart.yaml` and increment the versions:
```yaml
version: "1.1.5"      # <-- Increment the Helm chart release version (e.g. 1.1.4 -> 1.1.5)
appVersion: "1.1.9"   # <-- Match your new application docker image tag
```

---

## Step 3: Test the Deployment Locally (Optional)
Before pushing to GitHub, it is highly recommended to verify your changes work in your local cluster:

```bash
# Update local dependencies and deploy the new images
helm dependency update ./charts
  helm upgrade --install metrics ./charts -n metrics
```
*Verify everything is running successfully: `kubectl get pods -n metrics`*

---

## Step 4: Commit & Push Code to Main Branch
Save your source code and Helm configuration changes to your main Git branch.

```bash
# 1. Add all modified files
git add .

# 2. Commit your changes
git commit -m "Update application code and bump chart to v1.1.5"

# 3. Push to your main branch
git push origin main
```

---

## Step 5: Package & Release to the Helm Repository (`gh-pages`)
Finally, publish the updated Helm chart to your GitHub Pages repository so your users can install it via standard `helm install` commands.

### Part A: Package the Chart
```bash
# 1. Package the charts directory into a tarball
helm package ./charts
```
*This generates a file like `metrics-1.1.5.tgz` in your current directory.*

### Part B: Update the `gh-pages` Branch
```bash
# 2. Move the package out of git tracking temporarily
mv metrics-*.tgz /tmp/

# 3. Checkout your gh-pages branch
git fetch origin
git checkout gh-pages

# 4. Bring the package back into the workspace
mv /tmp/metrics-*.tgz .

# 5. Re-generate the Helm index to register the new version
helm repo index . --url https://brahmanyasudulagunta.github.io/Metrics/ --merge index.yaml
```

### Part C: Publish to GitHub Pages
```bash
# 6. Commit the new release files
git add metrics-*.tgz index.yaml
git commit -m "Release metrics-1.1.5 Helm chart"

# 7. Push the repository index to GitHub Pages
git push origin gh-pages

# 8. Return to your working branch to resume development
git checkout main
```
