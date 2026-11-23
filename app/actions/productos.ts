"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/session";
import { ejecutarAccion } from "@/lib/resultado-accion";
import {
  crearProducto,
  editarProducto,
} from "@/lib/services/productos";
import { registrarMovimiento } from "@/lib/services/stock";

function actualizarVistasProducto(id?: number) {
  revalidatePath("/productos");

  if (id) {
    revalidatePath(`/productos/${id}`);
  }
}

export async function crearProductoAction(entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const producto = await crearProducto(usuario, entrada);

    actualizarVistasProducto(producto.id);
    return producto;
  });
}

export async function editarProductoAction(id: number, entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const producto = await editarProducto(usuario, id, entrada);

    actualizarVistasProducto(id);
    return producto;
  });
}

export async function registrarMovimientoAction(entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const movimiento = await registrarMovimiento(usuario, entrada);

    actualizarVistasProducto(movimiento.productoId);
    return movimiento;
  });
}
