# FacturaDO Deployment Guide

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose
- Cloudflare account (R2 storage)
- Netlify account (frontend hosting)

---

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/jeremyagnz/FacturaDO.git
cd FacturaDO
pnpm install
```

### 2. Start infrastructure services

```bash
pnpm docker:dev
# Starts: PostgreSQL (5432) + Redis (6379)

# Optional dev tools (pgAdmin + Redis Commander):
docker compose -f infrastructure/docker/docker-compose.yml --profile tools up -d
```

### 3. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your settings
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start development servers

```bash
pnpm dev
# Starts: API (localhost:3000) + Web (localhost:5173)
```

---

## Environment Variables (API)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` / `production` |
| `PORT` | No | API port (default: 3000) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_USERNAME` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_DATABASE` | Yes | PostgreSQL database name |
| `JWT_ACCESS_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | JWT refresh secret (min 32 chars) |
| `REDIS_HOST` | Yes | Redis host |
| `CF_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret key |
| `R2_BUCKET` | Yes | R2 bucket name |
| `DGII_ENV` | No | `sandbox` or `production` |

---

## Production Deployment

### API Deployment (Docker)

```bash
# Build and start production stack
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Run migrations
docker compose exec api node dist/database/data-source.js migration:run

# Check logs
docker compose logs -f api
```

### Frontend Deployment (Netlify)

1. Connect the repository to Netlify
2. Set build settings (auto-detected from `netlify.toml`)
3. Configure environment variables in Netlify dashboard:
   - `VITE_API_URL=https://api.facturado.do/api/v1`
4. Deploy triggers automatically on push to `main`

### Cloudflare R2 Setup

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate
wrangler login

# Create bucket
wrangler r2 bucket create facturado

# Configure CORS (for pre-signed uploads)
wrangler r2 bucket cors put facturado --rules '[
  {
    "AllowedOrigins": ["https://app.facturado.do"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]'
```

### Cloudflare CDN Configuration

1. Add your domain to Cloudflare
2. Enable proxy (orange cloud) for both API and app subdomains
3. Configure Page Rules:
   - `/api/*` → Cache Level: Bypass
   - `/assets/*` → Cache Level: Cache Everything, Edge TTL: 1 year
4. Configure SSL/TLS: Full (strict)

---

## DGII Certificate Setup

1. Obtain a digital certificate from a DGII-approved CA
2. Convert to PKCS#12 format if needed:
   ```bash
   openssl pkcs12 -export -out cert.p12 -inkey private.key -in certificate.crt
   ```
3. Upload to secure storage (not R2 public bucket)
4. Set path and password in company settings via API

---

## Health Checks

- API health: `GET /api/health`
- Database: Checked via TypeORM connection
- Redis: Checked via BullMQ connection

---

## Monitoring

Recommended stack:
- **Logs**: Pino (structured JSON logs) → Logtail or Datadog
- **Metrics**: Node.js metrics → Prometheus + Grafana
- **Errors**: Sentry for error tracking
- **Uptime**: Checkly or Better Uptime

---

## Security Checklist

- [ ] Change all default JWT secrets in production
- [ ] Enable `DB_SSL=true` for managed PostgreSQL
- [ ] Set `REDIS_PASSWORD` in production
- [ ] Configure Cloudflare WAF rules
- [ ] Enable rate limiting in Nginx config
- [ ] Keep `DGII_ENV=sandbox` until DGII certification is complete
- [ ] Rotate R2 access keys periodically
- [ ] Enable PostgreSQL connection encryption
