import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  clientes,
  facturaItems,
  facturas,
  movimientosCuenta,
  productos,
  usuarios,
} from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { facturaSchema, anulacionSchema } from "@/lib/schemas/facturas";
import { moverStock } from "@/lib/services/stock";
import { numeroFactura } from "@/lib/formato";
import { conReintento } from "@/lib/transaccion";
type Usuario = typeof usuarios.$inferSelect;
// RF-V6: precio, numeración, factura, stock y deuda se confirman juntos.
export async function emitirFactura(usuario: Usuario, input: unknown) {
  const datos = facturaSchema.parse(input);
  const resultado = await conReintento(() =>
    db.transaction(async (tx) => {
      const cliente = datos.clienteId
        ? await tx
            .select()
            .from(clientes)
            .where(eq(clientes.id, datos.clienteId))
            .get()
        : null;
      if (datos.clienteId && (!cliente || !cliente.activo))
        throw new ApiError(
          404,
          "NO_ENCONTRADO",
          "Cliente no encontrado o inactivo",
        );
      if (
        datos.pago.forma === "cuenta_corriente" &&
        (!cliente || !cliente.cuentaHabilitada)
      )
        throw new ApiError(
          422,
          "CUENTA_CORRIENTE_NO_HABILITADA",
          "Elegí un cliente con cuenta corriente habilitada",
        );
      const lineas = [];
      const insuficientes: {
        productoId: number;
        solicitado: number;
        disponible: number;
      }[] = [];
      let total = 0;
      for (const item of datos.items) {
        const producto = await tx
          .select()
          .from(productos)
          .where(eq(productos.id, item.productoId))
          .get();
        if (!producto)
          throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado");
        if (!producto.activo)
          throw new ApiError(
            422,
            "PRODUCTO_INACTIVO",
            `${producto.descripcion} está inactivo`,
          );
        if (producto.existencia < item.cantidad)
          insuficientes.push({
            productoId: producto.id,
            solicitado: item.cantidad,
            disponible: producto.existencia,
          });
        const subtotal = producto.precio * item.cantidad;
        if (
          !Number.isSafeInteger(subtotal) ||
          !Number.isSafeInteger(total + subtotal)
        )
          throw new ApiError(
            422,
            "VALIDACION",
            "El importe es demasiado grande",
          );
        total += subtotal;
        lineas.push({ producto, cantidad: item.cantidad, subtotal });
      }
      if (insuficientes.length)
        throw new ApiError(
          409,
          "STOCK_INSUFICIENTE",
          "No hay stock suficiente para todos los productos",
          insuficientes,
        );
      if (
        datos.pago.forma === "contado" &&
        (datos.pago.montoRecibido ?? total) < total
      )
        throw new ApiError(
          422,
          "MONTO_INSUFICIENTE",
          "El monto recibido no cubre el total",
        );
      let saldo = 0;
      if (cliente && datos.pago.forma === "cuenta_corriente") {
        const r = await tx
          .select({
            saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo}='debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end),0)`,
          })
          .from(movimientosCuenta)
          .where(eq(movimientosCuenta.clienteId, cliente.id))
          .get();
        saldo = r?.saldo ?? 0;
        if (
          cliente.limiteCredito !== null &&
          saldo + total > cliente.limiteCredito
        )
          throw new ApiError(
            422,
            "LIMITE_CREDITO_EXCEDIDO",
            "La venta supera el límite de crédito",
            {
              saldoActual: saldo,
              limite: cliente.limiteCredito,
              excedente: saldo + total - cliente.limiteCredito,
            },
          );
      }
      const siguiente = await tx
        .select({ numero: sql<number>`coalesce(max(${facturas.numero}),0)+1` })
        .from(facturas)
        .get();
      const ahora = new Date().toISOString(),
        numero = siguiente!.numero;
      const [factura] = await tx
        .insert(facturas)
        .values({
          numero,
          puntoVenta: 1,
          clienteId: cliente?.id ?? null,
          usuarioId: usuario.id,
          total,
          formaPago: datos.pago.forma,
          montoRecibido:
            datos.pago.forma === "contado"
              ? (datos.pago.montoRecibido ?? total)
              : null,
          tarjetaTipo:
            datos.pago.forma === "tarjeta" ? datos.pago.tarjeta.tipo : null,
          tarjetaMarca:
            datos.pago.forma === "tarjeta" ? datos.pago.tarjeta.marca : null,
          tarjetaUltimos4:
            datos.pago.forma === "tarjeta" ? datos.pago.tarjeta.ultimos4 : null,
          creado: ahora,
        })
        .returning();
      for (const linea of lineas) {
        await tx.insert(facturaItems).values({
          facturaId: factura.id,
          productoId: linea.producto.id,
          descripcion: linea.producto.descripcion,
          cantidad: linea.cantidad,
          precioUnitario: linea.producto.precio,
          subtotal: linea.subtotal,
          creado: ahora,
        });
        await moverStock(tx, {
          productoId: linea.producto.id,
          usuarioId: usuario.id,
          tipo: "venta",
          cantidad: linea.cantidad,
          motivo: `Factura ${numeroFactura(numero)}`,
          facturaId: factura.id,
        });
      }
      if (cliente && datos.pago.forma === "cuenta_corriente")
        await tx.insert(movimientosCuenta).values({
          clienteId: cliente.id,
          facturaId: factura.id,
          tipo: "debito",
          importe: total,
          descripcion: `Factura ${numeroFactura(numero)}`,
          creado: ahora,
        });
      return {
        id: factura.id,
        numeroFormateado: numeroFactura(numero),
        total,
        estado: "emitida",
        ...(datos.pago.forma === "cuenta_corriente"
          ? { saldoCliente: saldo + total }
          : {}),
      };
    }),
  );
  return {
    ...(await obtenerFactura(usuario, resultado.id)),
    ...(resultado.saldoCliente !== undefined
      ? { saldoCliente: resultado.saldoCliente }
      : {}),
  };
}
// RF-V8: listado de comprobantes más recientes.
export async function listarFacturas(
  _usuario: Usuario,
  p = new URLSearchParams(),
) {
  const page = Math.max(1, parseInt(p.get("page") || "1", 10) || 1),
    pageSize = Math.min(
      100,
      Math.max(1, parseInt(p.get("pageSize") || "20", 10) || 20),
    );
  const q = (p.get("q") || "").trim().toLowerCase(),
    desde = p.get("desde"),
    hasta = p.get("hasta"),
    forma = p.get("forma"),
    estado = p.get("estado"),
    clienteId = p.get("clienteId"),
    vendedorId = p.get("vendedorId"),
    vendedor = (p.get("vendedor") || "").trim().toLowerCase();
  const condiciones = [];
  if (q) {
    const patron = `%${q}%`;
    // El formato visible separa el punto de venta del número interno.
    const numeroFormateado = q.match(/^\d{4}-(\d{8})$/);
    const numero = numeroFormateado
      ? Number(numeroFormateado[1])
      : Number(q.replace(/\D/g, ""));
    const busqueda = [
      sql`lower(coalesce(${clientes.nombre}, 'Consumidor final')) like ${patron}`,
      sql`cast(${facturas.numero} as text) like ${patron}`,
    ];
    if (Number.isSafeInteger(numero) && numero > 0)
      busqueda.push(eq(facturas.numero, numero));
    condiciones.push(or(...busqueda)!);
  }
  if (desde)
    condiciones.push(
      gte(facturas.creado, new Date(`${desde}T00:00:00-03:00`).toISOString()),
    );
  if (hasta)
    condiciones.push(
      lte(
        facturas.creado,
        new Date(`${hasta}T23:59:59.999-03:00`).toISOString(),
      ),
    );
  if (forma) condiciones.push(eq(facturas.formaPago, forma));
  if (estado) condiciones.push(eq(facturas.estado, estado));
  if (clienteId) condiciones.push(eq(facturas.clienteId, Number(clienteId)));
  if (vendedorId) condiciones.push(eq(facturas.usuarioId, Number(vendedorId)));
  if (vendedor)
    condiciones.push(sql`lower(${usuarios.nombre}) like ${`%${vendedor}%`}`);
  const filtro = condiciones.length ? and(...condiciones) : undefined;
  const base = db
    .select({
      id: facturas.id,
      numero: facturas.numero,
      puntoVenta: facturas.puntoVenta,
      fecha: facturas.creado,
      total: facturas.total,
      formaPago: facturas.formaPago,
      estado: facturas.estado,
      cliente: clientes.nombre,
      clienteId: facturas.clienteId,
      vendedor: usuarios.nombre,
      vendedorId: facturas.usuarioId,
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id));
  const consulta = filtro ? base.where(filtro) : base;
  const data = await consulta
    .orderBy(desc(facturas.creado), desc(facturas.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const resumen = db
    .select({
      total: sql<number>`count(*)`,
      totalEmitido: sql<number>`coalesce(sum(case when ${facturas.estado}='emitida' then ${facturas.total} else 0 end),0)`,
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id));
  const cantidad = await (filtro ? resumen.where(filtro) : resumen).get();
  return {
    data: data.map((f) => ({
      ...f,
      numeroFormateado: numeroFactura(f.numero, f.puntoVenta),
    })),
    page,
    pageSize,
    total: cantidad?.total ?? 0,
    totalEmitido: cantidad?.totalEmitido ?? 0,
  };
}
// RF-V1: el próximo número es informativo; se asigna dentro de la transacción.
export async function proximoNumero(_usuario: Usuario) {
  const r = await db
    .select({ numero: sql<number>`coalesce(max(${facturas.numero}),0)+1` })
    .from(facturas)
    .get();
  return { numeroFormateado: numeroFactura(r!.numero) };
}
// RF-V7: conserva el precio y descripción al momento de la venta.
export async function obtenerFactura(_usuario: Usuario, id: number) {
  const row = await db
    .select({
      factura: facturas,
      cliente: {
        id: clientes.id,
        nombre: clientes.nombre,
        tipoDoc: clientes.tipoDoc,
        nroDoc: clientes.nroDoc,
        domicilio: clientes.domicilio,
      },
      vendedor: { id: usuarios.id, nombre: usuarios.nombre },
    })
    .from(facturas)
    .leftJoin(clientes, eq(facturas.clienteId, clientes.id))
    .innerJoin(usuarios, eq(facturas.usuarioId, usuarios.id))
    .where(eq(facturas.id, id))
    .get();
  if (!row) throw new ApiError(404, "NO_ENCONTRADO", "Factura no encontrada");
  const items = await db
    .select({
      productoId: facturaItems.productoId,
      codigo: productos.codigo,
      descripcion: facturaItems.descripcion,
      cantidad: facturaItems.cantidad,
      precioUnitario: facturaItems.precioUnitario,
      subtotal: facturaItems.subtotal,
      id: facturaItems.id,
    })
    .from(facturaItems)
    .innerJoin(productos, eq(productos.id, facturaItems.productoId))
    .where(eq(facturaItems.facturaId, id));
  const f = row.factura;
  let saldoCliente: number | undefined;
  if (f.formaPago === "cuenta_corriente" && f.clienteId) {
    const cuenta = await db
      .select()
      .from(movimientosCuenta)
      .where(eq(movimientosCuenta.clienteId, f.clienteId))
      .orderBy(asc(movimientosCuenta.creado), asc(movimientosCuenta.id));
    let saldo = 0;
    for (const m of cuenta) {
      saldo += m.tipo === "debito" ? m.importe : -m.importe;
      if (m.tipo === "debito" && m.facturaId === f.id) {
        saldoCliente = saldo;
        break;
      }
    }
  }
  const anulador = f.anuladoPorId
    ? await db
        .select({ id: usuarios.id, nombre: usuarios.nombre })
        .from(usuarios)
        .where(eq(usuarios.id, f.anuladoPorId))
        .get()
    : null;
  const pago =
    f.formaPago === "contado"
      ? {
          forma: f.formaPago,
          montoRecibido: f.montoRecibido,
          vuelto: (f.montoRecibido ?? f.total) - f.total,
        }
      : f.formaPago === "tarjeta"
        ? {
            forma: f.formaPago,
            tarjeta: {
              tipo: f.tarjetaTipo,
              marca: f.tarjetaMarca,
              ultimos4: f.tarjetaUltimos4,
            },
          }
        : { forma: f.formaPago };
  return {
    ...f,
    fecha: f.creado,
    cliente: row.cliente,
    vendedor: row.vendedor,
    numeroFormateado: numeroFactura(f.numero, f.puntoVenta),
    items,
    pago,
    ...(saldoCliente !== undefined ? { saldoCliente } : {}),
    ...(f.estado === "anulada"
      ? {
          anulacion: {
            fecha: f.anuladoEn,
            usuario: anulador,
            motivo: f.motivoAnulacion,
          },
        }
      : {}),
  };
}
// RF-V9: revierte existencias y deuda en la misma transacción.
export async function anularFactura(
  usuario: Usuario,
  id: number,
  input: unknown,
) {
  const { motivo } = anulacionSchema.parse(input);
  if (usuario.rol !== "admin")
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Solo el administrador puede anular facturas",
    );
  await conReintento(() =>
    db.transaction(async (tx) => {
      const factura = await tx
        .select()
        .from(facturas)
        .where(eq(facturas.id, id))
        .get();
      if (!factura)
        throw new ApiError(404, "NO_ENCONTRADO", "Factura no encontrada");
      if (factura.estado === "anulada")
        throw new ApiError(
          409,
          "FACTURA_ANULADA",
          "La factura ya está anulada",
        );
      if (factura.formaPago === "cuenta_corriente" && factura.clienteId) {
        const r = await tx
          .select({
            saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo}='debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end),0)`,
          })
          .from(movimientosCuenta)
          .where(eq(movimientosCuenta.clienteId, factura.clienteId))
          .get();
        if ((r?.saldo ?? 0) < factura.total)
          throw new ApiError(
            422,
            "SALDO_PENDIENTE",
            "No se puede anular: la cuenta tiene pagos que dejarían saldo a favor",
          );
        await tx.insert(movimientosCuenta).values({
          clienteId: factura.clienteId,
          facturaId: id,
          tipo: "credito",
          importe: factura.total,
          descripcion: `Anulación factura ${numeroFactura(factura.numero)}`,
          creado: new Date().toISOString(),
        });
      }
      const items = await tx
        .select()
        .from(facturaItems)
        .where(eq(facturaItems.facturaId, id));
      for (const item of items)
        await moverStock(tx, {
          productoId: item.productoId,
          usuarioId: usuario.id,
          tipo: "anulacion",
          cantidad: item.cantidad,
          motivo,
          facturaId: id,
        });
      await tx
        .update(facturas)
        .set({
          estado: "anulada",
          motivoAnulacion: motivo,
          anuladoPorId: usuario.id,
          anuladoEn: new Date().toISOString(),
        })
        .where(eq(facturas.id, id));
    }),
  );
  return obtenerFactura(usuario, id);
}
