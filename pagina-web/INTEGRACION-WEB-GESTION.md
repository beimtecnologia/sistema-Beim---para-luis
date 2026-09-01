# Integracion WebVine + Sistema de Gestion

## Decision actual

La web y el sistema de gestion deben consultar una API central y una sola base de datos.

El repositorio `binwin-web` ya tiene servidor local Node.js y esta preparado para PostgreSQL.

## Estructura local recomendada

```txt
sistema-Beim---para-luis
  pagina-web              # Web publica + API + boleta
  sistema-gestion         # Sistema de gestion
```

## Servidor local

La web/API se levanta desde:

```txt
pagina-web
```

URL local:

```txt
http://127.0.0.1:3000/beim/
```

API local:

```txt
http://127.0.0.1:3000/api/
```

## Base de datos unica

Recomendada: PostgreSQL.

Motivo: el repo `binwin-web` ya trae `db/schema.sql`, `db/seed.sql`, `db.js` y soporte para `DATABASE_URL`.

## Para activar base real local

1. Instalar PostgreSQL local.
2. Crear base `beim_local`.
3. Crear `.env` dentro de `pagina-web` con:

```env
PORT=3000
HOST=127.0.0.1
BEIM_STORAGE_MODE=postgres
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/beim_local
PGSSLMODE=disable
```

4. Ejecutar:

```powershell
psql -U postgres -d beim_local -f .\db\schema.sql
psql -U postgres -d beim_local -f .\db\seed.sql
npm start
```

## Siguiente paso tecnico

Cuando PostgreSQL este instalado, el sistema de gestion debe dejar de usar `localStorage` y empezar a consumir endpoints del servidor:

```txt
GET/POST http://127.0.0.1:3000/api/...
```

Asi la web y gestion usan la misma base.
