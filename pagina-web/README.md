# BEIM Store

Aplicacion web local para tienda y boletas de BEIM.

## Requisitos

- Node.js
- npm
- PostgreSQL opcional, si se usa `BEIM_STORAGE_MODE=postgres`

## Instalacion

```bash
npm install
```

## Configuracion

Copiar `.env.example` a `.env` y ajustar los valores locales.

```bash
cp .env.example .env
```

Por defecto la app puede correr en modo local con:

```env
BEIM_STORAGE_MODE=local
PORT=3000
HOST=127.0.0.1
```

## Ejecutar

```bash
npm start
```

URLs principales:

- Web: `http://127.0.0.1:3000/beim/`
- Boleta: `http://127.0.0.1:3000/beim/boleta/`
- Health: `http://127.0.0.1:3000/api/health`

## Verificacion

```bash
npm run check
```
