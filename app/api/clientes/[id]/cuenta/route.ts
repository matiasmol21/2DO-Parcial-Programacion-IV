import { conUsuario, identificador } from "@/lib/api";
import { consultarCuenta } from "@/lib/services/clientes";
export async function GET(request:Request,contexto:{params:Promise<{id:string}>}) { return conUsuario(async usuario=>Response.json(await consultarCuenta(usuario,identificador((await contexto.params).id),new URL(request.url).searchParams))); }
