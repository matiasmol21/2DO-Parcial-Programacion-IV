"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/session";
import { ejecutarAccion } from "@/lib/resultado-accion";
import {
  cambiarPassword,
  crearUsuario,
  editarUsuario,
  restablecerPassword,
} from "@/lib/services/usuarios";

export async function crearUsuarioAction(entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const nuevoUsuario = await crearUsuario(usuario, entrada);

    revalidatePath("/usuarios");
    return nuevoUsuario;
  });
}

export async function editarUsuarioAction(id: number, entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const usuarioActualizado = await editarUsuario(usuario, id, entrada);

    revalidatePath("/usuarios");
    return usuarioActualizado;
  });
}

export async function restablecerPasswordAction(id: number) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const resultado = await restablecerPassword(usuario, id);

    revalidatePath("/usuarios");
    return resultado;
  });
}

export async function cambiarPasswordAction(entrada: unknown) {
  return ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    await cambiarPassword(usuario, entrada);

    revalidatePath("/perfil");
    return { actualizado: true };
  });
}
