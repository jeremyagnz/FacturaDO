# FacturaDO — Architecture Documentation

## Overview

FacturaDO is a multi-tenant SaaS platform for Electronic Invoice management in the Dominican Republic, compliant with DGII's e-CF (Comprobante Fiscal Electrónico) standard.

---

## 1. Folder Structure

```
FacturaDO/
├── apps/
│   ├── api/                          # NestJS Backend (Node.js + TypeScript)
│   │   ├── src/
│   │   │   ├── main.ts               # Application entry point
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── config/               # Configuration (app, db, jwt, redis, storage, dgii)
│   │   │   ├── database/             # Base entity, data-source, migrations
│   │   │   ├── common/               # Shared guards, decorators, interceptors, filters
│   │   │   │   ├── guards/           # JwtAuthGuard, RolesGuard, CompanyAccessGuard
│   │   │   │   ├── decorators/       # @CurrentUser, @Roles
│   │   │   │   ├── interceptors/     # LoggingInterceptor, TransformInterceptor
│   │   │   │   └── filters/          # HttpExceptionFilter
│   │   │   └── modules/
│   │   │       ├── auth/             # JWT authentication, refresh tokens
│   │   │       ├── companies/        # Multi-RNC company management
│   │   │       ├── invoices/         # e-CF invoice management
│   │   │       ├── signature/        # Digital signature (XAdES-BES, PKCS#12)
│   │   │       ├── dgii/             # DGII API integration
│   │   │       ├── reports/          # Dashboard stats, 606/607 reports
│   │   │       ├── jobs/             # BullMQ background job processors
│   │   │       └── storage/          # Cloudflare R2 file storage
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # React Frontend (Vite + TailwindCSS + shadcn/ui)
│       ├── src/
│       │   ├── main.tsx              # React entry point
│       │   ├── App.tsx               # Router configuration
│       │   ├── index.css             # Tailwind + CSS variables
│       │   ├── components/
│       │   │   └── layout/           # AppLayout, AuthLayout
│       │   ├── pages/
│       │   │   ├── auth/             # LoginPage, RegisterPage
│       │   │   ├── dashboard/        # DashboardPage (charts, stats)
│       │   │   ├── companies/        # CompaniesPage (Multi-RNC management)
│       │   │   ├── invoices/         # InvoicesPage, CreateInvoicePage, InvoiceDetailPage
│       │   │   ├── reports/          # ReportsPage (606/607 DGII)
│       │   │   └── settings/         # SettingsPage
│       │   ├── services/             # API client, auth/companies/invoices/reports services
│       │   ├── store/                # Zustand auth store
│       │   ├── types/                # TypeScript types (auth, company, invoice, reports)
│       │   └── lib/                  # utils.ts (cn, formatCurrency, formatRnc)
│       ├── Dockerfile
│       ├── index.html
│       ├── package.json
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── packages/
│   └── shared/                       # Shared types, utils, constants
│       └── src/
│           ├── types/                # ECF types, common types
│           ├── utils/                # RNC validation, ECF number generation
│           └── constants/            # DGII constants, ITBIS rates
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml        # Development services (PostgreSQL + Redis)
│   │   └── docker-compose.prod.yml   # Production stack
│   ├── nginx/
│   │   ├── nginx.conf                # Reverse proxy, TLS, rate limiting
│   │   └── spa.conf                  # SPA fallback for React app
│   └── cloudflare/
│       └── wrangler.toml             # R2 storage configuration
│
├── docs/                             # Architecture documentation
├── netlify.toml                      # Netlify deployment + CDN headers
├── package.json                      # pnpm workspace root
├── pnpm-workspace.yaml               # Workspace packages
└── turbo.json                        # Turborepo pipeline
```

---

## 2. Microservice Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE CDN                               │
│              (DDoS protection, caching, edge network)                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Netlify (web app) │
                    │  React + Vite SPA  │
                    └─────────┬─────────┘
                              │ HTTPS (API calls)
                    ┌─────────▼─────────┐
                    │   Nginx Reverse    │
                    │      Proxy         │
                    │  (TLS + Rate Limit)│
                    └─────────┬─────────┘
                              │
          ┌───────────────────▼──────────────────────┐
          │              NestJS API                   │
          │                                           │
          │  ┌─────────┐  ┌──────────┐  ┌─────────┐ │
          │  │  Auth   │  │Companies │  │Invoices │ │
          │  │ Module  │  │  Module  │  │ Module  │ │
          │  └─────────┘  └──────────┘  └────┬────┘ │
          │                                   │      │
          │  ┌─────────┐  ┌──────────┐  ┌────▼────┐ │
          │  │Signature│  │  DGII    │  │  Jobs  │ │
          │  │ Module  │  │ Module   │  │ Module  │ │
          │  └─────────┘  └──────────┘  └────┬────┘ │
          │                                   │      │
          │  ┌─────────┐  ┌──────────┐        │      │
          │  │ Reports │  │ Storage  │        │      │
          │  │ Module  │  │ Module   │        │      │
          │  └─────────┘  └──────────┘        │      │
          └───────────────────────────────────┼──────┘
                    │                         │
           ┌────────▼──────┐        ┌─────────▼──────┐
           │  PostgreSQL   │        │    Redis +      │
           │  (TypeORM)    │        │    BullMQ       │
           └───────────────┘        └────────────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │     Background Workers      │
                              │  • InvoiceProcessor         │
                              │  • DgiiStatusProcessor      │
                              └─────────────┬──────────────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │  External Services          │
                              │  • DGII API (e-CF submit)   │
                              │  • Cloudflare R2 (files)    │
                              └────────────────────────────┘
