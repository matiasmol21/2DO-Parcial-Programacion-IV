import { conUsuario, identificador } from "@/lib/api";
import { obtenerPago } from "@/lib/services/pagos";
export async function GET(
  _request: Request,
  contexto: { params: Promise<{ id: string }> },
) {
  return conUsuario(async (usuario) =>
    Response.json(
      await obtenerPago(usuario, identificador((await contexto.params).id)),
    ),
  );
}
