# ☁️ RetailOS — Cloud Deployment Guide

This guide covers deploying RetailOS to **Google Cloud Platform** using **Terraform**, **Helm**, and **GitHub Actions CI/CD**.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Step 1 — GCP Project Setup](#step-1--gcp-project-setup)
- [Step 2 — Terraform Infrastructure](#step-2--terraform-infrastructure)
- [Step 3 — Connect to GKE](#step-3--connect-to-gke)
- [Step 4 — Create Kubernetes Secrets](#step-4--create-kubernetes-secrets)
- [Step 5 — Deploy with Helm](#step-5--deploy-with-helm)
- [Step 6 — CI/CD (Automated Deployments)](#step-6--cicd-automated-deployments)
- [ArgoCD GitOps](#-argocd-gitops)
- [Monitoring (Prometheus + Grafana)](#-monitoring-prometheus--grafana)
- [Troubleshooting](#-troubleshooting)

---

## 🏛 Architecture Overview

```
                    ┌──────────────┐
                    │   Internet   │
                    └──────┬───────┘
                           │
               ┌───────────▼────────────┐
               │  Google Cloud Armor    │  ← WAF (SQLi, RCE block, rate limiting)
               │  (retail-cloud-armor)  │
               └───────────┬────────────┘
                           │
               ┌───────────▼────────────┐
               │  GCE Ingress           │  ← Static IP (retail-static-ip)
               │  (L7 Load Balancer)    │
               └──────┬────────┬────────┘
                      │        │
              /       │        │  /api/*
              │        │
    ┌─────────▼───┐  ┌─▼──────────────┐
    │  Frontend   │  │    Backend     │
    │  (Nginx)    │  │  (.NET 10)     │
    │  port 80    │  │  port 8080     │
    └─────────────┘  └───────┬────────┘
                             │ localhost:5432
                    ┌────────▼─────────┐
                    │  Cloud SQL Proxy │  ← Sidecar container
                    │  (private IP)    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Cloud SQL       │
                    │  (PostgreSQL)    │
                    └──────────────────┘
```

**All infrastructure lives in GCP project `retail-mvp-dev`, region `us-central1`.**

---

## ✅ Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [gcloud CLI](https://cloud.google.com/sdk/docs/install) | Latest | GCP management |
| [Terraform](https://www.terraform.io/downloads) | ≥ 1.5 | Infrastructure provisioning |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | ≥ 1.28 | Kubernetes management |
| [Helm](https://helm.sh/docs/intro/install/) | ≥ 3.14 | Kubernetes package management |
| [Docker](https://docs.docker.com/get-docker/) | Latest | Building container images |

---

## Step 1 — GCP Project Setup

### 1.1 Authenticate & set project

```bash
gcloud auth login
gcloud config set project retail-mvp-dev
```

### 1.2 Enable required APIs

```bash
gcloud services enable \
  container.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### 1.3 Create Artifact Registry repository

```bash
gcloud artifacts repositories create retail-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="RetailOS container images"
```

### 1.4 Reserve a static IP for the load balancer

```bash
gcloud compute addresses create retail-static-ip --global
gcloud compute addresses describe retail-static-ip --global --format="value(address)"
```

### 1.5 Create Terraform state bucket

```bash
gcloud storage buckets create gs://youngyz-tf-state-12345 --location=us-central1
```

---

## Step 2 — Terraform Infrastructure

Terraform provisions all cloud resources using modular configs.

### Terraform Modules

| Module | Resources Created |
|---|---|
| `vpc` | VPC network, subnet with pod/service secondary ranges |
| `gke` | Private GKE cluster, node pool (e2-medium, 1–5 autoscaler), Workload Identity |
| `cloudsql` | Cloud SQL PostgreSQL instance, database, user |
| `gcs` | Cloud Storage bucket |
| `iam` | GKE service account, IAM bindings (Cloud SQL client, Artifact Registry reader/writer, WIF) |
| `armor` | Cloud Armor security policy (SQLi/RCE protection, rate limiting) |

### 2.1 Initialise Terraform

```bash
cd terraform-gcp/environments/dev
terraform init
```

### 2.2 Review the plan

```bash
terraform plan
```

### 2.3 Apply

```bash
terraform apply
```

> **⏱ Expected time:** ~15–20 minutes (Cloud SQL and GKE take the longest).

### Terraform State

State is stored remotely in GCS:
```hcl
# backend.tf
terraform {
  backend "gcs" {
    bucket = "youngyz-tf-state-12345"
    prefix = "gcp/dev"
  }
}
```

---

## Step 3 — Connect to GKE

After Terraform finishes, configure `kubectl` to point at your cluster:

```bash
gcloud container clusters get-credentials gke-cluster \
  --region us-central1 \
  --project retail-mvp-dev
```

Verify nodes are ready:

```bash
kubectl get nodes
# Expected: 2+ nodes in Ready state
```

---

## Step 4 — Create Kubernetes Secrets

The backend reads the JWT signing key from a Kubernetes Secret:

```bash
kubectl create namespace retail-app

kubectl create secret generic retailos-secrets \
  --namespace retail-app \
  --from-literal=jwt-key="ThisIsAVerySecretKeyThatNeedsToBeLongEnoughForHMAC256"
```

Create the Kubernetes Service Account with Workload Identity annotation:

```bash
kubectl create serviceaccount gke-app-ksa -n retail-app

kubectl annotate serviceaccount gke-app-ksa -n retail-app \
  iam.gke.io/gcp-service-account=gke-app-sa@retail-mvp-dev.iam.gserviceaccount.com
```

---

## Step 5 — Deploy with Helm

### 5.1 First-time install

```bash
helm upgrade --install retailos ./helm/retailos \
  -f helm/retailos/values.yaml \
  -f helm/retailos/values-dev.yaml \
  --namespace retail-app \
  --create-namespace \
  --timeout 10m
```

### 5.2 Deploy a specific image

```bash
helm upgrade --install retailos ./helm/retailos \
  -f helm/retailos/values.yaml \
  -f helm/retailos/values-dev.yaml \
  --set backend.image=us-central1-docker.pkg.dev/retail-mvp-dev/retail-repo/backend:abc1234 \
  --set frontend.image=us-central1-docker.pkg.dev/retail-mvp-dev/retail-repo/frontend:abc1234 \
  --namespace retail-app \
  --timeout 10m
```

### 5.3 Verify deployment

```bash
kubectl get pods -n retail-app
kubectl get svc -n retail-app
kubectl get ingress -n retail-app
```

### 5.4 Check the Helm release

```bash
helm list -n retail-app
helm status retailos -n retail-app
```

### 5.5 Rollback

```bash
# List revisions
helm history retailos -n retail-app

# Rollback to previous version
helm rollback retailos 1 -n retail-app
```

### Helm Values Structure

```
values.yaml          ← Base/shared config (ports, replicas, resource limits)
  └── values-dev.yaml    ← Dev overrides (Cloud SQL instance, DB password, JWT key)
  └── values-prod.yaml   ← (Future) prod overrides
```

| Value | Source | Example |
|---|---|---|
| `backend.image` | CI pipeline `--set` | `us-central1-docker.pkg.dev/.../backend:sha` |
| `frontend.image` | CI pipeline `--set` | `us-central1-docker.pkg.dev/.../frontend:sha` |
| `backend.port` | `values.yaml` | `8080` |
| `cloudsql.instance` | `values-dev.yaml` | `retail-mvp-dev:us-central1:postgres-instance` |
| `jwt.key` | `retailos-secrets` K8s Secret | (stored securely) |

---

## Step 6 — CI/CD (Automated Deployments)

### How it works

Every push to the `main` branch triggers the GitHub Actions workflow (`.github/workflows/ci.yaml`):

```
Push to main
  │
  ├── 1. Lint Helm chart
  ├── 2. Authenticate to GCP (Workload Identity — no keys!)
  ├── 3. Build & push Docker images to Artifact Registry
  │       ├── frontend:<commit-sha> + frontend:latest
  │       └── backend:<commit-sha>  + backend:latest
  ├── 4. Get GKE credentials
  ├── 5. Bootstrap namespace + service account
  ├── 6. helm upgrade --install (with commit SHA tags)
  └── 7. Verify rollout (kubectl rollout status)
```

### Workload Identity Federation

CI authenticates to GCP **without service account keys** using GitHub OIDC:

| Component | Value |
|---|---|
| WIF Pool | `github-pool` |
| WIF Provider | `github-provider` |
| GCP Service Account | `gke-app-sa@retail-mvp-dev.iam.gserviceaccount.com` |
| Bound to repo | `Youngyz1/retail-mvp` |

### Required GitHub Permissions

The workflow needs `id-token: write` to request OIDC tokens:

```yaml
permissions:
  contents: read
  id-token: write
```

### Manual re-trigger

If you need to re-run the pipeline without code changes:

```bash
git commit --allow-empty -m "ci: retrigger deployment"
git push origin main
```

---

## 🔄 ArgoCD GitOps

ArgoCD is configured to watch the Helm chart in the repo and auto-sync:

```yaml
# argocd/application.yaml
source:
  path: helm/retailos
  helm:
    valueFiles:
      - values.yaml
      - values-dev.yaml
```

### Access ArgoCD UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open https://localhost:8080
```

### Get ArgoCD admin password

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

---

## 📊 Monitoring (Prometheus + Grafana)

The cluster has `kube-prometheus-stack` installed for monitoring.

### Access Grafana

```bash
kubectl port-forward svc/kube-prometheus-stack-grafana -n monitoring 3001:80
# Open http://localhost:3001
# Default: admin / prom-operator
```

### Access Prometheus

```bash
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090
# Open http://localhost:9090
```

---

## 🔒 Cloud Armor WAF Rules

The `retail-cloud-armor` security policy protects the ingress:

| Priority | Action | Description |
|---|---|---|
| 500 | Allow | All `/api/*` endpoints |
| 900 | Allow | Auth endpoints (`/api/auth/*`) |
| 1000 | Deny (403) | SQL injection attacks (sqli-v33-stable) |
| 1002 | Deny (403) | Remote code execution / Log4Shell (rce-v33-stable) |
| 2000 | Rate limit | 100 requests/min per IP, 5-min ban on exceed |
| 2147483647 | Allow | Default rule (allow all remaining traffic) |

---

## 🛠 Troubleshooting

### Pods not starting

```bash
# Check pod status and events
kubectl describe pod <pod-name> -n retail-app

# Check logs
kubectl logs <pod-name> -n retail-app -c backend
kubectl logs <pod-name> -n retail-app -c cloud-sql-proxy
```

### Cloud SQL connection issues

```bash
# Verify the proxy sidecar is running
kubectl logs <pod-name> -n retail-app -c cloud-sql-proxy

# Common causes:
# - Workload Identity not configured (check KSA annotation)
# - Cloud SQL instance name wrong in values-dev.yaml
# - Cloud SQL not provisioned yet (check Terraform)
```

### Namespace stuck in Terminating state

```bash
# Remove stuck finalizers
kubectl get namespace retail-app -o json | \
  jq '.spec.finalizers = []' | \
  kubectl replace --raw "/api/v1/namespaces/retail-app/finalize" -f -
```

### Helm release in failed state

```bash
# List all releases including failed
helm list -n retail-app -a

# Uninstall and start fresh
helm uninstall retailos -n retail-app
helm install retailos ./helm/retailos -f helm/retailos/values.yaml -f helm/retailos/values-dev.yaml -n retail-app
```

### Image pull errors (ErrImagePull)

```bash
# Verify the GKE service account has Artifact Registry reader role
gcloud projects get-iam-policy retail-mvp-dev \
  --flatten="bindings[].members" \
  --filter="bindings.members:gke-app-sa" \
  --format="table(bindings.role)"

# Expected: roles/artifactregistry.reader
```

### Frontend rollout stuck

```bash
# Check if old replica termination is blocking
kubectl get replicasets -n retail-app
kubectl describe deployment frontend -n retail-app

# Force delete stuck pods
kubectl delete pod <pod-name> -n retail-app --grace-period=0 --force
```

---

## 📁 Infrastructure Files Quick Reference

| File | Purpose |
|---|---|
| `terraform-gcp/environments/dev/main.tf` | Wires all Terraform modules together |
| `terraform-gcp/environments/dev/backend.tf` | Terraform state backend (GCS) |
| `terraform-gcp/environments/dev/variables.tf` | Environment variables |
| `helm/retailos/Chart.yaml` | Helm chart metadata |
| `helm/retailos/values.yaml` | Base Helm values |
| `helm/retailos/values-dev.yaml` | Dev environment overrides |
| `.github/workflows/ci.yaml` | CI/CD pipeline |
| `argocd/application.yaml` | ArgoCD Application manifest |

---

## 🚀 Full Deployment Checklist (from scratch)

- [ ] GCP project created and billing enabled
- [ ] Required APIs enabled
- [ ] Artifact Registry repository created
- [ ] Static IP reserved (`retail-static-ip`)
- [ ] Terraform state bucket created
- [ ] `terraform init && terraform apply` completed
- [ ] `gcloud container clusters get-credentials` run
- [ ] Namespace + service account created
- [ ] `retailos-secrets` Kubernetes Secret created
- [ ] Helm chart deployed (`helm upgrade --install`)
- [ ] Pods running (`kubectl get pods -n retail-app`)
- [ ] Ingress has external IP (`kubectl get ingress -n retail-app`)
- [ ] Application accessible via external IP
- [ ] GitHub Actions CI/CD tested (push to main)
