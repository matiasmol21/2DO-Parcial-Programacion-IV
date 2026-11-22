import { conUsuario } from "@/lib/api";
import { proximoNumero } from "@/lib/services/facturas";
export async function GET() {
  return conUsuario(async (u) => Response.json(await proximoNumero(u)));
}
