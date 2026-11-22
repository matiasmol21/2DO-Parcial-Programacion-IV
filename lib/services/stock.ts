import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { facturas, movimientosStock, productos, usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { numeroFactura } from "@/lib/formato";
import { conReintento } from "@/lib/transaccion";

const movimientoSchema = z
  .object({
    productoId: z.number().int().positive(),
    tipo: z.enum(["ingreso", "egreso"]),
    cantidad: z.number().int().safe().positive(),
    motivo: z.string().trim().min(1),
    observacion: z.string().trim().max(500).optional(),
  })
  .strict();
type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];
// Regla 2: todas las operaciones del sistema deben pasar por esta función.
export async function moverStock(
  tx: Transaccion,
  datos: {
    productoId: number;
    usuarioId: number;
    tipo: "ingreso" | "egreso" | "venta" | "anulacion";
    cantidad: number;
    motivo: string;
    observacion?: string;
    facturaId?: number;
  },
) {
  const cambio =
    datos.tipo === "egreso" || datos.tipo === "venta"
      ? -datos.cantidad
      : datos.cantidad;
  const actual = await tx
    .select()
    .from(productos)
    .where(eq(productos.id, datos.productoId))
    .get();
  if (!actual)
    throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado");
  if (!actual.activo && datos.tipo !== "anulacion")
    throw new ApiError(422, "PRODUCTO_INACTIVO", "El producto está inactivo");
  const [producto] = await tx
    .update(productos)
    .set({ existencia: sql`${productos.existencia} + ${cambio}` })
    .where(
      and(
        eq(productos.id, datos.productoId),
        gte(productos.existencia, cambio < 0 ? -cambio : 0),
      ),
    )
    .returning();
  if (!producto)
    throw new ApiError(
      409,
      "STOCK_INSUFICIENTE",
      "El movimiento supera la existencia disponible",
      [
        {
          productoId: datos.productoId,
          solicitado: datos.cantidad,
          disponible: actual.existencia,
        },
      ],
    );
  const [movimiento] = await tx
    .insert(movimientosStock)
    .values({
      productoId: producto.id,
      usuarioId: datos.usuarioId,
      tipo: datos.tipo,
      cantidad: cambio,
      existenciaResultante: producto.existencia,
      motivo: datos.motivo,
      observacion: datos.observacion || null,
      facturaId: datos.facturaId,
      creado: new Date().toISOString(),
    })
    .returning();
  return movimiento;
}
// RF-P4/P5 y reglas 1 y 2. El cambio condicional y el movimiento se guardan juntos.
export async function registrarMovimiento(
  usuario: typeof usuarios.$inferSelect,
  input: unknown,
) {
  const datos = movimientoSchema.parse(input);
  if (usuario.rol !== "admin")
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Solo el administrador puede ajustar el stock",
    );
  return conReintento(() =>
    db.transaction(async (tx) => {
      const m = await moverStock(tx, { ...datos, usuarioId: usuario.id });
      const p = await tx
        .select({ id: productos.id, codigo: productos.codigo })
        .from(productos)
        .where(eq(productos.id, m.productoId))
        .get();
      return {
        ...m,
        producto: p,
        usuario: { id: usuario.id, nombre: usuario.nombre },
        fecha: m.creado,
        referencia: null,
      };
    }),
  );
}
// RF-P6: consulta general de movimientos, con filtros y paginación.
export async function listarTodosMovimientos(
  _usuario: typeof usuarios.$inferSelect,
  p: URLSearchParams,
) {
  const desde = p.get("desde");
  const hasta = p.get("hasta");
  const productoId = p.get("productoId");
  const tipo = p.get("tipo");
  const pagina = Math.max(1, Number.parseInt(p.get("page") || "1", 10) || 1);
  const tamanoPagina = Math.min(
    100,
    Math.max(1, Number.parseInt(p.get("pageSize") || "20", 10) || 20),
  );
  const condiciones = [];

  if (desde) {
    condiciones.push(gte(movimientosStock.creado, fechaArgentinaIso(desde)));
  }

  if (hasta) {
    condiciones.push(lte(movimientosStock.creado, fechaArgentinaIso(hasta, true)));
  }

  if (productoId) {
    condiciones.push(eq(movimientosStock.productoId, Number(productoId)));
  }

  if (tipo) {
    condiciones.push(eq(movimientosStock.tipo, tipo));
  }

  const where = and(...condiciones);
  const filas = await db
    .select({
      id: movimientosStock.id,
      productoId: movimientosStock.productoId,
      producto: { id: productos.id, codigo: productos.codigo },
      tipo: movimientosStock.tipo,
      cantidad: movimientosStock.cantidad,
      existenciaResultante: movimientosStock.existenciaResultante,
      motivo: movimientosStock.motivo,
      observacion: movimientosStock.observacion,
      fecha: movimientosStock.creado,
      facturaId: movimientosStock.facturaId,
      numero: facturas.numero,
      puntoVenta: facturas.puntoVenta,
      usuario: { id: usuarios.id, nombre: usuarios.nombre },
    })
    .from(movimientosStock)
    .innerJoin(usuarios, eq(usuarios.id, movimientosStock.usuarioId))
    .innerJoin(productos, eq(productos.id, movimientosStock.productoId))
    .leftJoin(facturas, eq(facturas.id, movimientosStock.facturaId))
    .where(where)
    .orderBy(desc(movimientosStock.id))
    .limit(tamanoPagina)
    .offset((pagina - 1) * tamanoPagina);
  const resultadoTotal = await db
    .select({ total: sql<number>`count(*)` })
    .from(movimientosStock)
    .where(where)
    .get();

  return {
    data: filas.map((movimiento) => ({
      ...movimiento,
      referencia:
        movimiento.facturaId && movimiento.numero !== null
          ? {
              facturaId: movimiento.facturaId,
              numero: numeroFactura(
                movimiento.numero,
                movimiento.puntoVenta ?? 1,
              ),
            }
          : null,
    })),
    page: pagina,
    pageSize: tamanoPagina,
    total: resultadoTotal?.total ?? 0,
  };
}

// Convierte un día local de Argentina al límite UTC usado por la base.
function fechaArgentinaIso(fecha: string, finDelDia = false) {
  const hora = finDelDia ? "23:59:59.999" : "00:00:00.000";
  const fechaUtc = new Date(`${fecha}T${hora}-03:00`);
  return fechaUtc.toISOString();
}
