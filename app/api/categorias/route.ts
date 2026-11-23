import { exigirUsuario } from "@/lib/session";
import { listarCategorias } from "@/lib/services/productos";
import { respuestaError } from "@/lib/errors";
import { conUsuario, leerJson } from "@/lib/api";
import { crearCategoria } from "@/lib/services/categorias";
export async function GET() {
  try {
    return Response.json(await listarCategorias(await exigirUsuario()));
  } catch (error) {
    return respuestaError(error);
  }
}
export async function POST(r: Request) {
  return conUsuario(async (u) =>
    Response.json(await crearCategoria(u, await leerJson(r)), { status: 201 }),
  );
}
