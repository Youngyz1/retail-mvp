# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RetailOS is a full-stack retail management MVP built with:
- **Backend**: .NET 10 (C#) with ASP.NET Core, Entity Framework Core, JWT authentication
- **Frontend**: React 18 with React Router for navigation and Axios for API communication
- **Database**: SQLite for local development, PostgreSQL in Docker
- **Deployment**: Docker Compose for containerized full-stack setup

## Quick Start Commands

### Backend Development
```bash
# Build the backend
cd backend/RetailOS.Api && dotnet build

# Run the backend (listens on http://localhost:5000)
dotnet run

# Clean build artifacts
dotnet clean

# Run Entity Framework migrations
dotnet ef database update
dotnet ef migrations add <MigrationName>
```

### Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Start development server (http://localhost:3000)
npm start

# Build for production
npm build
```

### Docker Development
```bash
# Start full stack (backend, frontend, PostgreSQL)
docker-compose up

# Stop and remove containers
docker-compose down
```

## Architecture Overview

### Backend Structure (`backend/RetailOS.Api/`)

**Core Layers:**
- **Controllers/** - REST API endpoints (Auth, Products, Orders, Customers, etc.)
- **Models/** - Domain models (Product, Order, Customer, Invoice, etc.) and DTOs (AuthModels)
- **Data/** - Entity Framework DbContext (AppDbContext) and database seeding (Seeder.cs)
- **Migrations/** - EF Core migration files for schema changes

**Key Features:**
- **Authentication**: JWT-based with ASP.NET Identity. Users have roles (Admin, User) and JWT tokens expire in 2 hours
- **Database Context**: `AppDbContext` extends `IdentityDbContext<ApplicationUser>`, manages all domain entities with cascade delete for Order→Invoice relationships
- **CORS**: Configured to allow any origin, header, and method for development (needs restriction in production)
- **Configuration**: Read from `appsettings.json` (development: SQLite on `app.db`) and environment variables

**Entity Relationships:**
- Products belong to Categories (1:N)
- Orders have OrderItems (1:N) and an Invoice (1:1)
- Invoices track payment status (UNPAID/PAID)
- Suppliers have PurchaseOrders (1:N)
- Customers have Orders (1:N)

### Frontend Structure (`frontend/src/`)

**Main Components:**
- **App.jsx** - Main router, sidebar navigation, auth context integration
- **pages/** - Page components (Dashboard, Products, Orders, Customers, Invoices, Suppliers, Analytics, Login, Register, UserManagement, InvoicePrint)
- **components/** - Reusable UI components (ProtectedRoute guards authenticated routes)
- **context/** - AuthContext for managing user authentication state
- **api/** - Axios-based API client for communicating with backend

**Navigation**: Left sidebar with collapsible menu includes Dashboard, Products, Orders, Customers, Invoices, Suppliers, and Analytics

## Common Development Tasks

### Adding a New API Endpoint
1. Create controller in `Controllers/` with `[Route("endpoint-name")]`
2. Add/update models in `Models/DomainModels.cs`
3. Add DbSet to `AppDbContext` if using a new entity
4. Create EF migration: `dotnet ef migrations add <Name>`
5. Add corresponding React page/component in `frontend/src/pages/`

### Database Changes
- Always use EF migrations: `dotnet ef migrations add <DescriptiveName>`
- Migrations track in `Migrations/` folder
- Local dev uses SQLite (`app.db`), Docker uses PostgreSQL
- Seeder.cs auto-runs on app startup to create roles and test data

### Authentication Flow
- Frontend sends credentials to `/auth/login` or `/auth/register`
- Backend returns JWT token + user info (email, full_name, role)
- Frontend stores token (likely in context) and includes it in `Authorization: Bearer <token>` headers
- JWT validation checks issuer, audience, lifetime, and signing key

### API Response Format
- All endpoints use snake_case in JSON responses (configured in Program.cs with JsonNamingPolicy.SnakeCaseLower)
- Related entities are serialized with `[JsonIgnore]` on navigation collections to prevent circular references

## Configuration & Environment

**Development**:
- Backend listens on `http://localhost:5000` (set in Program.cs)
- Frontend runs on `http://localhost:3000`
- SQLite database: `backend/RetailOS.Api/app.db`
- JWT Key, Issuer, Audience defined in `appsettings.json`

**Docker**:
- Frontend → Backend at `http://localhost:8000` (via `REACT_APP_API_URL` env var)
- Backend → Database at `postgresql://retail:retail123@db:5432/retail_db`
- Full stack available at `http://localhost:3000`

## Key Implementation Notes

- **Decimal Precision**: All monetary fields (Price, TotalAmount, etc.) use `decimal(18,2)` column type to prevent precision loss
- **Timestamps**: CreatedAt/IssuedAt fields default to `DateTime.UtcNow`
- **Order Status**: Values are "Pending", "Processing", "Completed", "Cancelled"; channels are "ONLINE" or "IN_STORE"
- **Invoice Status**: Values are "UNPAID" or "PAID"
- **Password Reset**: ForgotPassword endpoint generates token but doesn't email (mock implementation returns token for dev testing)
- **External Login**: Mock implementation uses the provided token as the email for local user creation
- **Stock Management**: Products have a `LowStockThreshold` (default 10) to track inventory warnings
