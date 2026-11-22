import { conUsuario, identificador, leerJson } from "@/lib/api";
import { listarMovimientos } from "@/lib/services/productos";
import { registrarMovimiento } from "@/lib/services/stock";
type Contexto = { params: Promise<{ id: string }> };
export async function GET(r: Request, c: Contexto) {
  return conUsuario(async (u) =>
    Response.json(
      await listarMovimientos(
        u,
        identificador((await c.params).id),
        new URL(r.url).searchParams,
      ),
    ),
  );
}
export async function POST(r: Request, c: Contexto) {
  return conUsuario(async (u) => {
    const body = await leerJson(r);
    return Response.json(
      await registrarMovimiento(u, {
        ...(typeof body === "object" && body !== null ? body : {}),
        productoId: identificador((await c.params).id),
      }),
      { status: 201 },
    );
  });
}
