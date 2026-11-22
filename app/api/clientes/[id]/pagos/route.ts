import { conUsuario, identificador, leerJson } from "@/lib/api";
import { registrarPago } from "@/lib/services/pagos";
export async function POST(
  request: Request,
  contexto: { params: Promise<{ id: string }> },
) {
  return conUsuario(async (usuario) =>
    Response.json(
      await registrarPago(
        usuario,
        identificador((await contexto.params).id),
        await leerJson(request),
      ),
      { status: 201 },
    ),
  );
}
