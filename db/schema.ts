import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Los importes se guardan como centavos enteros.
export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "vendedor"] }).notNull(),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creado: text("creado").notNull(),
});

export const categorias = sqliteTable("categorias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  activa: integer("activa", { mode: "boolean" }).notNull().default(true),
  creado: text("creado").notNull(),
});

export const productos = sqliteTable("productos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  codigo: text("codigo").notNull().unique(),
  descripcion: text("descripcion").notNull(),
  categoriaId: integer("categoria_id")
    .references(() => categorias.id)
    .notNull(),
  precio: integer("precio").notNull(),
  existencia: integer("existencia").notNull().default(0),
  stockMinimo: integer("stock_minimo").notNull().default(0),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creado: text("creado").notNull(),
});

export const movimientosStock = sqliteTable("movimientos_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productoId: integer("producto_id")
    .references(() => productos.id)
    .notNull(),
  usuarioId: integer("usuario_id")
    .references(() => usuarios.id)
    .notNull(),
  facturaId: integer("factura_id"),
  tipo: text("tipo").notNull(),
  cantidad: integer("cantidad").notNull(),
  existenciaResultante: integer("existencia_resultante").notNull(),
  motivo: text("motivo").notNull(),
  observacion: text("observacion"),
  creado: text("creado").notNull(),
});

export const clientes = sqliteTable("clientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tipoDoc: text("tipo_doc").notNull(),
  nroDoc: text("nro_doc").notNull().unique(),
  nombre: text("nombre").notNull(),
  domicilio: text("domicilio"),
  telefono: text("telefono"),
  email: text("email"),
  cuentaHabilitada: integer("cuenta_habilitada", { mode: "boolean" })
    .notNull()
    .default(false),
  limiteCredito: integer("limite_credito"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creado: text("creado").notNull(),
});

export const facturas = sqliteTable("facturas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  puntoVenta: integer("punto_venta").notNull().default(1),
  numero: integer("numero").notNull().unique(),
  clienteId: integer("cliente_id").references(() => clientes.id),
  usuarioId: integer("usuario_id")
    .references(() => usuarios.id)
    .notNull(),
  total: integer("total").notNull(),
  formaPago: text("forma_pago").notNull(),
  montoRecibido: integer("monto_recibido"),
  tarjetaTipo: text("tarjeta_tipo"),
  tarjetaMarca: text("tarjeta_marca"),
  tarjetaUltimos4: text("tarjeta_ultimos_4"),
  estado: text("estado").notNull().default("emitida"),
  motivoAnulacion: text("motivo_anulacion"),
  anuladoPorId: integer("anulado_por_id").references(() => usuarios.id),
  anuladoEn: text("anulado_en"),
  reintegroEfectivo: integer("reintegro_efectivo").notNull().default(0),
  creado: text("creado").notNull(),
});

export const facturaItems = sqliteTable("factura_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  facturaId: integer("factura_id")
    .references(() => facturas.id)
    .notNull(),
  productoId: integer("producto_id")
    .references(() => productos.id)
    .notNull(),
  descripcion: text("descripcion").notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitario: integer("precio_unitario").notNull(),
  subtotal: integer("subtotal").notNull(),
  creado: text("creado").notNull(),
});

export const pagos = sqliteTable("pagos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  numero: integer("numero").notNull().unique(),
  clienteId: integer("cliente_id")
    .references(() => clientes.id)
    .notNull(),
  usuarioId: integer("usuario_id")
    .references(() => usuarios.id)
    .notNull(),
  importe: integer("importe").notNull(),
  medio: text("medio").notNull(),
  observacion: text("observacion"),
  creado: text("creado").notNull(),
});

export const movimientosCuenta = sqliteTable("movimientos_cuenta", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clienteId: integer("cliente_id")
    .references(() => clientes.id)
    .notNull(),
  facturaId: integer("factura_id").references(() => facturas.id),
  pagoId: integer("pago_id").references(() => pagos.id),
  tipo: text("tipo").notNull(),
  importe: integer("importe").notNull(),
  descripcion: text("descripcion").notNull(),
  creado: text("creado").notNull(),
});
