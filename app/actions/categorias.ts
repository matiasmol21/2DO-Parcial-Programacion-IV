"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/session";
import {
  crearCategoria,
  editarCategoria,
} from "@/lib/services/categorias";
import {
  ejecutarAccion,
  type ResultadoAccion,
} from "@/lib/resultado-accion";

type Categoria = {
  id: number;
  nombre: string;
  activa: boolean;
  creado: string;
};

export async function crearCategoriaAction(
  entrada: unknown,
): Promise<ResultadoAccion<Categoria>> {
  const resultado = await ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const categoria = await crearCategoria(usuario, entrada);

    revalidatePath("/productos");
    revalidatePath("/productos/categorias");
    return categoria;
  });

  return resultado as ResultadoAccion<Categoria>;
}

export async function editarCategoriaAction(
  id: number,
  entrada: unknown,
): Promise<ResultadoAccion<Categoria>> {
  const resultado = await ejecutarAccion(async () => {
    const usuario = await exigirUsuario();
    const categoria = await editarCategoria(usuario, id, entrada);

    revalidatePath("/productos");
    revalidatePath("/productos/categorias");
    return categoria;
  });

  return resultado as ResultadoAccion<Categoria>;
}
