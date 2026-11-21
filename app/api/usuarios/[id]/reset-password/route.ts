import { conUsuario, identificador } from "@/lib/api";
import { restablecerPassword } from "@/lib/services/usuarios";
export async function POST(_r:Request,c:{params:Promise<{id:string}>}){return conUsuario(async u=>Response.json(await restablecerPassword(u,identificador((await c.params).id))));}
