import { ApiError, respuestaError } from "@/lib/errors";
import { exigirUsuario } from "@/lib/session";

// Lee el cuerpo JSON y usa el mismo error de API si el contenido está mal formado.
export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo no es JSON válido");
  }
}

export function identificador(valor: string): number {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new ApiError(404, "NO_ENCONTRADO", "Recurso no encontrado");
  }

  return id;
}

// Centraliza autenticación y traducción de errores para los Route Handlers.
export async function conUsuario(
  ejecutar: (
    usuario: Awaited<ReturnType<typeof exigirUsuario>>,
  ) => Promise<Response>,
) {
  try {
    const usuario = await exigirUsuario();
    return await ejecutar(usuario);
  } catch (error) {
    return respuestaError(error);
  }
}
