import { conUsuario, identificador, leerJson } from "@/lib/api";
import { editarCategoria } from "@/lib/services/categorias";
export async function PATCH(r:Request,c:{params:Promise<{id:string}>}){return conUsuario(async u=>Response.json(await editarCategoria(u,identificador((await c.params).id),await leerJson(r))));}
