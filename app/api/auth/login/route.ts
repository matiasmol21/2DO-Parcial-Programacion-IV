import { autenticar } from "@/lib/services/auth";
import { iniciarSesion } from "@/lib/session";
import { respuestaError, ApiError } from "@/lib/errors";
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "JSON_INVALIDO", "El cuerpo no es JSON válido");
    }
    const user = await autenticar(body);
    await iniciarSesion(user.id);
    return Response.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
  } catch (error) {
    return respuestaError(error);
  }
}
