import { conUsuario, leerJson } from "@/lib/api";
import { crearCliente, listarClientes } from "@/lib/services/clientes";
export async function GET(request:Request) { return conUsuario(async usuario=>Response.json(await listarClientes(usuario,new URL(request.url).searchParams))); }
export async function POST(request:Request) { return conUsuario(async usuario=>Response.json(await crearCliente(usuario,await leerJson(request)),{status:201})); }
