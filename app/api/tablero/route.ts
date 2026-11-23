import { conUsuario } from "@/lib/api";
import { obtenerTablero } from "@/lib/services/tablero";
export async function GET() {
  return conUsuario(async (u) => Response.json(await obtenerTablero(u)));
}
