# PostgreSQL local para Beim

Esta base deja la web preparada para crecer en local y luego pasar a deploy con el menor cambio posible.

## 1. Instalar PostgreSQL

- Instala PostgreSQL en tu PC.
- Crea una base llamada `beim_local`.
- Mantén un usuario simple para desarrollo, por ejemplo `postgres`.

## 2. Preparar variables

- Copia `.env.example` como `.env`.
- Si quieres seguir con la web actual mientras migramos, deja:

```env
BEIM_STORAGE_MODE=local
```

- Cuando quieras probar conexion real PostgreSQL, cambia a:

```env
BEIM_STORAGE_MODE=postgres
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/beim_local
```

## 3. Instalar dependencia

Dentro de `D:\WEB\beim`:

```powershell
npm install
```

## 4. Crear esquema

Ejemplo con `psql`:

```powershell
psql -U postgres -d beim_local -f .\db\schema.sql
psql -U postgres -d beim_local -f .\db\seed.sql
```

## 5. Arrancar servidor

```powershell
npm start
```

## 6. Verificar salud

Abre:

- `http://127.0.0.1:3000/beim/`
- `http://127.0.0.1:3000/api/health`

## 7. Estado actual

- El proyecto ya esta funcionando en modo `postgres`.
- `usuarios`, `aprobaciones`, `productos`, `categorias`, `settings`, `hero`, `pedidos` y `order_items` ya usan PostgreSQL.
- `localStorage` quedo reducido a la sesion minima del usuario y al recordatorio opcional del login.

## 8. Camino recomendado

1. Pulir seguridad y validaciones
2. Consolidar scripts de respaldo y restauracion
3. Mejorar auditoria y logs administrativos
4. Preparar entorno de deploy con las mismas variables
5. Hacer deploy usando esta misma estructura
