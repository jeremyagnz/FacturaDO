# FacturaDO

> 🇩🇴 **Sistema de Facturación Electrónica (e-CF) para República Dominicana**  
> Full-stack SaaS platform compliant with DGII e-CF standard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://typescriptlang.org)

---

## Features

- 🏢 **Multi-company (Multi-RNC)** — Manage multiple companies per account
- 📄 **e-CF Electronic Invoices** — All DGII e-CF types (31, 32, 33, 34, 41, 43, 44, 45, 46, 47)
- 🔏 **Digital Signature** — XAdES-BES with PKCS#12 certificates
- 🏛️ **DGII Integration** — Submit, validate RNC, check status
- 📊 **Reports** — DGII 606/607 reports, dashboard analytics
- 🔄 **Background Jobs** — BullMQ workers for async signing and submission
- ☁️ **Cloudflare R2** — Secure XML/PDF storage
- 🔒 **Multi-tenant Auth** — JWT with role-based access control

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript + PostgreSQL |
| Frontend | React + Vite + TailwindCSS + shadcn/ui |
| Queue | BullMQ + Redis |
| Storage | Cloudflare R2 |
| Hosting | Netlify (web) + Docker (API) |
| CDN | Cloudflare |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
pnpm docker:dev

# Configure environment
cp apps/api/.env.example apps/api/.env

# Run migrations
pnpm db:migrate

# Start development
pnpm dev
```

## Documentation

- 🇩🇴 [Guía de Instalación en Español](LEEME.md)
- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## Project Structure

```
FacturaDO/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Shared types & utilities
├── infrastructure/   # Docker, Nginx, Cloudflare configs
└── docs/             # Documentation
```