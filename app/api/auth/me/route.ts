import { conUsuario } from "@/lib/api";
export async function GET(){return conUsuario(async u=>Response.json({id:u.id,nombre:u.nombre,email:u.email,rol:u.rol}));}
