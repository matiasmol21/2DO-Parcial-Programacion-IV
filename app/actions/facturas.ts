"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/session";
import { ejecutarAccion } from "@/lib/resultado-accion";
import { anularFactura } from "@/lib/services/facturas";

export async function anularFacturaAction(id: number, entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const factura = await anularFactura(usuario, id, entrada);

    revalidatePath("/ventas");
    revalidatePath(`/ventas/${id}`);
    revalidatePath("/productos");
    revalidatePath("/clientes");
    revalidatePath("/clientes/saldos");
    revalidatePath("/");
    return factura;
  });
}
