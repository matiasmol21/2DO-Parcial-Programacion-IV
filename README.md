# Verde Sur - Sistema de gesti?n comercial

Proyecto grupal del segundo parcial de Programaci?n IV. El estado de cumplimiento y las tareas pendientes se detallan al final de este documento.

## Integrantes

| Integrante | Legajo |
| --- | --- |
| Facundo Murillo | 63286 |
| Santiago Thomas | 55546 |
| Matias Molina | 63284 |

## Publicaci?n

- Repositorio: https://github.com/matiasmol21/2DO-Parcial-Programacion-IV
- Aplicaci?n p?blica en Vercel: **pendiente de publicar y validar**.

## Estado actual

Incluye Next.js, TypeScript, Tailwind, componentes de interfaz, Drizzle y conexi?n a SQLite/libSQL; inicio de sesi?n con cookie firmada y contrase?as con bcrypt; administraci?n de usuarios y categor?as; cat?logo y movimientos de stock; clientes, cuenta corriente y pagos; facturas; y tablero con Chart.js. Los importes se guardan en centavos.

Revisi?n basada en el [enunciado oficial del segundo parcial](https://github.com/AlejandroDiBattista/tup26-p4/blob/main/requerimientos.md). El estado detallado y los faltantes se mantienen en [ESTADO_PROYECTO.md](ESTADO_PROYECTO.md).

La API devuelve listas paginadas para productos, clientes, usuarios, facturas y movimientos de stock; permite cargar stock inicial y devuelve el detalle completo de las facturas. Las fichas permiten editar categor?as de productos y documentos de clientes, consultar movimientos y ver las ?ltimas facturas. La carga inicial prepara 2 usuarios, 5 categor?as, 30 productos, 10 clientes y, si a?n no hay facturas, 50 ventas de ejemplo.

Quedan aspectos para revisar antes de entregar: terminar la pasada visual, comprobar cada requerimiento y formato de la API contra el enunciado y verificar los formularios y errores junto a cada campo. La publicaci?n y validaci?n en Vercel y Turso sigue pendiente. Ver [ESTADO_PROYECTO.md](ESTADO_PROYECTO.md) para la lista de tareas del grupo.

Al anular una factura a cuenta, el cr?dito cancela la deuda vigente del cliente hasta llegar a saldo cero. Si los pagos previos superan la deuda, el excedente queda registrado en la factura como reintegro en efectivo; el comercio debe efectuar ese reintegro manualmente. As? no se genera saldo a favor y la anulaci?n conserva su trazabilidad. Para una venta de $ 10.000 con un pago previo de $ 4.000, se registra un cr?dito en cuenta de $ 6.000 y un reintegro de $ 4.000.

## Instalaci?n local prevista

Requiere Node.js y pnpm 12.21.0; la versi?n est? fijada en `package.json` y puede ejecutarse con Corepack. En PowerShell, desde esta carpeta:

```powershell
pnpm install
Copy-Item .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

En esta computadora se instal? con npm, porque pnpm no est? disponible. Para volver a abrir la versi?n ya inicializada, ejecut? `npm run dev`. Si se instala desde cero con npm, los comandos equivalentes son `npm install`, `Copy-Item .env.example .env`, `npm run db:migrate`, `npm run db:seed` y `npm run dev`.

Abrir http://localhost:3000. Usuarios de prueba: `admin@ejemplo.com` / `Admin1234` y `vendedor@ejemplo.com` / `Vendedor1234`. Estas contrase?as son solo para pr?ctica; cambiarlas antes de publicar. El archivo `.env` no debe subirse al repositorio. Para Turso se usar?n `DATABASE_URL` y `DATABASE_AUTH_TOKEN`; cambiar tambi?n `SESSION_SECRET` por un valor secreto y aleatorio.

## Para estudiar

- `db/schema.ts`: tablas y relaciones; precios en centavos.
- `lib/session.ts` y `lib/services/auth.ts`: sesi?n, consulta de usuario activo y contrase?as.
- `lib/services/productos.ts`: validaci?n y permisos del cat?logo.
- `lib/services/clientes.ts`, `pagos.ts`, `facturas.ts` y `stock.ts`: reglas de cuenta corriente, ventas y movimientos.
- `app/api`: adaptadores HTTP.
- `components` y `app`: pantallas y estructura visual.

El documento divide el trabajo en cuatro hitos: base y productos, clientes, ventas y cierre. Conviene probar y comprender cada etapa antes de avanzar.

Para ejecutar la prueba del flujo comercial en una base temporal aislada: `npm run test:flujo`.

Para probar las rutas HTTP con datos descartables, ejecut? en PowerShell:

```powershell
$env:NEXT_BUILD_DIR = '.next-build'
npm run build
npm run test:api
```

La prueba crea una base temporal, comprueba las rutas de autenticaci?n, permisos, usuarios, productos, clientes, stock, pagos, facturas y tablero, y la elimina al terminar. Incluye casos de concurrencia y reglas de error; no usa `local.db`. `test:flujo` tambi?n comprueba ventas y pagos simult?neos, incluyendo una escritura posterior para detectar bloqueos.

Los cambios de tablas se aplican con `npm run db:migrate` o `pnpm run db:migrate`. La migraci?n `0001_hesitant_ultimo` agrega la observaci?n de movimientos y los datos de anulaci?n; `0002_reintegro_efectivo_anulacion` registra el reintegro en efectivo asociado a una anulaci?n. Las facturas anuladas antes de la primera migraci?n pueden no tener usuario y fecha de anulaci?n registrados.

## Cierre de consignas

La pantalla `/clientes/saldos` est? implementada y el men? incluye su acceso. Los listados de productos, clientes y facturas aplican filtros y paginaci?n en la base de datos y cargan desde Server Components con los filtros en la URL. Nueva venta permite usar Enter para agregar un producto o pasar al selector de pago. En la verificaci?n local del 22/11/2026 pasaron el build, las pruebas de flujo y las pruebas API; estas ?ltimas tambi?n validan los m?nimos de datos del seed.

Antes de entregar, complet? la revisi?n visual y arquitect?nica, el cotejo final de la API, la publicaci?n y prueba en Vercel/Turso y la preparaci?n de la defensa. Ver ESTADO_PROYECTO.md.

## Publicaci?n pendiente

La consigna requiere un repositorio de GitHub, una base Turso y un proyecto Vercel. La aplicaci?n utiliza `DATABASE_URL` para elegir la base (por ejemplo, `file:local.db` en desarrollo o una URL `libsql://` en Turso) y `DATABASE_AUTH_TOKEN` para autenticar la base remota. Carg? tambi?n un `SESSION_SECRET` ?nico y secreto en Vercel. Aplic? la migraci?n y carg? datos iniciales contra la base remota antes de comprobar los recorridos sobre la URL p?blica. No subas `.env` ni tokens al repositorio.
