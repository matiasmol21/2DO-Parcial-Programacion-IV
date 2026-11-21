import { conUsuario, leerJson } from "@/lib/api";
import { emitirFactura, listarFacturas } from "@/lib/services/facturas";
export async function GET(request:Request) { return conUsuario(async usuario=>Response.json(await listarFacturas(usuario,new URL(request.url).searchParams))); }
export async function POST(request:Request) { return conUsuario(async usuario=>Response.json(await emitirFactura(usuario,await leerJson(request)),{status:201})); }
