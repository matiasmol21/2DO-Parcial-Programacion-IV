# Estado del proyecto - segundo parcial

El proyecto cubre los módulos funcionales principales del parcial. Todavía hay tareas de arquitectura, validación de interfaz y entrega externa que impiden considerarlo completo.

## Implementado

- Inicio y cierre de sesión, cookie `httpOnly`, contraseñas con bcrypt y permisos verificados en los servicios.
- Productos, categorías, existencias, movimientos y bajas lógicas.
- Clientes, cuentas corrientes, pagos, recibos, saldos y bajas lógicas.
- Ventas contado, tarjeta y cuenta corriente; detalle imprimible y anulación por administrador.
- Tablero con indicadores y gráficos.
- API REST con Route Handlers y mutaciones de interfaz mediante Server Actions que comparten los servicios.
- Datos iniciales: dos usuarios, cinco categorías, treinta productos, diez clientes y cincuenta facturas.
- `/clientes/saldos`, filtros y paginación SQL en los listados cubiertos por las pruebas.

## Verificado localmente el 22/11/2026

- `npm run build`: correcto. Se usó `NEXT_BUILD_DIR=.next-audit` para separar la salida.
- `npm run test:flujo`: correcto; incluye reglas, saldos, stock, concurrencia y tablero.
- `npm run test:api`: correcto contra SQLite temporal; la prueba aplica migraciones y seed, recorre los módulos de API y verifica cantidades iniciales, permisos, errores y filtros.
- `git diff --check`: correcto.

La prueba API no sustituye una revisión exhaustiva de cada variante de los 31 métodos/rutas documentados en la consigna. Next.js modifica `tsconfig.json` y `next-env.d.ts` durante el build; se restauraron esos archivos y se eliminó el directorio temporal después de verificarlo.

## Pendientes técnicos del proyecto

1. Revisar las pantallas en escritorio y a 360 px, incluidas validaciones junto a campos, accesibilidad por teclado, estados de carga/vacío/error y confirmaciones.
2. Completar el cotejo automatizado de filtros, formatos y códigos de respuesta para todas las rutas y métodos de la sección 11.
3. Alinear las lecturas de productos, clientes, facturas, usuarios y fichas con la pauta arquitectónica: Server Components consultando servicios, filtros/paginación en la URL y componentes cliente pequeños para la interacción. Varios listados aún cargan por `fetch` desde Client Components y guardan filtros en estado local.
4. Probar instalación limpia con los comandos `pnpm` del enunciado. En esta computadora no está instalado `pnpm`; las verificaciones ejecutadas usaron npm y las dependencias ya instaladas.
5. Hacer el recorrido de defensa (venta contado, alta rápida y venta a cuenta, pago, anulación) comprobando stock y saldo en la aplicación.

## Pendientes que requieren al grupo o al profesor

1. Consultar al profesor cómo resolver la anulación de una factura a cuenta con pagos previos cuando acreditar la factura produciría un saldo a favor. La implementación actual rechaza el caso para mantener el saldo no negativo; no se cambió porque el enunciado también prohíbe saldos a favor y no define una devolución.
2. Publicar en Vercel, conectar Turso, aplicar migraciones y seed, y validar los recorridos en la URL pública. No se hizo push ni se accedió a cuentas externas durante esta revisión.
3. Agregar al README la URL pública una vez publicada y comprobada.
4. Preparar la defensa individual: cada integrante debe poder explicar y modificar las reglas, permisos, transacciones, inventario, saldos y decisiones de IA.

Los integrantes y legajos informados ya están en el README. No publicar secretos ni subir `.env`, bases locales o datos reales.
