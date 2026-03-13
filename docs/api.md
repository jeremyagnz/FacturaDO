# FacturaDO API Reference

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.facturado.do/api/v1`
- **Swagger Docs** (non-production): `http://localhost:3000/api/docs`

## Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

---

## Endpoints

### Auth (`/auth`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Create new user | No |
| POST | `/auth/login` | Login and get tokens | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Revoke refresh tokens | Yes |
| GET | `/auth/me` | Get current user | Yes |

#### POST /auth/login

```json
Request:
{
  "email": "admin@empresa.do",
  "password": "SecurePass123!"
}

Response 200:
{
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

---

### Companies (`/companies`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/companies` | List user's companies | Yes |
| POST | `/companies` | Create company (RNC) | Yes |
| GET | `/companies/:id` | Get company detail | Yes |
| PUT | `/companies/:id` | Update company | Yes |
| DELETE | `/companies/:id` | Delete company | Admin |
| POST | `/companies/:id/users/:userId` | Add user to company | Yes |
| DELETE | `/companies/:id/users/:userId` | Remove user from company | Yes |

#### POST /companies

```json
Request:
{
  "name": "Mi Empresa SRL",
  "rnc": "130000001",
  "commercialName": "Mi Empresa",
  "taxRegime": "ordinario",
  "address": "Av. 27 de Febrero #100, Santo Domingo",
  "city": "Santo Domingo",
  "phone": "+18095551234",
  "email": "info@miempresa.do"
}
```

---

### Invoices (`/invoices`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/invoices` | List invoices (filterable) | Yes |
| POST | `/invoices` | Create e-CF invoice (draft) | Yes |
| GET | `/invoices/:id` | Get invoice detail | Yes |
| POST | `/invoices/:id/sign` | Queue digital signature | Yes |
| POST | `/invoices/:id/submit` | Submit to DGII | Yes |
| PATCH | `/invoices/:id/cancel` | Cancel invoice | Yes |

#### POST /invoices

```json
Request:
{
  "companyId": "uuid",
  "ecfType": "31",
  "issueDate": "2025-01-15",
  "buyerRnc": "130000002",
  "buyerName": "Empresa Cliente SRL",
  "paymentMethod": "credito",
  "currency": "DOP",
  "items": [
    {
      "lineNumber": 1,
      "description": "Servicio de consultoría tecnológica",
      "quantity": 10,
      "unit": "hora",
      "unitPrice": 5000,
      "taxRate": 18,
      "discountRate": 0
    }
  ]
}
```

#### e-CF Types

| Code | Name |
|------|------|
| 31 | Factura de Crédito Fiscal |
| 32 | Factura de Consumo |
| 33 | Nota de Débito |
| 34 | Nota de Crédito |
| 41 | Compras |
| 43 | Gastos Menores |
| 44 | Regímenes Especiales |
| 45 | Gubernamental |
| 46 | Exportaciones |
| 47 | Pagos al Exterior |

---

### DGII (`/dgii`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/dgii/rnc/:rnc` | Validate RNC against DGII | Yes |
| GET | `/dgii/status/:trackingId` | Check e-CF submission status | Yes |

---

### Reports (`/reports`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/reports/dashboard/:companyId` | Dashboard statistics | Yes |
| GET | `/reports/summary/:companyId` | Invoice summary | Yes |
| GET | `/reports/606/:companyId` | DGII 606 report (purchases) | Yes |
| GET | `/reports/607/:companyId` | DGII 607 report (sales) | Yes |

---

### Storage (`/storage`)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/storage/presigned-url` | Get download URL | Yes |
| POST | `/storage/presigned-upload` | Get upload URL | Yes |
| DELETE | `/storage/:key` | Delete file | Yes |

---

## Standard Response Format

All responses wrap data in a consistent envelope:

```json
{
  "data": { ... },
  "timestamp": "2025-01-15T10:30:00.000Z",
  "success": true
}
```

## Error Response Format

```json
{
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/api/v1/invoices",
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Rate Limiting

| Tier | Window | Limit |
|------|--------|-------|
| Short | 1 second | 10 req |
| Medium | 10 seconds | 50 req |
| Long | 1 minute | 200 req |
| Auth login | 1 minute | 5 req |
