import { conUsuario, leerJson } from "@/lib/api";
import { crearUsuario, listarUsuarios } from "@/lib/services/usuarios";
export async function GET(r: Request) {
  return conUsuario(async (u) =>
    Response.json(await listarUsuarios(u, new URL(r.url).searchParams)),
  );
}
export async function POST(r: Request) {
  return conUsuario(async (u) =>
    Response.json(await crearUsuario(u, await leerJson(r)), { status: 201 }),
  );
}
