# Sistema de Gestión BEIM

Sistema local para taller, ventas, compras, stock y administración contable.

## Funciones principales

- Órdenes técnicas y de venta con numeración consecutiva e impresión.
- Clientes, incluyendo cliente fijo `Default` para ventas rápidas.
- Stock por subcategoría, marca y modelo, con mínimos, proveedor, garantía e historial de movimientos.
- Compras que ingresan al stock y se contabilizan como gastos.
- Ventas multiproducto con efectivo, tarjetas, transferencia y pagos combinados.
- Anulaciones y devoluciones parciales que revierten stock y contabilidad sin borrar el historial.
- Servicios técnicos precargados con búsqueda y precio automático.
- Servicios Administrativos con filtros por día, mes, año y fechas específicas.
- Caja diaria con apertura, cierre, efectivo esperado, conteo y diferencia.
- Usuarios con roles de Administrador, Vendedor, Técnico y Caja.
- Informes por período, gráficos, rentabilidad, productos vendidos, CSV e impresión/PDF.
- Respaldos automáticos en `respaldos`, descarga JSON y restauración desde Configuración.

## Primer acceso

1. Iniciar el servidor local mediante `pagina-web\start-beim-server.ps1` desde la raíz del repositorio.
2. Abrir `index.html`.
3. En modo PostgreSQL, ingresar inicialmente con `administradorprincipal` y la contraseña temporal `Admin,123`, y cambiarla antes de utilizar datos reales.
4. Desde Configuración, el administrador puede crear empleados y asignar permisos.

## Persistencia

Las órdenes, productos, servicios, usuarios, caja, auditoría y movimientos de stock utilizan PostgreSQL. Las configuraciones locales y datos operativos compatibles también se guardan en el navegador y forman parte de los respaldos automáticos.

## Verificación

Ejecutar:

```powershell
node --check app.js
node report-engine.test.js
```
