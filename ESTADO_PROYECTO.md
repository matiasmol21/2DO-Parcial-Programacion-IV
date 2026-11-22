# Estado del proyecto — segundo parcial

Este repositorio contiene una versión de práctica del sistema de gestión comercial. **Todavía requiere revisión en grupo y no debe considerarse terminada para la entrega.**

## Qué está implementado

- Inicio y cierre de sesión con roles de administrador y vendedor.
- Productos, categorías, existencias y movimientos de stock.
- Clientes, cuenta corriente, registro de pagos y recibos.
- Emisión, consulta e impresión de facturas, con pagos en efectivo, tarjeta o cuenta corriente; anulación por administrador.
- Tablero con indicadores y gráficos.
- API REST, base SQLite local y esquema con Drizzle. Los importes se guardan en centavos.
- Datos de prueba y pruebas automatizadas del flujo y de la API.

## Estado frente a la consigna

### Avances de este pase

- Se agregó `/clientes/saldos`, con clientes deudores ordenados por saldo y el total adeudado (RF-C6).
- El listado de clientes filtra, cuenta, ordena y pagina en la base de datos.
- El listado de facturas filtra, cuenta, ordena y pagina en la base de datos; conserva la búsqueda usada por la pantalla y el total emitido.
- Productos, usuarios y movimientos de stock aplican filtros, conteo y paginación en SQL.
- Las pruebas de API cubren paginación, filtros combinados y límites de día argentino para movimientos de stock.
- Las mutaciones de categorías, clientes, pagos, productos, stock, usuarios, perfil y anulación usan Server Actions que llaman a los mismos servicios que la API. La confirmación de venta conserva la API REST.
- Nueva venta permite usar Enter para agregar el primer resultado o pasar al selector de pago cuando no hay coincidencias.

### Pendientes para completar y demostrar

1. **Resolver con el profesor la anulación de facturas a cuenta con pagos previos.** Hoy se rechaza si la acreditación total deja saldo a favor; consultar cómo representar una devolución sin incumplir la regla de saldo no negativo.
2. **Revisar y demostrar toda la interfaz** en escritorio y a 360 px: coherencia visual, teclado, validaciones junto a campos, estados de carga/vacío/error y avisos o confirmaciones para operaciones irreversibles.
3. **Completar comprobaciones del contrato API** contra todas las rutas, filtros, formatos, errores y códigos definidos en la sección 11 del enunciado. Las rutas existentes cubren los módulos principales; eso no demuestra por sí solo que todos los contratos coincidan.
4. **Alinear las lecturas con la arquitectura.** Los listados y fichas se cargan en varios Client Components mediante `fetch` y guardan búsqueda/filtros en estado local; la pauta pide Server Components que consulten servicios y mantengan filtros/paginado en la URL. Evaluar la migración por pantallas.
5. **Completar comprobaciones del contrato API** contra rutas, filtros, formatos, errores y códigos de la sección 11; la cobertura automatizada actual es amplia, pero no exhaustiva.
6. **Revisar y demostrar toda la interfaz** en escritorio y a 360 px: coherencia visual, teclado, validaciones junto a campos, estados de carga/vacío/error y avisos o confirmaciones.
7. **Validar inicialización local desde cero** con los comandos del enunciado (`pnpm install`, migraciones, seed, arranque) y asegurar que los datos de prueba incluyen los recorridos de clientes, ventas y pagos de forma repetible.
8. **Publicar en Vercel y conectar Turso**, configurar secretos en el proveedor, aplicar migraciones y cargar datos de prueba. No se verificó publicación ni acceso a cuentas externas en este pase.
9. **Probar la URL pública** con los recorridos de defensa y comprobar stock y saldo después de cada operación.
10. **Completar el README y la entrega** con integrantes, legajos, URL pública y los enlaces solicitados.
11. **Preparar la defensa individual:** cada integrante debe explicar y modificar el sistema, incluidas las transacciones, permisos, inventario, saldos, API y decisiones de IA.

La regla de anulación y la publicación requieren, respectivamente, una respuesta del profesor y acceso/configuración del grupo. La revisión visual y las pruebas de recorrido requieren ejecutar la aplicación con dependencias y datos de prueba. No se consideran verificadas solo por inspección estática.
## Cómo arrancar y probar

Seguir los comandos de instalación del [README](README.md). Para probar reglas de negocio en una base temporal: `npm run test:flujo`. El README también explica cómo compilar y ejecutar `npm run test:api` con una base temporal. Ninguna de estas pruebas requiere publicar el sistema.

No subir `.env`, tokens, bases locales ni datos reales. Los usuarios y contraseñas documentados en el README son **solo de prueba** y deben cambiarse antes de una publicación.

## Sobre este historial

El proyecto se venía trabajando en una carpeta local sin repositorio Git. La primera subida reúne el trabajo existente; no reconstruye los commits de las etapas anteriores. De ahora en adelante, conviene que el grupo haga commits claros durante el desarrollo.
