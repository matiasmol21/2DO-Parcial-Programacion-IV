import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientes, movimientosCuenta, pagos, usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { numeroRecibo } from "@/lib/formato";
import { pagoSchema } from "@/lib/schemas/clientes";
import { conReintento } from "@/lib/transaccion";

type Usuario = typeof usuarios.$inferSelect;

// RF-C5: registra el pago, el recibo y el crédito dentro de una transacción.
export async function registrarPago(
  usuario: Usuario,
  clienteId: number,
  entrada: unknown,
) {
  const datos = pagoSchema.parse(entrada);

  return conReintento(() =>
    db.transaction(async (transaccion) => {
      const cliente = await transaccion
        .select()
        .from(clientes)
        .where(eq(clientes.id, clienteId))
        .get();

      if (!cliente) {
        throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado");
      }

      if (!cliente.activo || !cliente.cuentaHabilitada) {
        throw new ApiError(
          422,
          "CUENTA_CORRIENTE_NO_HABILITADA",
          "El cliente no tiene una cuenta corriente habilitada",
        );
      }

      const resultadoSaldo = await transaccion
        .select({
          saldo: sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`,
        })
        .from(movimientosCuenta)
        .where(eq(movimientosCuenta.clienteId, clienteId))
        .get();

      const saldoActual = resultadoSaldo?.saldo ?? 0;
      if (datos.importe > saldoActual) {
        throw new ApiError(
          422,
          "PAGO_SUPERA_DEUDA",
          "El pago supera la deuda del cliente",
          { saldo: saldoActual },
        );
      }

      const resultadoNumero = await transaccion
        .select({
          numero: sql<number>`coalesce(max(${pagos.numero}), 0) + 1`,
        })
        .from(pagos)
        .get();
      const numero = resultadoNumero!.numero;
      const ahora = new Date().toISOString();

      const [pago] = await transaccion
        .insert(pagos)
        .values({
          numero,
          clienteId,
          usuarioId: usuario.id,
          importe: datos.importe,
          medio: datos.medio,
          observacion: datos.observacion || null,
          creado: ahora,
        })
        .returning();

      const recibo = numeroRecibo(numero);
      await transaccion.insert(movimientosCuenta).values({
        clienteId,
        pagoId: pago.id,
        tipo: "credito",
        importe: datos.importe,
        descripcion: `Recibo ${recibo}`,
        creado: ahora,
      });

      return {
        id: pago.id,
        numeroRecibo: recibo,
        fecha: ahora,
        cliente: { id: cliente.id, nombre: cliente.nombre },
        importe: pago.importe,
        medio: pago.medio,
        observacion: pago.observacion,
        usuario: { id: usuario.id, nombre: usuario.nombre },
        saldoCliente: saldoActual - datos.importe,
      };
    }),
  );
}

// RF-C5: recupera los datos del recibo para volver a imprimirlo.
export async function obtenerPago(_usuario: Usuario, id: number) {
  const fila = await db
    .select({
      pago: pagos,
      cliente: { id: clientes.id, nombre: clientes.nombre },
      usuario: { id: usuarios.id, nombre: usuarios.nombre },
    })
    .from(pagos)
    .innerJoin(clientes, eq(pagos.clienteId, clientes.id))
    .innerJoin(usuarios, eq(pagos.usuarioId, usuarios.id))
    .where(eq(pagos.id, id))
    .get();

  if (!fila) {
    throw new ApiError(404, "NO_ENCONTRADO", "Recibo no encontrado");
  }

  const movimientos = await db
    .select()
    .from(movimientosCuenta)
    .where(eq(movimientosCuenta.clienteId, fila.cliente.id))
    .orderBy(asc(movimientosCuenta.creado), asc(movimientosCuenta.id));

  let saldoCliente = 0;
  for (const movimiento of movimientos) {
    saldoCliente +=
      movimiento.tipo === "debito" ? movimiento.importe : -movimiento.importe;
    if (movimiento.pagoId === id) {
      break;
    }
  }

  return {
    id: fila.pago.id,
    numeroRecibo: numeroRecibo(fila.pago.numero),
    fecha: fila.pago.creado,
    cliente: fila.cliente,
    importe: fila.pago.importe,
    medio: fila.pago.medio,
    observacion: fila.pago.observacion,
    usuario: fila.usuario,
    saldoCliente,
  };
}
