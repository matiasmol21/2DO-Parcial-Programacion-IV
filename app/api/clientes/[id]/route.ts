import { conUsuario, identificador, leerJson } from "@/lib/api";
import { editarCliente, obtenerCliente } from "@/lib/services/clientes";
type Contexto = { params: Promise<{ id: string }> };
export async function GET(_request: Request, contexto: Contexto) {
  return conUsuario(async (usuario) =>
    Response.json(
      await obtenerCliente(usuario, identificador((await contexto.params).id)),
    ),
  );
}
export async function PATCH(request: Request, contexto: Contexto) {
  return conUsuario(async (usuario) =>
    Response.json(
      await editarCliente(
        usuario,
        identificador((await contexto.params).id),
        await leerJson(request),
      ),
    ),
  );
}