```

---

## 3. Database Architecture

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles (super_admin, admin, accountant, viewer) |
| `refresh_tokens` | JWT refresh token store (revocable) |
| `companies` | Companies/RNCs (multi-tenant) |
| `user_companies` | Many-to-many junction: users ↔ companies |
| `invoices` | e-CF electronic invoices |
| `invoice_items` | Line items per invoice |

### Entity Relationships

```
users ←──── user_companies ────→ companies
  │                                   │
  └── refresh_tokens          invoices (company_id FK)
                                   │
                              invoice_items (invoice_id FK)
```

### Key Database Design Decisions

1. **Multi-tenancy**: Each company has its own `rnc`. Users are linked to companies via `user_companies`.
2. **Soft deletes**: All entities have `deleted_at` for audit trails.
3. **UUID primary keys**: UUIDs prevent enumeration attacks.
4. **JSONB columns**: `metadata`, `dgii_response`, `settings` use JSONB for flexible storage.
5. **Partial unique index**: `invoices(company_id, ecf_number) WHERE ecf_number IS NOT NULL` allows drafts without NCF.
6. **PostgreSQL enums**: Used for type safety at the DB level for statuses and types.

---

## 4. Authentication System

### Flow

```
1. User registers → password hashed with bcrypt (12 rounds)
2. User logs in → receives:
   - Access Token (JWT, 15min expiry)
   - Refresh Token (JWT, 7 days, stored in DB)
3. API requests → Bearer token in Authorization header
4. Token expiry → automatic refresh via axios interceptor
5. Logout → all refresh tokens revoked in DB
```

### Multi-Tenant Authorization

```typescript
// JWT Payload
{
  sub: "user-uuid",
  email: "user@empresa.do",
  role: "admin",
  companyIds: ["company-uuid-1", "company-uuid-2"]
}
```

Guards:
- `JwtAuthGuard` — validates JWT token
- `RolesGuard` — checks user role (super_admin > admin > accountant > viewer)
- `CompanyAccessGuard` — ensures user can only access their companies

---

## 5. Background Job Architecture

### Queues (BullMQ / Redis)

| Queue | Jobs | Description |
|-------|------|-------------|
| `invoices` | `sign-invoice` | Signs XML with PKCS#12 certificate |
| `invoices` | `submit-to-dgii` | Sends signed e-CF to DGII |
| `invoices` | `generate-pdf` | Generates PDF representation |
| `dgii-status` | `check-status` | Polls DGII for acceptance status |

### Job Flow

```
Invoice Created (DRAFT)
    │
    ▼
[sign-invoice job]
    │ 1. Load company certificate (P12)
    │ 2. Build e-CF XML
    │ 3. Sign XML (XAdES-BES / SHA-256 / RSA)
    │ 4. Upload signed XML to R2
    │ 5. Update invoice status → SIGNED
    │
    ▼
[submit-to-dgii job]
    │ 1. Download signed XML from R2
    │ 2. POST to DGII API
    │ 3. Receive tracking ID
    │ 4. Update invoice status → SUBMITTED
    │
    ▼
[check-status job] (polled)
    │ 1. GET status from DGII by tracking ID
    │ 2. If accepted: status → ACCEPTED, save NCF
    │ 3. If rejected: status → REJECTED, save reason
```

### Job Configuration

- **Retry strategy**: Exponential backoff (3 attempts, 1s/2s/4s)
- **Completed jobs kept**: 100
- **Failed jobs kept**: 50
- **Priority**: sign (1) > submit (2) > status-check (5)

---

## 6. Storage Architecture

### Cloudflare R2

All files are stored in Cloudflare R2 (S3-compatible):

```
facturado/
├── invoices/
│   └── {companyId}/
│       └── {invoiceId}/
│           ├── ecf.xml          # Signed e-CF XML
│           └── invoice.pdf      # PDF representation
├── companies/
│   └── {companyId}/
│       └── logo.png             # Company logo
└── certificates/
    └── {companyId}/
        └── cert.p12             # PKCS#12 certificate (encrypted)
```

### Access Patterns

- **Server-side upload**: API uploads files after signing/generating
- **Pre-signed URLs**: API generates temporary pre-signed URLs for:
  - Client downloads (expires in 1 hour)
  - Client direct uploads (expires in 5 minutes)
- **Public URL**: Via Cloudflare CDN for logos and public assets

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API Framework** | NestJS 10 | Modular, DI, decorators |
| **Language** | TypeScript 5.7 | Type safety |
| **Database** | PostgreSQL 16 | Primary data store |
| **ORM** | TypeORM | Entity management, migrations |
| **Cache/Queue** | Redis 7 | Session cache, job queues |
| **Job Queue** | BullMQ | Background job processing |
| **Auth** | JWT + Passport | Stateless auth + refresh |
| **API Docs** | Swagger/OpenAPI | Auto-generated from decorators |
| **Frontend** | React 18 + Vite | Fast SPA |
| **UI Library** | TailwindCSS + shadcn/ui | Design system |
| **State** | Zustand | Minimal global state |
| **Data Fetching** | TanStack Query | Server state management |
| **Forms** | React Hook Form + Zod | Type-safe form validation |
| **Storage** | Cloudflare R2 | S3-compatible file storage |
| **CDN** | Cloudflare | Edge caching + DDoS |
| **Hosting** | Netlify | Frontend deployment + previews |
| **Monorepo** | pnpm + Turborepo | Workspace + build pipeline |
| **Containers** | Docker + Docker Compose | Local dev + production |
| **Reverse Proxy** | Nginx | TLS termination, rate limiting |
