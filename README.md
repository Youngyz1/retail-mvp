# 🛍️ RetailOS — Retail Management System

A full-stack retail management platform built with **.NET 10**, **React 18**, and **PostgreSQL**, deployed on **Google Cloud (GKE)** with a fully automated CI/CD pipeline.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start — Local Development](#-quick-start--local-development)
- [Cloud Deployment](#-cloud-deployment)
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
| **Cloud** | Google Cloud Platform — GKE, Cloud SQL, Cloud Armor, GCS, IAM, Artifact Registry |
| **IaC** | Terraform (modular) |
| **Orchestration** | Kubernetes · Helm v3 |
| **CI/CD** | GitHub Actions (Workload Identity Federation — keyless auth) |
| **GitOps** | ArgoCD |
| **Monitoring** | Prometheus + Grafana (kube-prometheus-stack) |

---

## 🗂 Project Structure

```
retail-mvp/
├── backend/                          # .NET 10 API
│   ├── Dockerfile
│   └── RetailOS.Api/
│       ├── Controllers/              # REST API controllers (11)
│       │   ├── AuthController.cs     #   Login, register, password reset
│       │   ├── ProductsController.cs #   Product CRUD + stock
│       │   ├── OrdersController.cs   #   Order lifecycle
│       │   ├── CustomersController.cs
│       │   ├── InvoicesController.cs  #   Invoice CRUD + toggle paid
│       │   ├── SuppliersController.cs
│       │   ├── PurchaseOrdersController.cs
│       │   ├── CategoriesController.cs
│       │   ├── DashboardController.cs #   Aggregated stats
│       │   ├── AnalyticsController.cs #   Charts / trends
│       │   └── UsersController.cs    #   Admin user management
│       ├── Models/                   # Domain models + auth models
│       ├── Data/                     # EF DbContext + Seeder
│       ├── Migrations/               # EF Core migrations
│       ├── Program.cs               # App entry point
│       └── appsettings.json         # Local dev config
│
├── frontend/                         # React 18 SPA
│   ├── Dockerfile
│   ├── nginx.conf                   # Production Nginx config
│   └── src/
│       ├── App.jsx                  # Router, sidebar, layout
│       ├── pages/                   # 11 page components
│       ├── components/              # ProtectedRoute, shared UI
│       ├── context/                 # AuthContext, ThemeContext
│       └── api/                     # Axios API client
│
├── helm/retailos/                    # Helm chart
│   ├── Chart.yaml
│   ├── values.yaml                  # Base/shared values
│   ├── values-dev.yaml              # Dev environment overrides
│   └── templates/                   # K8s resource templates
│
├── terraform-gcp/                    # Infrastructure as Code
│   ├── environments/dev/            # Dev environment config
│   └── modules/                     # Reusable Terraform modules
│       ├── vpc/                     #   VPC + subnets
│       ├── gke/                     #   GKE cluster + node pool
│       ├── cloudsql/                #   Cloud SQL (PostgreSQL)
│       ├── gcs/                     #   Cloud Storage bucket
│       ├── iam/                     #   Service accounts + WIF
│       └── armor/                   #   Cloud Armor WAF policy
│
├── k8s/                              # Legacy raw K8s manifests (deprecated)
├── argocd/                           # ArgoCD Application manifest
├── .github/workflows/ci.yaml        # CI/CD pipeline
└── docker-compose.yml               # Local full-stack setup
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

# Access the app
# Frontend:   http://localhost:3000
# API:        http://localhost:8000
# PostgreSQL: localhost:5432 (retail/retail123)
```

### Option 2: Run separately

**Backend:**
```bash
cd backend/RetailOS.Api
dotnet run
# API available at http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
# App available at http://localhost:3000
```

---

## ☁️ Cloud Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full cloud deployment guide.

**TL;DR:**
```bash
# 1. Provision infrastructure
cd terraform-gcp/environments/dev
terraform init && terraform apply

# 2. Get cluster credentials
gcloud container clusters get-credentials gke-cluster --region us-central1 --project retail-mvp-dev

# 3. Deploy via Helm
helm upgrade --install retailos ./helm/retailos \
  -f helm/retailos/values.yaml \
  -f helm/retailos/values-dev.yaml \
  --namespace retail-app --create-namespace
```

Or just **push to `main`** — the CI/CD pipeline handles everything automatically.

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

On first startup, the database is automatically seeded with:

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

- **Decimal Precision:** All monetary fields use `decimal(18,2)` to prevent floating-point loss
- **Timestamps:** `CreatedAt` / `IssuedAt` default to `DateTime.UtcNow`
- **Order Status:** Pending → Processing → Completed / Cancelled
- **Order Channel:** `ONLINE` or `IN_STORE`
- **Invoice Status:** `UNPAID` or `PAID`
- **JSON Naming:** All API responses use `snake_case` (configured via `JsonNamingPolicy.SnakeCaseLower`)
- **Circular References:** Handled via `[JsonIgnore]` on navigation collections + `ReferenceHandler.IgnoreCycles`

---

## 📄 License

Private project — not licensed for distribution.
