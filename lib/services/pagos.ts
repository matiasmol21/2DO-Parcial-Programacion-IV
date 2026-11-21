import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientes, movimientosCuenta, pagos, usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
import { numeroRecibo } from "@/lib/formato";
import { pagoSchema } from "@/lib/schemas/clientes";
import { conReintento } from "@/lib/transaccion";
type Usuario=typeof usuarios.$inferSelect;
// RF-C5: registra pago, numeración y crédito en una única transacción.
export async function registrarPago(usuario:Usuario,clienteId:number,input:unknown) {
  const datos=pagoSchema.parse(input);
  return conReintento(()=>db.transaction(async tx=>{
    const cliente=await tx.select().from(clientes).where(eq(clientes.id,clienteId)).get();
    if(!cliente) throw new ApiError(404,"NO_ENCONTRADO","Cliente no encontrado");
    if(!cliente.activo||!cliente.cuentaHabilitada) throw new ApiError(422,"CUENTA_CORRIENTE_NO_HABILITADA","El cliente no tiene una cuenta corriente habilitada");
    const resultado=await tx.select({saldo:sql<number>`coalesce(sum(case when ${movimientosCuenta.tipo} = 'debito' then ${movimientosCuenta.importe} else -${movimientosCuenta.importe} end), 0)`}).from(movimientosCuenta).where(eq(movimientosCuenta.clienteId,clienteId)).get();
    const saldo=resultado?.saldo??0;
    if(datos.importe>saldo) throw new ApiError(422,"PAGO_SUPERA_DEUDA","El pago supera la deuda del cliente",{saldo});
    const siguiente=await tx.select({numero:sql<number>`coalesce(max(${pagos.numero}), 0) + 1`}).from(pagos).get();
    const ahora=new Date().toISOString(), numero=siguiente!.numero;
    const [pago]=await tx.insert(pagos).values({numero,clienteId,usuarioId:usuario.id,importe:datos.importe,medio:datos.medio,observacion:datos.observacion||null,creado:ahora}).returning();
    await tx.insert(movimientosCuenta).values({clienteId,pagoId:pago.id,tipo:"credito",importe:datos.importe,descripcion:`Recibo ${numeroRecibo(numero)}`,creado:ahora});
    return {id:pago.id,numeroRecibo:numeroRecibo(numero),fecha:ahora,cliente:{id:cliente.id,nombre:cliente.nombre},importe:pago.importe,medio:pago.medio,observacion:pago.observacion,usuario:{id:usuario.id,nombre:usuario.nombre},saldoCliente:saldo-datos.importe};
  }));
}
// RF-C5: permite recuperar un recibo para volver a imprimirlo.
export async function obtenerPago(_usuario:Usuario,id:number) { const row=await db.select({pago:pagos,cliente:{id:clientes.id,nombre:clientes.nombre},usuario:{id:usuarios.id,nombre:usuarios.nombre}}).from(pagos).innerJoin(clientes,eq(pagos.clienteId,clientes.id)).innerJoin(usuarios,eq(pagos.usuarioId,usuarios.id)).where(eq(pagos.id,id)).get(); if(!row) throw new ApiError(404,"NO_ENCONTRADO","Recibo no encontrado");const movimientos=await db.select().from(movimientosCuenta).where(eq(movimientosCuenta.clienteId,row.cliente.id)).orderBy(asc(movimientosCuenta.creado),asc(movimientosCuenta.id));let saldoCliente=0;for(const m of movimientos){saldoCliente+=m.tipo==="debito"?m.importe:-m.importe;if(m.pagoId===id)break;} return {id:row.pago.id,numeroRecibo:numeroRecibo(row.pago.numero),fecha:row.pago.creado,cliente:row.cliente,importe:row.pago.importe,medio:row.pago.medio,observacion:row.pago.observacion,usuario:row.usuario,saldoCliente}; }
