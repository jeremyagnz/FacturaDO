# FacturaDO — Guía de Instalación y Puesta en Marcha

> 🇩🇴 Guía completa en español para ejecutar la aplicación en tu entorno local.

---

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu máquina:

| Herramienta | Versión mínima | Verificar instalación |
|-------------|---------------|-----------------------|
| [Node.js](https://nodejs.org) | 20 o superior | `node -v` |
| [pnpm](https://pnpm.io) | 9 o superior | `pnpm -v` |
| [Docker](https://www.docker.com) | 24 o superior | `docker -v` |
| [Docker Compose](https://docs.docker.com/compose/) | v2 o superior | `docker compose version` |
| [Git](https://git-scm.com) | cualquier versión reciente | `git --version` |

> **Instalar pnpm** (si aún no lo tienes):
> ```bash
> npm install -g pnpm@9
> ```

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/jeremyagnz/FacturaDO.git
cd FacturaDO
```

---

## Paso 2 — Instalar las dependencias

Desde la raíz del proyecto, ejecuta:

```bash
pnpm install
```

Este comando instalará las dependencias de todos los paquetes del monorepo (`apps/api`, `apps/web` y `packages/shared`).

---

## Paso 3 — Levantar la infraestructura local (PostgreSQL + Redis)

La aplicación necesita una base de datos PostgreSQL y un servidor Redis. Se incluye un archivo `docker-compose.yml` listo para usar:

```bash
pnpm docker:dev
```

Esto levanta en segundo plano:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| PostgreSQL 16 | `5432` | Base de datos principal |
| Redis 7 | `6379` | Colas de trabajos y caché |

Verifica que los contenedores estén corriendo:

```bash
docker ps
```

Deberías ver `facturado_postgres` y `facturado_redis` con estado **Up**.

### Herramientas visuales opcionales (pgAdmin + Redis Commander)

Si quieres administrar la base de datos y Redis desde el navegador:

```bash
docker compose -f infrastructure/docker/docker-compose.yml --profile tools up -d
```

| Herramienta | URL | Credenciales |
|-------------|-----|--------------|
| pgAdmin | http://localhost:5050 | `admin@facturado.do` / `admin` |
| Redis Commander | http://localhost:8081 | _(sin contraseña)_ |

---

## Paso 4 — Configurar las variables de entorno

Copia el archivo de ejemplo y personalízalo:

```bash
cp apps/api/.env.example apps/api/.env
```

Abre `apps/api/.env` en tu editor y revisa cada sección:

### Sección: Aplicación

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api       # La API estará disponible en http://localhost:3000/api/
CORS_ORIGINS=http://localhost:5173
```

### Sección: Base de datos

Los valores por defecto coinciden con los del `docker-compose.yml` y no necesitan cambio para desarrollo local:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=facturado
DB_PASSWORD=facturado_dev
DB_DATABASE=facturado
DB_SSL=false
DB_LOGGING=true
```

### Sección: JWT (⚠️ Cambia estos valores)

```env
JWT_ACCESS_SECRET=cambia-esto-por-una-clave-secreta-de-al-menos-32-caracteres
JWT_REFRESH_SECRET=cambia-esto-por-otra-clave-secreta-de-al-menos-32-caracteres
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=facturado
JWT_AUDIENCE=facturado-api
```

> **Generar claves seguras rápidamente:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### Sección: Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=facturado:
REDIS_TTL=3600
```

### Sección: Cloudflare R2 (almacenamiento de archivos)

Para desarrollo local puedes dejar los valores de ejemplo; las funcionalidades que **sí** funcionarán sin R2 son: registro/login, gestión de empresas y creación de facturas en borrador. Las funcionalidades que **requieren** R2 para funcionar son: firma digital del XML (e-CF), generación de PDF y envío a la DGII.

```env
STORAGE_PROVIDER=r2
CF_ACCOUNT_ID=tu-cloudflare-account-id
R2_ACCESS_KEY_ID=tu-r2-access-key-id
R2_SECRET_ACCESS_KEY=tu-r2-secret-access-key
R2_BUCKET=facturado
R2_PUBLIC_URL=https://tu-dominio-personalizado.com
```

### Sección: DGII

```env
DGII_ENV=sandbox
DGII_SANDBOX_URL=https://ecf.dgii.gov.do/testecf
DGII_PRODUCTION_URL=https://ecf.dgii.gov.do
DGII_TIMEOUT=30000
DGII_RETRIES=3
```

---

## Paso 5 — Ejecutar las migraciones de la base de datos

Primero compila la API (necesario para ejecutar TypeORM desde los archivos JS compilados):

```bash
pnpm --filter @factura-do/api build
```

Luego aplica las migraciones:

```bash
pnpm db:migrate
```

Esto creará todas las tablas necesarias en PostgreSQL:

- `users`
- `refresh_tokens`
- `companies`
- `user_companies`
- `invoices`
- `invoice_items`

---

## Paso 6 — Iniciar el servidor de desarrollo

Ejecuta el siguiente comando desde la raíz del monorepo:

```bash
pnpm dev
```

Turborepo iniciará en paralelo:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| API (NestJS) | http://localhost:3000 | Backend REST |
| Swagger / Docs | http://localhost:3000/api/docs | Documentación interactiva de la API |
| Web (React + Vite) | http://localhost:5173 | Interfaz de usuario |

---

## Paso 7 — Verificar que todo funciona

### Verificar la API

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{ "status": "ok" }
```

### Verificar la interfaz web

Abre tu navegador en **http://localhost:5173**. Deberías ver la pantalla de inicio de sesión de FacturaDO.

---

## Paso 8 — Crear tu primera cuenta y hacer login

### 8.1 Registrar un usuario

Abre **http://localhost:5173/register** y completa el formulario:

| Campo | Requisito |
|-------|-----------|
| Nombre Completo | mínimo 2 caracteres |
| Correo Electrónico | formato válido (ej. `juan@empresa.do`) |
| Contraseña | mínimo 8 caracteres, al menos una mayúscula y un número |
| Confirmar Contraseña | debe coincidir con la contraseña |

También puedes registrarte directamente desde la API usando curl:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@empresa.do",
    "password": "SecurePass1"
  }'
```

### 8.2 Iniciar sesión

Después de registrarte serás redirigido automáticamente a `/login`. Ingresa tu correo y contraseña.

Al iniciar sesión correctamente:
- Recibirás un **access token** (válido 15 minutos) y un **refresh token** (válido 7 días)
- Los tokens se guardan automáticamente en `localStorage`
- Serás redirigido al **Dashboard**

### 8.3 Cómo funciona la autenticación

```
1. Registro → cuenta creada y activada automáticamente
2. Login    → recibe access token (15 min) + refresh token (7 días)
3. Rutas    → el access token se envía en cada petición como:
              Authorization: Bearer <token>
4. Expiración → el frontend renueva el token automáticamente usando
                el refresh token (sin interrumpir la sesión)
5. Logout   → revoca todos los refresh tokens en la base de datos
```

### 8.4 Acceder a la documentación interactiva de la API (Swagger)

Puedes explorar y probar todos los endpoints desde el navegador en:

**http://localhost:3000/api/docs**

Para probar endpoints protegidos en Swagger:
1. Usa `POST /auth/login` para obtener un `accessToken`
2. Haz clic en el botón **Authorize 🔒** (arriba a la derecha)
3. Ingresa: `Bearer <tu_accessToken>`
4. Ahora todos los endpoints protegidos estarán disponibles

---

## Estructura del proyecto

```
FacturaDO/
├── apps/
│   ├── api/          # Backend NestJS (TypeScript + PostgreSQL + Redis)
│   └── web/          # Frontend React + Vite + TailwindCSS
├── packages/
│   └── shared/       # Tipos y utilidades compartidas
├── infrastructure/
│   ├── docker/       # docker-compose.yml (dev) y docker-compose.prod.yml (prod)
│   ├── nginx/        # Configuración del reverse proxy
│   └── cloudflare/   # Configuración Cloudflare R2
└── docs/             # Documentación técnica (en inglés)
```

---

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia API + Web en modo desarrollo |
| `pnpm build` | Compila todos los paquetes |
| `pnpm test` | Ejecuta las pruebas de todos los paquetes |
| `pnpm lint` | Ejecuta el linter en todo el monorepo |
| `pnpm docker:dev` | Levanta PostgreSQL + Redis con Docker |
| `pnpm docker:down` | Detiene y elimina los contenedores |
| `pnpm db:migrate` | Aplica migraciones pendientes |
| `pnpm db:seed` | Carga datos de prueba en la base de datos |
| `pnpm --filter @factura-do/api dev` | Solo inicia la API |
| `pnpm --filter @factura-do/web dev` | Solo inicia el frontend |

---

## Solución de problemas frecuentes

### Error: `Cannot connect to PostgreSQL`

Asegúrate de que el contenedor de Docker esté activo:

```bash
docker ps
docker logs facturado_postgres
```

Si el puerto `5432` está ocupado por otra instancia de PostgreSQL local, cambia el mapeo en `infrastructure/docker/docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # cambia el puerto del host
```

Y actualiza `DB_PORT=5433` en `apps/api/.env`.

### Error: `Cannot connect to Redis`

```bash
docker ps
docker logs facturado_redis
```

### Error: `Migration failed` o `relation already exists`

Si las migraciones ya se ejecutaron anteriormente, puedes revertirlas y volver a ejecutarlas:

```bash
pnpm --filter @factura-do/api db:migrate:revert
pnpm db:migrate
```

### El frontend muestra errores de CORS

Verifica que `CORS_ORIGINS` en `apps/api/.env` incluya la URL del frontend:

```env
CORS_ORIGINS=http://localhost:5173
```

---

## Documentación adicional (en inglés)

- [Arquitectura del sistema](docs/architecture.md)
- [Referencia de la API](docs/api.md)
- [Guía de despliegue en producción](docs/deployment.md)
