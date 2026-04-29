# 🛍️ RetailOS — Retail Management System

A full-stack retail management platform built with **.NET 10**, **React 18**, and **PostgreSQL**, deployed on **Google Cloud (GKE)** with a fully automated CI/CD pipeline.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start — Local Development](#-quick-start--local-development)
- [Cloud Deployment](#-cloud-deployment)
  - [Prerequisites](#prerequisites)
  - [1. Provision Infrastructure](#1-provision-infrastructure)
  - [2. Configure Workload Identity Federation](#2-configure-workload-identity-federation)
  - [3. Build & Push Docker Images](#3-build--push-docker-images)
  - [4. Create Kubernetes Secrets](#4-create-kubernetes-secrets)
  - [5. Deploy via Helm](#5-deploy-via-helm)
  - [6. CI/CD Pipeline](#6-cicd-pipeline)
  - [7. Monitoring & Alerts](#7-monitoring--alerts)
  - [8. ArgoCD GitOps](#8-argocd-gitops)
- [Production URLs](#-production-urls)
- [Operations Runbook](#-operations-runbook)
- [API Reference](#-api-reference)
- [Authentication](#-authentication)
- [Seed Data](#-seed-data)

---

## ✨ Features

| Module | Route | Description |
|---|---|---|
| **Dashboard** | `/` | Revenue stats, order counts, low-stock alerts, recent activity |
| **Products** | `/products` | Full CRUD, stock management, low-stock threshold warnings |
| **Orders & Sales** | `/orders` | Create/manage orders, status workflow (Pending → Completed), multi-channel (Online / In-Store) |
| **Customers** | `/customers` | Customer CRUD with order history |
| **Invoices** | `/invoices` | View invoices, toggle PAID/UNPAID, printable invoice view |
| **Suppliers & POs** | `/suppliers` | Supplier CRUD, purchase order management |
| **Analytics** | `/analytics` | Sales trends, revenue charts, category breakdowns |
| **User Management** | `/users` | Admin-only: manage users, assign roles |

**Cross-cutting features:**
- 🔐 JWT authentication with role-based access (Admin, Manager, Cashier, User)
- 🌙 Dark / Light theme toggle
- 🔔 Live low-stock badge in sidebar navigation
- 🖨️ Browser-native invoice printing
- ⏰ Real-time clock in sidebar

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | .NET 10 · ASP.NET Core · Entity Framework Core · ASP.NET Identity |
| **Frontend** | React 18 · React Router 6 · Tailwind CSS · Heroicons · Recharts · Axios |
| **Database** | SQLite (local dev) · PostgreSQL 15 (Docker & Cloud) |
| **Containers** | Docker · Docker Compose |
| **Cloud** | Google Cloud Platform — GKE, Cloud SQL, Cloud Armor, GCS, IAM, Artifact Registry, Secret Manager |
| **IaC** | Terraform (modular) |
| **Orchestration** | Kubernetes · Helm v4 |
| **CI/CD** | GitHub Actions (Workload Identity Federation — keyless auth) |
| **GitOps** | ArgoCD |
| **Monitoring** | GCP Cloud Monitoring · Prometheus + Grafana (kube-prometheus-stack) |
| **Secrets** | GCP Secret Manager |

---

## 🗂 Project Structure

```
retail-mvp/
├── backend/                          # .NET 10 API
│   ├── Dockerfile
│   └── RetailOS.Api/
│       ├── Controllers/              # REST API controllers (11)
│       │   ├── AuthController.cs
│       │   ├── ProductsController.cs
│       │   ├── OrdersController.cs
│       │   ├── CustomersController.cs
│       │   ├── InvoicesController.cs
│       │   ├── SuppliersController.cs
│       │   ├── PurchaseOrdersController.cs
│       │   ├── CategoriesController.cs
│       │   ├── DashboardController.cs
│       │   ├── AnalyticsController.cs
│       │   └── UsersController.cs
│       ├── Models/
│       ├── Data/                     # EF DbContext + Seeder
│       ├── Migrations/
│       ├── Program.cs
│       └── appsettings.json
│
├── frontend/                         # React 18 SPA
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       ├── components/
│       ├── context/                  # AuthContext, ThemeContext
│       └── api/                      # Axios API client
│
├── helm/retailos/                    # Helm chart
│   ├── Chart.yaml
│   ├── values.yaml                  # Base/shared values
│   ├── values-dev.yaml              # Dev environment overrides
│   ├── values-prod.yaml             # Prod environment overrides
│   └── templates/                   # K8s resource templates
│
├── terraform-gcp/
│   ├── environments/
│   │   ├── dev/                     # Dev environment config
│   │   └── prod/                    # Prod environment config
│   └── modules/
│       ├── vpc/
│       ├── gke/
│       ├── cloudsql/
│       ├── gcs/
│       ├── iam/
│       ├── armor/
│       ├── secretmanager/           # GCP Secret Manager
│       └── monitoring/              # Cloud Monitoring alerts
│
├── .github/workflows/ci-cd.yaml    # Branch-based CI/CD pipeline
├── argocd/                          # ArgoCD Application manifest
└── docker-compose.yml
```

---

## 🚀 Quick Start — Local Development

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Option 1: Docker Compose (recommended)

```bash
# Start all services (backend + frontend + PostgreSQL)
docker-compose up --build

# Frontend:   http://localhost:3000
# API:        http://localhost:8000
# PostgreSQL: localhost:5432
```

### Option 2: Run separately

```bash
# Backend
cd backend/RetailOS.Api
dotnet run
# API at http://localhost:5000

# Frontend
cd frontend
npm install
npm start
# App at http://localhost:3000
```

---

## ☁️ Cloud Deployment

### Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Terraform >= 1.5](https://developer.hashicorp.com/terraform/downloads)
- [Helm v4](https://helm.sh/docs/intro/install/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- Two GCP projects: `retail-mvp-dev` and `retail-mvp-prod`
- A GitHub repository with Actions enabled

---

### 1. Provision Infrastructure

Terraform creates all GCP resources — VPC, GKE cluster, Cloud SQL, Artifact Registry, IAM service accounts, Secret Manager secrets, and Cloud Monitoring alerts.

```bash
# For prod environment
cd terraform-gcp/environments/prod

# Create terraform.tfvars (never commit this file)
cat > terraform.tfvars << 'EOF'
project_id       = "retail-mvp-prod"
region           = "us-central1"
db_password      = "YOUR_DB_PASSWORD"
db_url           = "postgresql://app_user:YOUR_DB_PASSWORD@127.0.0.1:5432/app_db?sslmode=disable&gssencmode=disable"
jwt_key          = "YOUR_JWT_SIGNING_KEY_MIN_32_CHARS"
slack_channel    = "#retailos-alerts"
slack_auth_token = "xoxb-YOUR_SLACK_BOT_TOKEN"
EOF

terraform init
terraform apply -auto-approve
```

> ⚠️ `terraform.tfvars` is git-ignored — never commit it.

**What Terraform provisions:**

| Module | Resources |
|---|---|
| `vpc` | VPC network, subnet, private IP range, Service Networking peering |
| `gke` | GKE cluster, node pool (e2-standard-2, 2–5 nodes), Workload Identity |
| `cloudsql` | PostgreSQL 15, REGIONAL HA, private IP, automated backups, PITR |
| `iam` | `gke-app-sa` service account, WIF pool + provider, IAM bindings |
| `gcs` | GCS bucket for app assets |
| `armor` | Cloud Armor WAF policy |
| `secretmanager` | `prod-db-url`, `prod-jwt-key` secrets with IAM accessor binding |
| `monitoring` | Cloud Monitoring alert policies + Slack notification channel |

---

### 2. Configure Workload Identity Federation

WIF allows GitHub Actions to authenticate to GCP without storing service account keys.

```bash
# Bind GitHub Actions to the prod service account
gcloud iam service-accounts add-iam-policy-binding \
  gke-app-sa@retail-mvp-prod.iam.gserviceaccount.com \
  --project=retail-mvp-prod \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_ORG/retail-mvp"
```

Replace `PROJECT_NUMBER` and `YOUR_GITHUB_ORG` with your values.

---

### 3. Build & Push Docker Images

Images are built and pushed automatically by CI. For a manual push:

```bash
# Authenticate Docker to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet

# Build and push backend
docker build -t us-central1-docker.pkg.dev/retail-mvp-prod/retail-repo/backend:latest ./backend
docker push us-central1-docker.pkg.dev/retail-mvp-prod/retail-repo/backend:latest

# Build and push frontend
docker build -t us-central1-docker.pkg.dev/retail-mvp-prod/retail-repo/frontend:latest ./frontend
docker push us-central1-docker.pkg.dev/retail-mvp-prod/retail-repo/frontend:latest
```

---

### 4. Create Kubernetes Secrets

Secrets are managed by the CI pipeline which pulls them from GCP Secret Manager. For manual bootstrapping:

```bash
# Point kubectl at prod cluster
gcloud container clusters get-credentials gke-cluster \
  --zone us-central1-a \
  --project retail-mvp-prod

# Pull from Secret Manager and create Kubernetes secret
DB_URL=$(gcloud secrets versions access latest --secret=prod-db-url --project=retail-mvp-prod)
JWT_KEY=$(gcloud secrets versions access latest --secret=prod-jwt-key --project=retail-mvp-prod)

kubectl create namespace retail-app --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic retailos-secrets \
  --from-literal=db-url="${DB_URL}" \
  --from-literal=jwt-key="${JWT_KEY}" \
  -n retail-app \
  --dry-run=client -o yaml | kubectl apply -f -

# Label secret for Helm ownership
kubectl label secret retailos-secrets -n retail-app \
  "app.kubernetes.io/managed-by=Helm" --overwrite
kubectl annotate secret retailos-secrets -n retail-app \
  "meta.helm.sh/release-name=retailos" \
  "meta.helm.sh/release-namespace=retail-app" --overwrite
```

---

### 5. Deploy via Helm

```bash
helm upgrade --install retailos ./helm/retailos \
  -f helm/retailos/values.yaml \
  -f helm/retailos/values-prod.yaml \
  --namespace retail-app \
  --create-namespace \
  --set backend.image=us-central1-docker.pkg.dev/retail-mvp-prod/retail-repo/backend:latest \
  --set frontend.image=us-central1-docker.pkg.dev/retail-mvp-prod/retail-repo/frontend:latest \
  --atomic \
  --timeout 10m

# Verify
kubectl get pods -n retail-app
kubectl get ingress -n retail-app
```

---

### 6. CI/CD Pipeline

The pipeline is fully automated via GitHub Actions (`.github/workflows/ci-cd.yaml`).

| Branch | Action |
|---|---|
| `dev` | Build → push to dev registry → deploy to `retail-mvp-dev` GKE |
| `main` | Build → push to prod registry → pull secrets from Secret Manager → deploy to `retail-mvp-prod` GKE |

**Pipeline steps (prod):**
1. Lint Helm chart
2. Authenticate to GCP via Workload Identity Federation (no keys)
3. Build and push backend + frontend images tagged with `git SHA`
4. Get GKE credentials
5. Bootstrap namespace, service account, Helm secret ownership
6. Pull `db-url` and `jwt-key` from GCP Secret Manager
7. `helm upgrade --install --atomic`
8. Verify rollout (`kubectl rollout status`)

**Git workflow:**
```bash
# Develop and test on dev branch
git checkout dev
git push origin dev        # triggers dev deploy

# Promote to prod
git checkout main
git merge dev
git push origin main       # triggers prod deploy
```

---

### 7. Monitoring & Alerts

#### GCP Cloud Monitoring
Terraform provisions alert policies that fire to Slack for:

| Alert | Condition |
|---|---|
| Pod restarts | Container restart rate > 2 in 60s |
| High CPU | Backend CPU > 80% for 5 minutes |
| High memory | Backend memory > 80% for 5 minutes |
| DB connections | Cloud SQL connections > 80 |

#### Prometheus + Grafana
Install kube-prometheus-stack for in-cluster metrics and dashboards:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=YOUR_GRAFANA_PASSWORD \
  --set prometheus.service.type=LoadBalancer \
  --set grafana.service.type=LoadBalancer
```

Verify:
```bash
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

Grafana is exposed as a LoadBalancer. Add Prometheus as a data source in Grafana at:
`http://<prometheus-ip>:9090`

---

### 8. ArgoCD GitOps

ArgoCD continuously syncs the cluster state to the Helm chart in Git.

**Install ArgoCD:**
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Expose as LoadBalancer
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
```

**Install ArgoCD CLI:**
```bash
# Linux/Git Bash
mkdir -p ~/bin
curl -sSL -o ~/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x ~/bin/argocd
export PATH=$PATH:~/bin   # add to ~/.bashrc to persist
```

**Login and check app:**
```bash
argocd login <ARGOCD_IP> --username admin --password <PASSWORD> --insecure

# Check app status
argocd app get retail-mvp

# Manual sync if needed
argocd app sync retail-mvp
```

**`argocd/application.yaml`** points to `values-prod.yaml` for the prod cluster:
```yaml
helm:
  valueFiles:
    - values.yaml
    - values-prod.yaml
```

---

## 🌐 Production URLs

| Service | URL | Credentials |
|---|---|---|
| **App** | http://34.149.225.237 | `admin@retailos.com` / `Admin@123456` |
| **Grafana** | http://136.113.116.151 | `admin` / see Secret Manager |
| **Prometheus** | http://136.114.181.89:9090 | — |
| **ArgoCD** | http://34.121.113.90 | `admin` / see ArgoCD secret |

> ⚠️ These are internal/staging IPs. Do not expose credentials publicly.

---

## 🛠 Operations Runbook

### Switch kubectl context

```bash
# Switch to prod
kubectl config use-context gke_retail-mvp-prod_us-central1-a_gke-cluster

# Switch to dev
kubectl config use-context gke_retail-mvp-dev_us-central1-a_gke-cluster

# Check current context
kubectl config current-context
```

### Check prod health

```bash
kubectl get pods -n retail-app
kubectl get hpa -n retail-app
kubectl top pods -n retail-app
kubectl top nodes
kubectl get ingress -n retail-app
```

### Deploy to prod

```bash
# Just push to main — pipeline handles everything
git push origin main
```

### Deploy to dev

```bash
git push origin dev
```

### Test login and API

```bash
# Get ingress IP
kubectl get ingress -n retail-app

# Register a user
curl -X POST http://<INGRESS-IP>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","fullName":"Test User"}'

# Login
curl -X POST http://<INGRESS-IP>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
# Expected: {"token":"eyJ...","email":"test@test.com",...}
```

### Check monitoring stack

```bash
kubectl get pods -n monitoring
```

### Get monitoring passwords

```bash
# ArgoCD admin password
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d

# Grafana admin password
kubectl get secret kube-prometheus-stack-grafana -n monitoring \
  -o jsonpath="{.data.admin-password}" | base64 -d
```

### Port-forward monitoring UIs (local access)

Open 3 separate terminals:

```bash
# Terminal 1 — ArgoCD (https://localhost:8080, admin)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Terminal 2 — Grafana (http://localhost:3000, admin)
kubectl port-forward svc/kube-prometheus-stack-grafana -n monitoring 3000:80

# Terminal 3 — Prometheus (http://localhost:9090)
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090
```

### ArgoCD CLI operations

```bash
# Add to PATH (every new terminal)
export PATH=$PATH:~/bin

# Login
argocd login <ARGOCD_IP> --username admin --password <PASSWORD> --insecure

# Check app status
argocd app get retail-mvp

# Manual sync if needed
argocd app sync retail-mvp
```

### Verify JWT secret is loaded correctly

```bash
# Check secret has a non-empty value
kubectl get secret retailos-secrets -n retail-app \
  -o jsonpath='{.data.jwt-key}' | base64 -d

# Confirm it is loaded inside the running container
kubectl exec -it $(kubectl get pod -l app=backend -n retail-app \
  -o jsonpath='{.items[0].metadata.name}') \
  -n retail-app -c backend -- env | grep Jwt
```

### Cost management — scale down overnight

```bash
# Scale pods to 0 + nodes to 0 = ~$0.65 overnight (Cloud SQL + static IP only)
kubectl scale deployment backend frontend -n retail-app --replicas=0
kubectl scale deployment -n monitoring --all --replicas=0
kubectl scale deployment -n argocd --all --replicas=0
gcloud container clusters resize gke-cluster --num-nodes=0 --region=us-central1-a --project=retail-mvp-prod

# Scale back up
gcloud container clusters resize gke-cluster --num-nodes=2 --region=us-central1-a --project=retail-mvp-prod
kubectl scale deployment backend frontend -n retail-app --replicas=1
```

### Rotate secrets

```bash
# Update in GCP Secret Manager
echo -n "NEW_PASSWORD" | gcloud secrets versions add prod-db-url --data-file=- --project=retail-mvp-prod
echo -n "NEW_JWT_KEY"  | gcloud secrets versions add prod-jwt-key --data-file=- --project=retail-mvp-prod

# Re-sync to Kubernetes and restart backend
DB_URL=$(gcloud secrets versions access latest --secret=prod-db-url --project=retail-mvp-prod)
JWT_KEY=$(gcloud secrets versions access latest --secret=prod-jwt-key --project=retail-mvp-prod)

kubectl create secret generic retailos-secrets \
  --from-literal=db-url="${DB_URL}" \
  --from-literal=jwt-key="${JWT_KEY}" \
  -n retail-app --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/backend -n retail-app
```

### Full teardown (destroy environment)

> ⚠️ Always follow this order — skipping steps causes VPC/NEG deletion errors.

```bash
# Step 1 — Scale down all workloads
kubectl scale deployment backend frontend -n retail-app --replicas=0
kubectl scale deployment -n monitoring --all --replicas=0
kubectl scale deployment -n argocd --all --replicas=0

# Step 2 — Uninstall Helm releases
helm uninstall retailos -n retail-app
helm uninstall kube-prometheus-stack -n monitoring

# Step 3 — Delete namespaces (lets GKE clean up NEGs and load balancers)
kubectl delete namespace retail-app monitoring argocd

# Step 4 — Scale GKE nodes to zero
gcloud container clusters resize gke-cluster \
  --num-nodes=0 --region=us-central1-a --project=retail-mvp-dev

# Step 5 — Destroy infrastructure
cd terraform-gcp/environments/dev
terraform destroy
```

If a namespace is stuck in `Terminating`:
```bash
kubectl get namespace retail-app -o json | \
  python3 -c "import sys,json; d=json.load(sys.stdin); d['spec']['finalizers']=[]; print(json.dumps(d))" | \
  kubectl replace --raw /api/v1/namespaces/retail-app/finalize -f -
```

### Fresh redeploy after teardown

```bash
# 1 — Authenticate
gcloud auth login
gcloud config set project retail-mvp-prod

# 2 — Provision infrastructure
cd terraform-gcp/environments/prod
terraform init && terraform apply

# 3 — Connect kubectl
gcloud container clusters get-credentials gke-cluster \
  --zone us-central1-a --project retail-mvp-prod

# 4 — Bootstrap secrets (pulled from Secret Manager)
kubectl create namespace retail-app
kubectl create serviceaccount gke-app-ksa -n retail-app
kubectl annotate serviceaccount gke-app-ksa -n retail-app \
  iam.gke.io/gcp-service-account=gke-app-sa@retail-mvp-prod.iam.gserviceaccount.com

DB_URL=$(gcloud secrets versions access latest --secret=prod-db-url --project=retail-mvp-prod)
JWT_KEY=$(gcloud secrets versions access latest --secret=prod-jwt-key --project=retail-mvp-prod)
kubectl create secret generic retailos-secrets \
  --from-literal=db-url="${DB_URL}" \
  --from-literal=jwt-key="${JWT_KEY}" \
  -n retail-app

# 5 — Helm deploy (CI does this automatically on push to main)
git push origin main
```

---

## ⚠️ Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `502 Bad Gateway on /api/*` | Ingress port mismatch | Ensure `servicePort: 8000` in `values.yaml` and ingress uses `.Values.backend.servicePort` |
| `IDX10703 key length zero` | JWT secret empty or missing | Recreate `retailos-secrets`, verify with `base64 -d`, delete pod to restart |
| `ImagePullBackOff` | Missing `:latest` tag in registry | Push `:latest` tag to Artifact Registry, `kubectl rollout restart deployment -n retail-app` |
| `Deployment exceeded progress deadline` | Pod failing to start | Check `kubectl describe pod` and `kubectl logs` for root cause |
| `Namespace stuck Terminating` | Stuck finalizers | Remove finalizers using `kubectl replace --raw` command above |
| `helm: command not found` | Helm not in PATH | Add `helm.exe` location to PATH, restart terminal |
| `Invalid credentials on login` | User not registered yet | Run register curl command first with `fullName` field |
| `CreateContainerConfigError` | Secret key missing | Patch secret with `kubectl patch`, verify both `db-url` and `jwt-key` keys exist |

---

## 🔑 API Reference

All endpoints return JSON with `snake_case` keys.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login, returns JWT token |
| `POST` | `/api/auth/forgot-password` | Request password reset token |
| `POST` | `/api/auth/external-login` | External OAuth login |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List all products (supports `?search=`) |
| `POST` | `/api/products` | Create a product |
| `PUT` | `/api/products/{id}` | Update a product |
| `DELETE` | `/api/products/{id}` | Delete a product |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | List all orders |
| `POST` | `/api/orders` | Create an order |
| `PUT` | `/api/orders/{id}/status` | Update order status |

### Invoices
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/invoices` | List all invoices |
| `POST` | `/api/invoices/{id}/toggle-paid` | Toggle UNPAID ↔ PAID |

### Other Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Dashboard metrics |
| `GET` | `/api/analytics/*` | Sales analytics |
| `GET/POST` | `/api/customers` | Customer CRUD |
| `GET/POST` | `/api/suppliers` | Supplier CRUD |
| `GET/POST` | `/api/purchase-orders` | Purchase order management |
| `GET/POST` | `/api/categories` | Category CRUD |
| `GET/PUT/DELETE` | `/api/users` | User management (Admin only) |
| `GET` | `/health` | Health check endpoint |

---

## 🔐 Authentication

- **Mechanism:** JWT Bearer tokens (2-hour expiry)
- **Identity:** ASP.NET Core Identity with Entity Framework stores
- **Roles:** `Admin`, `Manager`, `Cashier`, `User`
- **Flow:**
  1. `POST /api/auth/login` with email + password
  2. Receive JWT token + user info (email, full_name, role)
  3. Include `Authorization: Bearer <token>` on all subsequent requests

### Role-Based Access

| Role | Permissions |
|---|---|
| **Admin** | Full access including user management |
| **Manager** | All business operations |
| **Cashier** | Orders, invoices, products (read) |
| **User** | Read-only access |

---

## 🌱 Seed Data

On first startup the database is automatically seeded with:

| Data | Details |
|---|---|
| **Users** | `admin@retailos.com` / `Admin@123456` (Admin), `user@retailos.com` / `User@123456` (User) |
| **Categories** | Electronics, Clothing, Home |
| **Products** | Wireless Headphones, Smartphone, Running Shoes, Coffee Maker |
| **Customers** | Alice Johnson, Bob Smith |
| **Orders** | ORD-SEED-001 (Completed), ORD-SEED-002 (Pending) |
| **Invoices** | INV-SEED-001 (PAID, £798.99), INV-SEED-002 (UNPAID, £179.98) |

---

## 🧾 Entity Relationships

```
Category  ──1:N──▶  Product
Customer  ──1:N──▶  Order
Order     ──1:N──▶  OrderItem  ──N:1──▶  Product
Order     ──1:1──▶  Invoice    (cascade delete)
Supplier  ──1:N──▶  PurchaseOrder
```

---

## 📝 Key Implementation Notes

- **Decimal Precision:** All monetary fields use `decimal(18,2)`
- **Timestamps:** `CreatedAt` / `IssuedAt` default to `DateTime.UtcNow`
- **Order Status:** Pending → Processing → Completed / Cancelled
- **Order Channel:** `ONLINE` or `IN_STORE`
- **Invoice Status:** `UNPAID` or `PAID`
- **JSON Naming:** All API responses use `snake_case`
- **Circular References:** Handled via `[JsonIgnore]` + `ReferenceHandler.IgnoreCycles`
- **DB Connection:** Parsed from `DATABASE_URL` env var — injected from GCP Secret Manager via Kubernetes secret
- **Health Check:** `/health` endpoint powered by ASP.NET Core health checks middleware

---

## 🔒 Security Notes

- Service account keys are **never stored** — GCP authentication uses Workload Identity Federation
- Secrets (`db-url`, `jwt-key`) are stored in **GCP Secret Manager**, never in code or CI environment variables
- `terraform.tfvars` is **git-ignored** — contains sensitive values only
- Cloud SQL uses **private IP only** — no public internet exposure
- Cloud Armor WAF policy applied to the ingress load balancer

---

## 📄 License

Private project — not licensed for distribution.





Cluster & Nodes:
bash
kubectl get nodes
kubectl top nodes

Pods: bash

kubectl get pods -n retail-app
kubectl get pods -n retail-app -o wide
kubectl top pods -n retail-app

Logs:bash
kubectl logs -l app=backend -n retail-app -c backend --tail=20
kubectl logs -l app=frontend -n retail-app --tail=20
kubectl logs -l app=backend -n retail-app -c cloud-sql-proxy --tail=10

Ingress & Networking:bash
kubectl get ingress -n retail-app
kubectl describe ingress retail-ingress -n retail-app

Autoscaling:bash
kubectl get hpa -n retail-app

Secrets:bash
kubectl get secret retailos-secrets -n retail-app -o jsonpath="{.data}"

Database:bash
gcloud sql instances describe postgres-instance \
  --project=retail-mvp-prod \
  --format="value(state,settings.dataDiskSizeGb)"

Monitoring:bash
kubectl get pods -n monitoring
kubectl get pods -n argocd

Test API:
bash# Health
curl -s http://34.149.225.237/health

# Login as admin
curl -s -X POST http://34.149.225.237/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@retailos.com","password":"Admin@123456"}'

ArgoCD:bash
export PATH=$PATH:~/bin
argocd app get retail-mvp

Cost check:bash
kubectl top nodes
kubectl top pods -n retail-app

gcloud sql instances describe postgres-instance \
  --project=retail-mvp-prod \
  --format="value(state)"