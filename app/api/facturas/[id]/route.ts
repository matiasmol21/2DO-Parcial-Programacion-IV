import { conUsuario, identificador } from "@/lib/api";
import { obtenerFactura } from "@/lib/services/facturas";
export async function GET(_request:Request,contexto:{params:Promise<{id:string}>}) { return conUsuario(async usuario=>Response.json(await obtenerFactura(usuario,identificador((await contexto.params).id)))); }
