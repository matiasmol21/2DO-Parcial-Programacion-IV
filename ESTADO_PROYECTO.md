# Estado del proyecto - segundo parcial

El proyecto cubre los módulos funcionales principales del parcial. Todavía falta la revisión visual, un cotejo exhaustivo de la API y la validación de la entrega publicada.

## Implementado

- Inicio y cierre de sesión, cookie `httpOnly`, contraseñas con bcrypt y permisos verificados en los servicios.
- Productos, categorías, existencias, movimientos y bajas lógicas.
- Clientes, cuentas corrientes, pagos, recibos, saldos y bajas lógicas.
- Ventas contado, tarjeta y cuenta corriente; detalle imprimible y anulación por administrador.
- Tablero con indicadores y gráficos.
- API REST con Route Handlers y mutaciones de interfaz mediante Server Actions que comparten los servicios.
- Datos iniciales: dos usuarios, cinco categorías, treinta productos, diez clientes y cincuenta facturas.
- `/clientes/saldos`, filtros y paginación SQL en los listados cubiertos por las pruebas.
- Lecturas de productos, clientes, facturas, usuarios, categorías y fichas resueltas desde Server Components mediante servicios; los filtros y páginas de listados persisten en la URL.

## Verificado localmente el 22/11/2026

- `pnpm install --frozen-lockfile`: correcto con pnpm 12.21.0. Se aprobó únicamente el script de instalación de `esbuild`.
- `pnpm run build`: correcto. Se usó `NEXT_BUILD_DIR=.next-build` para separar la salida.
- `pnpm run test:flujo`: correcto; incluye reglas, saldos, stock, concurrencia y tablero.
- `pnpm run test:api`: correcto contra SQLite temporal; la prueba aplica migraciones y seed, recorre módulos de API y verifica cantidades iniciales, permisos, errores y filtros.
- `git diff --check`: correcto.

La prueba API no sustituye una revisión exhaustiva de cada variante de los 31 métodos/rutas documentados en la consigna. Next.js modifica `next-env.d.ts` durante el build; se restauró ese archivo y se eliminó el directorio temporal después de verificarlo.

## Pendientes técnicos del proyecto

1. Revisar las pantallas en escritorio y a 360 px, incluidas validaciones junto a campos, accesibilidad por teclado, estados de carga/vacío/error y confirmaciones.
2. Completar el cotejo automatizado de filtros, formatos y códigos de respuesta para todas las rutas y métodos de la sección 11.
3. Hacer el recorrido de defensa (venta contado, alta rápida y venta a cuenta, pago, anulación) comprobando stock y saldo en la aplicación.

## Decisión de anulación

La regla elegida para anular facturas a cuenta con pagos previos está implementada: se acredita la deuda pendiente hasta cero y el excedente se registra como reintegro en efectivo asociado a la factura. El comercio realiza ese reintegro manualmente. La prueba API verifica una venta de $ 10.000 con un pago previo de $ 4.000: crédito de $ 6.000, reintegro de $ 4.000, saldo cero y reposición del stock.

## Pendientes de publicación y defensa

1. Publicar en Vercel, conectar Turso, aplicar migraciones y seed, y validar los recorridos en la URL pública. Vercel CLI informa sesión cerrada; `.env` local apunta a SQLite y no tiene token de Turso.
2. Agregar al README la URL pública una vez publicada y comprobada.
3. Preparar la defensa individual: cada integrante debe poder explicar y modificar las reglas, permisos, transacciones, inventario, saldos y decisiones de IA.

Los integrantes y legajos informados ya están en el README. No publicar secretos ni subir `.env`, bases locales o datos reales.
