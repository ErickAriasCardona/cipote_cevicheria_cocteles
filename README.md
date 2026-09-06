# Cipote Ceviche Cocteles

Sistema POS (punto de venta) y administrativo para el negocio "Cipote Ceviche Cocteles": apertura/cierre de caja, ventas con pago simple o mixto, control de inventario por receta, gastos operativos y reportes de ventas. Dos roles operativos: **Cajero** y **Administrador**.

## Estado actual (2026-09-06)

**10 de 10 bloques del MVP construidos, verificados y desplegados (MVP 1.0 100% completado).** Desplegado en: **https://app-erick-arias-projects.vercel.app/** — ⚠️ actualmente detrás de **Vercel Deployment Protection** (exige cuenta de Vercel con acceso al proyecto; verificado con navegador real, la redirección real es a `vercel.com/sso-api`, no al login de la app). Desactivarlo en Project Settings → Deployment Protection de Vercel si se necesita acceso público (relevante para la landing con carrito → WhatsApp de BD-11). El rediseño de UI ("Liquid Glass", BD-11) ya está construido y desplegado — no toca lógica de negocio ni RLS. **Post-MVP (2026-09-06):** categorización de productos (`ceviche`/`bebida`/`otro`) y stock mínimo de insumos con alerta de bajo stock. Hay además una tercera tanda de cambios en curso, todavía sin commitear (eliminar productos/usuarios, categorización de insumos vaso, conteo general de apertura/cierre) — no reflejada en esta documentación hasta que Vulcano la cierre.

La documentación funcional/técnica completa (arquitectura, reglas de negocio, modelo de datos, backlog, matriz de desarrollo por bloque) vive en `DOCUMENTACION/` — un vault de Obsidian con su propio repositorio git, deliberadamente fuera de este repo (ver `.gitignore`). Empezar por `DOCUMENTACION/README.md`.

## Stack técnico

- **Frontend:** React 19 + TypeScript, Vite, React Router 7, `oxlint`.
- **Backend:** Supabase — PostgreSQL + PostgREST + Auth + Edge Functions (Deno/TypeScript).
- **Hosting:** Vercel (frontend) + Supabase (backend gestionado).
- Toda la lógica de negocio crítica (cálculos, validaciones, transiciones de estado) vive en servicios TypeScript o Edge Functions — nunca en triggers ni funciones SQL.

## Estructura del repositorio

```
.
├── app/                  # Frontend (React + TypeScript + Vite)
│   ├── src/
│   ├── scripts/          # auditoria-rls.ts — auditoría de seguridad RLS end-to-end (BD-10)
│   └── package.json
├── supabase/
│   ├── migrations/       # Migraciones SQL, en orden (23 hasta ahora)
│   ├── functions/        # Edge Functions (Deno): registrar-venta, cerrar-caja,
│   │                     #   actualizar-estado-transferencia, eliminar-restablecer-venta, crear-usuario
│   └── config.toml
├── CREDENCIALES_LOCAL.md # Gitignored — credenciales de prueba del entorno local, nunca commitear
└── DOCUMENTACION/        # Vault de Obsidian, repo git independiente (gitignored aquí)
```

## Requisitos previos

- Node.js 20+ y npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para levantar el stack local de Supabase)
- Supabase CLI — no requiere instalación global, se usa vía `npx supabase`

## Puesta en marcha local

1. Levantar Docker Desktop.
2. Desde la raíz del proyecto, levantar el stack local de Supabase (aplica las migraciones automáticamente):
   ```bash
   npx supabase start
   ```
3. Configurar el frontend:
   ```bash
   cd app
   npm install
   cp .env.example .env.local
   ```
   Completar `.env.local` con la `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` que imprime `supabase start` (en local: `http://127.0.0.1:54321` + el `anon key` del stack local).
4. Arrancar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Disponible en `http://localhost:5173`.
5. Crear un usuario de prueba (Administrador o Cajero) vía la Auth Admin API local, o usar las credenciales ya documentadas en `CREDENCIALES_LOCAL.md` (no versionado, solo en el entorno local de desarrollo).

## Scripts disponibles (`app/`)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite con HMR |
| `npm run build` | `tsc -b` + build de producción |
| `npm run lint` | Lint con `oxlint` |
| `npm run preview` | Sirve el build de producción localmente |
| `npx tsx scripts/auditoria-rls.ts` | Audita la matriz de acceso RLS real (tablas × roles × acciones) contra el stack de Supabase activo |

## Seguridad y roles

Modelo de autorización 100% server-side vía políticas RLS estáticas (`fn_check_permission`) — nunca se confía en lógica de permisos del cliente. El Cajero opera sobre caja/ventas/transferencias sin ver información financiera agregada, inventario detallado ni resultados de cierre antes de guardarlos; el Administrador gestiona catálogos, usuarios, gastos, reportes y puede eliminar/restablecer ventas con trazabilidad completa. Detalle exacto de cada política en `DOCUMENTACION/Knowledge/02_DATOS/RLS/`.

## Despliegue

- **Frontend:** Vercel (`app/vercel.json`), framework Vite, variables de entorno `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` configuradas en el dashboard de Vercel — nunca en el repo. **Desplegado en:** https://app-erick-arias-projects.vercel.app/ (⚠️ con Vercel Deployment Protection activa — ver nota de estado arriba).
- **Backend:** proyecto Supabase gestionado (cloud). Migraciones y Edge Functions se despliegan vía Supabase CLI contra el proyecto remoto.
- La `service_role key` de Supabase nunca se expone al frontend; solo la usan las Edge Functions en su entorno de ejecución seguro.
- Auditoría de seguridad end-to-end (`npx tsx scripts/auditoria-rls.ts`, BD-10.2): 22/22 pruebas PASS re-verificadas en vivo.
