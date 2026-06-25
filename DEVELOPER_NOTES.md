# 🛠️ Developer Guide: Helm Release & Git Push Workflow

This document outlines the workflow for updating the Helm chart configurations, committing code changes, and releasing new packaged chart versions to your GitHub Pages Helm repository.

---

## Step 1: Update Helm Chart Configuration

After making your code changes and preparing your new application docker images (e.g., version `v1.1.8`), update the Helm values:

1. Open [charts/values.yaml](file:///home/brahmanya/Metrics/charts/values.yaml) and update the backend and frontend tags with your new image version:
   ```yaml
   api:
     image: brahmanya/backend-metrics
     tag: "v1.1.8"  # <-- Update backend tag

   dashboard:
     image: brahmanya/frontend-metrics
     tag: "v1.1.8"  # <-- Update frontend tag
   ```

2. Open [charts/Chart.yaml](file:///home/brahmanya/Metrics/charts/Chart.yaml) and increment the chart `version` (e.g., to `1.1.4`):
   ```yaml
   version: "1.1.4"      # <-- Increment chart release version
   appVersion: "1.1.8"   # <-- Match your application version tag
   ```

---

## Step 2: Commit & Push Code and Chart Changes to Git

Push all your source code updates, configuration edits, and chart value modifications to your development branch (e.g., `main`):

```bash
# 1. Add all modified files
git add .

# 2. Commit changes
git commit -m "Update backend services, frontend dashboard, and charts to v1.1.8"

# 3. Push to your main repository branch
git push origin main
```

---

## Step 3: Package & Release Helm Chart (to GitHub Pages)

Publish the updated Helm chart package to your public Helm repository hosted on the `gh-pages` branch:

### Part A: Package the Helm Chart
```bash
# 1. Download and update chart dependencies (subcharts)
helm dependency update ./charts

# 2. Package the charts directory into a tarball
helm package ./charts
```
*This command creates a release package (e.g., `metrics-1.1.4.tgz`) in your root directory.*

### Part B: Update and Index the `gh-pages` Branch
```bash
# 3. Move the package out of git tracking temporarily
mv metrics-*.tgz /tmp/

# 4. Fetch changes and checkout your gh-pages branch
git fetch origin
git checkout gh-pages

# 5. Bring the package back into the workspace
mv /tmp/metrics-*.tgz .

# 6. Re-generate the index.yaml file, merging it with your existing repository history
helm repo index . --url https://brahmanyasudulagunta.github.io/Metrics/ --merge index.yaml
```

### Part C: Push Release to GitHub Pages
```bash
# 7. Add the new package and updated index
git add metrics-*.tgz index.yaml
git commit -m "Release metrics-1.1.4 Helm chart"

# 8. Push to GitHub Pages Helm repo
git push origin gh-pages

# 9. Return to your working branch to resume development
git checkout main
```
