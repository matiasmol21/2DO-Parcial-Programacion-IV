import { exigirUsuario } from "@/lib/session";
import { registrarMovimiento } from "@/lib/services/stock";
import { ApiError, respuestaError } from "@/lib/errors";
import { conUsuario } from "@/lib/api";
import { listarTodosMovimientos } from "@/lib/services/stock";
export async function GET(request: Request) {
  return conUsuario(async (usuario) =>
    Response.json(
      await listarTodosMovimientos(usuario, new URL(request.url).searchParams),
    ),
  );
}
export async function POST(request: Request) {
  try {
    const usuario = await exigirUsuario();
    let datos;
    try {
      datos = await request.json();
    } catch {
      throw new ApiError(400, "JSON_INVALIDO", "El cuerpo no es JSON válido");
    }
    return Response.json(await registrarMovimiento(usuario, datos), {
      status: 201,
    });
  } catch (error) {
    return respuestaError(error);
  }
}
