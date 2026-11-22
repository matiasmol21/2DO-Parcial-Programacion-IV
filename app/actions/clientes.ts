"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/session";
import { ejecutarAccion } from "@/lib/resultado-accion";
import {
  crearCliente,
  editarCliente,
} from "@/lib/services/clientes";
import { registrarPago } from "@/lib/services/pagos";

function actualizarVistasCliente(id?: number) {
  revalidatePath("/clientes");
  revalidatePath("/clientes/saldos");
  revalidatePath("/");

  if (id) {
    revalidatePath(`/clientes/${id}`);
  }
}

export async function crearClienteAction(entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const cliente = await crearCliente(usuario, entrada);

    actualizarVistasCliente(cliente.id);
    revalidatePath("/ventas/nueva");
    return cliente;
  });
}

export async function editarClienteAction(id: number, entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const cliente = await editarCliente(usuario, id, entrada);

    actualizarVistasCliente(id);
    return cliente;
  });
}

export async function registrarPagoAction(id: number, entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const pago = await registrarPago(usuario, id, entrada);

    actualizarVistasCliente(id);
    revalidatePath(`/pagos/${pago.id}`);
    return pago;
  });
}
