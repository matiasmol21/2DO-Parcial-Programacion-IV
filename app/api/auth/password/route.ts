import { conUsuario, leerJson } from "@/lib/api";
import { cambiarPassword } from "@/lib/services/usuarios";
export async function PUT(r:Request){return conUsuario(async u=>{await cambiarPassword(u,await leerJson(r));return new Response(null,{status:204});});}
