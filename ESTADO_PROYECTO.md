# Estado del proyecto - segundo parcial

El proyecto cubre los m?dulos funcionales principales del parcial. Todav?a hay tareas de arquitectura, validaci?n de interfaz y entrega externa que impiden considerarlo completo.

## Implementado

- Inicio y cierre de sesi?n, cookie `httpOnly`, contrase?as con bcrypt y permisos verificados en los servicios.
- Productos, categor?as, existencias, movimientos y bajas l?gicas.
- Clientes, cuentas corrientes, pagos, recibos, saldos y bajas l?gicas.
- Ventas contado, tarjeta y cuenta corriente; detalle imprimible y anulaci?n por administrador.
- Tablero con indicadores y gr?ficos.
- API REST con Route Handlers y mutaciones de interfaz mediante Server Actions que comparten los servicios.
- Datos iniciales: dos usuarios, cinco categor?as, treinta productos, diez clientes y cincuenta facturas.
- `/clientes/saldos`, filtros y paginaci?n SQL en los listados cubiertos por las pruebas.

## Verificado localmente el 22/11/2026

- `pnpm install --frozen-lockfile`: correcto con pnpm 12.21.0. Se aprob? ?nicamente el script de instalaci?n de `esbuild`.
- `pnpm run build`: correcto. Se us? `NEXT_BUILD_DIR=.next-build` para separar la salida.
- `pnpm run test:flujo`: correcto; incluye reglas, saldos, stock, concurrencia y tablero.
- `pnpm run test:api`: correcto contra SQLite temporal; la prueba aplica migraciones y seed, recorre los m?dulos de API y verifica cantidades iniciales, permisos, errores y filtros.
- `git diff --check`: correcto.

La prueba API no sustituye una revisi?n exhaustiva de cada variante de los 31 m?todos/rutas documentados en la consigna. Next.js modifica `tsconfig.json` y `next-env.d.ts` durante el build; se restauraron esos archivos y se elimin? el directorio temporal despu?s de verificarlo.

## Pendientes t?cnicos del proyecto

1. Revisar las pantallas en escritorio y a 360 px, incluidas validaciones junto a campos, accesibilidad por teclado, estados de carga/vac?o/error y confirmaciones.
2. Completar el cotejo automatizado de filtros, formatos y c?digos de respuesta para todas las rutas y m?todos de la secci?n 11.
3. Alinear las lecturas de clientes, usuarios y fichas con la pauta arquitect?nica: Server Components consultando servicios, filtros/paginaci?n en la URL y componentes cliente peque?os para la interacci?n. Los listados de productos y ventas ya consultan desde el servidor y conservan filtros y paginaci?n en la URL; quedan otros listados y fichas que a?n cargan por `fetch` desde Client Components.
4. Hacer el recorrido de defensa (venta contado, alta r?pida y venta a cuenta, pago, anulaci?n) comprobando stock y saldo en la aplicaci?n.

## Decisi?n de anulaci?n

La regla elegida para anular facturas a cuenta con pagos previos est? implementada: se acredita la deuda pendiente hasta cero y el excedente se registra como reintegro en efectivo asociado a la factura. El comercio realiza ese reintegro manualmente. La prueba API verifica una venta de $ 10.000 con un pago previo de $ 4.000: cr?dito de $ 6.000, reintegro de $ 4.000, saldo cero y reposici?n del stock.

## Pendientes de publicaci?n y defensa

1. Publicar en Vercel, conectar Turso, aplicar migraciones y seed, y validar los recorridos en la URL p?blica. No se hizo push ni se accedi? a cuentas externas durante esta revisi?n.
2. Agregar al README la URL p?blica una vez publicada y comprobada.
3. Preparar la defensa individual: cada integrante debe poder explicar y modificar las reglas, permisos, transacciones, inventario, saldos y decisiones de IA.

Los integrantes y legajos informados ya est?n en el README. No publicar secretos ni subir `.env`, bases locales o datos reales.
