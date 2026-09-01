# BEIM: sistema de gestión y página web

Repositorio completo de BEIM. Incluye el sistema interno de gestión, la página web pública, la API local y los scripts de base de datos.

## Estructura

```text
sistema-Beim---para-luis/
├── sistema-gestion/   # Gestión de taller, ventas, stock, caja e informes
└── pagina-web/        # Web pública, API Node.js, boletas y PostgreSQL
```

El servidor de `pagina-web` escucha por defecto en el puerto `3000`. El sistema de gestión consume su API en `http://127.0.0.1:3000/api/gestion`.

## Requisitos

- Windows 10/11, macOS o Linux.
- [Node.js](https://nodejs.org/) 18 o posterior (incluye npm).
- Un navegador moderno.
- PostgreSQL 14 o posterior únicamente si se quiere persistencia compartida en base de datos. Para una prueba básica puede usarse el modo local.

Para comprobar la instalación:

```powershell
node --version
npm --version
```

## Instalación rápida (modo local)

1. Clonar el repositorio y entrar en la carpeta:

   ```powershell
   git clone https://github.com/beimtecnologia/sistema-Beim---para-luis.git
   cd sistema-Beim---para-luis
   ```

2. Instalar las dependencias del servidor:

   ```powershell
   cd pagina-web
   npm install
   ```

3. Crear la configuración local a partir del ejemplo:

   ```powershell
   Copy-Item .env.example .env
   ```

   En macOS o Linux se puede usar `cp .env.example .env`.

4. Verificar que `.env` contenga como mínimo:

   ```env
   PORT=3000
   HOST=127.0.0.1
   BEIM_STORAGE_MODE=local
   ```

5. Iniciar la página web y la API:

   ```powershell
   npm start
   ```

6. Abrir en el navegador:

   - Página web: `http://127.0.0.1:3000/beim/`
   - Boletas: `http://127.0.0.1:3000/beim/boleta/`
   - Estado de la API: `http://127.0.0.1:3000/api/health`

7. Abrir `sistema-gestion/index.html` en el navegador. En Windows también puede ejecutarse desde la raíz:

   ```powershell
   Start-Process .\sistema-gestion\index.html
   ```

El servidor debe permanecer abierto mientras se usa la integración entre el sistema y la web.

## Inicio rápido en Windows

Después de ejecutar `npm install` y crear `.env`, también puede iniciarse el servidor con:

```powershell
cd pagina-web
.\start-beim-server.ps1
```

El script evita iniciar una segunda instancia si el puerto 3000 ya está ocupado.

## Instalación con PostgreSQL

PostgreSQL permite que la web y el sistema de gestión utilicen una base de datos central.

1. Instalar PostgreSQL y crear una base llamada `beim_local`.
2. Desde `pagina-web`, crear `.env` desde `.env.example` y configurar:

   ```env
   PORT=3000
   HOST=127.0.0.1
   BEIM_STORAGE_MODE=postgres
   DATABASE_URL=postgresql://postgres:TU_CONTRASENA@127.0.0.1:5432/beim_local
   PGSSLMODE=disable
   ```

3. Aplicar el esquema y los datos iniciales:

   ```powershell
   cd pagina-web
   psql -U postgres -d beim_local -f .\db\schema.sql
   psql -U postgres -d beim_local -f .\db\seed.sql
   ```

4. Iniciar el servidor:

   ```powershell
   npm start
   ```

No se debe subir el archivo `.env`: contiene configuración local y puede incluir credenciales. El repositorio incluye únicamente `.env.example`.

## Primer acceso al sistema de gestión

1. Confirmar que la API responde en `http://127.0.0.1:3000/api/health`.
2. Abrir `sistema-gestion/index.html`.
3. En modo PostgreSQL, la instalación actual crea el usuario inicial `administradorprincipal` con la contraseña temporal `Admin,123`.
4. Cambiar la contraseña temporal antes de usar el sistema en una red o con datos reales.
5. Desde Configuración se pueden administrar empleados, roles y permisos.

Los respaldos generados por la API se guardan en `sistema-gestion/respaldos/`. Esa carpeta está excluida de Git para evitar publicar datos operativos.

## Verificación del proyecto

Comprobar la sintaxis de la página web y el servidor:

```powershell
cd pagina-web
npm run check
```

Ejecutar la prueba del sistema de gestión desde la raíz:

```powershell
node --test .\sistema-gestion\report-engine.test.js
```

## Solución de problemas

- **El puerto 3000 ya está en uso:** cerrar la instancia anterior o cambiar `PORT` en `.env`. Si se cambia el puerto, también deben actualizarse `BEIM_WEBSITE_URL` y `GESTION_API_URL` en `sistema-gestion/app.js`.
- **La gestión funciona en modo local:** si la API o PostgreSQL no están disponibles, algunas funciones conservan datos en el navegador. Para compartir datos entre módulos, usar PostgreSQL.
- **PowerShell bloquea el script:** ejecutar el servidor directamente con `npm start`.
- **Error de conexión a PostgreSQL:** revisar `DATABASE_URL`, que el servicio esté iniciado y que el esquema haya sido aplicado.

## Documentación adicional

- [Sistema de gestión](sistema-gestion/README.md)
- [Página web](pagina-web/README.md)
- [PostgreSQL local](pagina-web/POSTGRES-LOCAL.md)
- [Integración web y gestión](pagina-web/INTEGRACION-WEB-GESTION.md)
