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

## Qué falta para la entrega

1. **Revisión del enunciado completada.** Se comparó el proyecto con [requerimientos.md](https://github.com/AlejandroDiBattista/tup26-p4/blob/main/requerimientos.md) en las secciones funcionales, de API, arquitectura, interfaz y entrega.
   - Implementado: módulos de inicio, ventas, productos, clientes, usuarios, autenticación, cuenta corriente, pagos, stock y pruebas principales.
   - Falta una pantalla propia de `/clientes/saldos`; la deuda se puede consultar actualmente mediante el listado de clientes con el filtro `conDeuda=true`.
   - Falta terminar la pasada visual y los estados completos exigidos para toda la interfaz.
   - Falta completar la publicación en Turso/Vercel y la defensa.
   - Verificación realizada: `npm run test:flujo` pasa y `npm run test:api` pasa con una base aislada.
2. **Terminar y probar la interfaz.** La pasada visual con Impeccable quedó interrumpida; hay que revisar el aspecto y funcionamiento en escritorio y celular, estados de carga y error, navegación con teclado, validaciones junto a los campos y uso consistente de shadcn/ui.
3. **Consultar la anulación de facturas con pagos.** Si la anulación dejara saldo a favor, actualmente se rechaza. La consigna pide revertir la factura, pero también indica que no se admiten saldos a favor; no especifica cómo devolver el dinero. Preguntar al profesor cómo resolverlo. Los pagos se registran contra la cuenta del cliente, no contra una factura individual.
4. **Verificar el proyecto en la computadora de cada integrante.** Seguir la instalación del README y probar una venta de contado, una venta en cuenta corriente, un pago y una anulación, comprobando stock y saldo.
5. **Configurar Turso y Vercel y probar la URL pública.** Esto todavía no se hizo ni se verificó en producción. Cargar las variables de entorno, aplicar migraciones y cargar datos de prueba sin subir secretos al repositorio.
6. **Preparar la defensa individual.** Cada integrante debe poder explicar y modificar el código, incluidas transacciones, stock, saldo, autenticación, permisos, API y uso de IA.
7. **Completar los datos del grupo y la entrega.** Agregar integrantes, legajos y URL pública al README cuando estén definidos. El enunciado indica entrega el **domingo 22 de noviembre de 2026 a las 23:59**, y pide enviar por WhatsApp los enlaces del repositorio y del sitio publicado.

## Cómo arrancar y probar

Seguir los comandos de instalación del [README](README.md). Para probar reglas de negocio en una base temporal: `npm run test:flujo`. El README también explica cómo compilar y ejecutar `npm run test:api` con una base temporal. Ninguna de estas pruebas requiere publicar el sistema.

No subir `.env`, tokens, bases locales ni datos reales. Los usuarios y contraseñas documentados en el README son **solo de prueba** y deben cambiarse antes de una publicación.

## Sobre este historial

El proyecto se venía trabajando en una carpeta local sin repositorio Git. La primera subida reúne el trabajo existente; no reconstruye los commits de las etapas anteriores. De ahora en adelante, conviene que el grupo haga commits claros durante el desarrollo.
