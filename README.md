# Verde Sur - Sistema de gestión comercial

Proyecto grupal del segundo parcial de Programación IV. El estado de cumplimiento y las tareas pendientes se detallan al final de este documento.


## Integrantes

| Integrante | Legajo |
| --- | --- |
| Facundo Murillo | 63286 |
| Santiago Thomas | 55546 |
| Matias Molina | 63284 |

## Publicación

- Repositorio: https://github.com/matiasmol21/2DO-Parcial-Programacion-IV
- Aplicación pública en Vercel: **pendiente de publicar y validar**.

## Estado actual

Incluye Next.js, TypeScript, Tailwind, componentes de interfaz, Drizzle y conexión a SQLite/libSQL; inicio de sesión con cookie firmada y contraseñas con bcrypt; administración de usuarios y categorías; catálogo y movimientos de stock; clientes, cuenta corriente y pagos; facturas; y tablero con Chart.js. Los importes se guardan en centavos.

Revisión basada en el [enunciado oficial del segundo parcial](https://github.com/AlejandroDiBattista/tup26-p4/blob/main/requerimientos.md). El estado detallado y los faltantes se mantienen en [ESTADO_PROYECTO.md](ESTADO_PROYECTO.md).

La API devuelve listas paginadas para productos, clientes, usuarios, facturas y movimientos de stock; permite cargar stock inicial y devuelve el detalle completo de las facturas. Las fichas permiten editar categorías de productos y documentos de clientes, consultar movimientos y ver las últimas facturas. La carga inicial prepara 2 usuarios, 5 categorías, 30 productos, 10 clientes y, si aún no hay facturas, 50 ventas de ejemplo.

Quedan aspectos para revisar antes de entregar: terminar la pasada visual, comprobar cada requerimiento y formato de la API contra el enunciado y verificar los formularios y errores junto a cada campo. La publicación y validación en Vercel y Turso sigue pendiente. Ver [ESTADO_PROYECTO.md](ESTADO_PROYECTO.md) para la lista de tareas del grupo.

La anulación de una factura a cuenta se rechaza actualmente si, al restar su importe de la deuda total, dejaría al cliente con saldo a favor. Por ejemplo: venta de $10.000, pago de $4.000, deuda de $6.000; anular la venta por $10.000 produciría un saldo de −$4.000. El enunciado pide revertir la factura completa y también dice que no se admiten saldos a favor, pero no especifica cómo registrar una devolución del dinero. La restricción es provisional y debe confirmarse con el profesor. Los pagos se registran contra la cuenta del cliente, no contra una factura determinada: si hay otras deudas, la anulación puede aceptarse cuando el saldo total alcance para absorberla.

## Instalación local prevista

Requiere Node.js y pnpm. En PowerShell, desde esta carpeta:

```powershell
pnpm install
Copy-Item .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

En esta computadora se instaló con npm, porque pnpm no está disponible. Para volver a abrir la versión ya inicializada, ejecutá `npm run dev`. Si se instala desde cero con npm, los comandos equivalentes son `npm install`, `Copy-Item .env.example .env`, `npm run db:migrate`, `npm run db:seed` y `npm run dev`.

Abrir http://localhost:3000. Usuarios de prueba: `admin@ejemplo.com` / `Admin1234` y `vendedor@ejemplo.com` / `Vendedor1234`. Estas contraseñas son solo para práctica; cambiarlas antes de publicar. El archivo `.env` no debe subirse al repositorio. Para Turso se usarán `DATABASE_URL` y `DATABASE_AUTH_TOKEN`; cambiar también `SESSION_SECRET` por un valor secreto y aleatorio.

## Para estudiar

- `db/schema.ts`: tablas y relaciones; precios en centavos.
- `lib/session.ts` y `lib/services/auth.ts`: sesión, consulta de usuario activo y contraseñas.
- `lib/services/productos.ts`: validación y permisos del catálogo.
- `lib/services/clientes.ts`, `pagos.ts`, `facturas.ts` y `stock.ts`: reglas de cuenta corriente, ventas y movimientos.
- `app/api`: adaptadores HTTP.
- `components` y `app`: pantallas y estructura visual.

El documento divide el trabajo en cuatro hitos: base y productos, clientes, ventas y cierre. Conviene probar y comprender cada etapa antes de avanzar.

Para ejecutar la prueba del flujo comercial en una base temporal aislada: `npm run test:flujo`.

Para probar las rutas HTTP con datos descartables, ejecutá en PowerShell:

```powershell
$env:NEXT_BUILD_DIR = '.next-build'
npm run build
npm run test:api
```

La prueba crea una base temporal, comprueba las rutas de autenticación, permisos, usuarios, productos, clientes, stock, pagos, facturas y tablero, y la elimina al terminar. Incluye casos de concurrencia y reglas de error; no usa `local.db`. `test:flujo` también comprueba ventas y pagos simultáneos, incluyendo una escritura posterior para detectar bloqueos.

Los cambios de tablas se aplican con `npm run db:migrate` o `pnpm run db:migrate`. La migración más reciente agrega la observación de movimientos y los datos de anulación conservando los registros existentes. Las facturas anuladas antes de esta migración pueden no tener usuario y fecha de anulación registrados.

## Cierre de consignas

La pantalla `/clientes/saldos` está implementada y el menú incluye su acceso. Los listados de clientes y facturas aplican filtros y paginación en la base de datos. Nueva venta permite usar Enter para agregar un producto o pasar al selector de pago. En la verificación local del 22/11/2026 pasaron el build, las pruebas de flujo y las pruebas API; estas últimas también validan los mínimos de datos del seed.

Antes de entregar, completá la revisión visual y arquitectónica, el cotejo final de la API, la consulta al profesor sobre anulaciones con pagos previos, la publicación y prueba en Vercel/Turso y la preparación de la defensa. Ver ESTADO_PROYECTO.md.
## Publicación pendiente

La consigna requiere un repositorio de GitHub, una base Turso y un proyecto Vercel. La aplicación utiliza `DATABASE_URL` para elegir la base (por ejemplo, `file:local.db` en desarrollo o una URL `libsql://` en Turso) y `DATABASE_AUTH_TOKEN` para autenticar la base remota. Cargá también un `SESSION_SECRET` único y secreto en Vercel. Aplicá la migración y cargá datos iniciales contra la base remota antes de comprobar los recorridos sobre la URL pública. No subas `.env` ni tokens al repositorio.
