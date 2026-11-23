import { conUsuario, identificador, leerJson } from "@/lib/api";
import { anularFactura } from "@/lib/services/facturas";
export async function POST(
  request: Request,
  contexto: { params: Promise<{ id: string }> },
) {
  return conUsuario(async (usuario) =>
    Response.json(
      await anularFactura(
        usuario,
        identificador((await contexto.params).id),
        await leerJson(request),
      ),
    ),
  );
}
