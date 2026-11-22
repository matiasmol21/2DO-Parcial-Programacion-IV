import { conUsuario, identificador, leerJson } from "@/lib/api";
import { editarUsuario } from "@/lib/services/usuarios";
export async function PATCH(
  r: Request,
  c: { params: Promise<{ id: string }> },
) {
  return conUsuario(async (u) =>
    Response.json(
      await editarUsuario(
        u,
        identificador((await c.params).id),
        await leerJson(r),
      ),
    ),
  );
}
