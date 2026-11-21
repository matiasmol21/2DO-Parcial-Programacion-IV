import { conUsuario, identificador, leerJson } from "@/lib/api";
import { editarProducto, obtenerProducto } from "@/lib/services/productos";
type Contexto={params:Promise<{id:string}>};
export async function GET(_r:Request,c:Contexto){return conUsuario(async u=>Response.json(await obtenerProducto(u,identificador((await c.params).id))));}
export async function PATCH(r:Request,c:Contexto){return conUsuario(async u=>Response.json(await editarProducto(u,identificador((await c.params).id),await leerJson(r))));}
