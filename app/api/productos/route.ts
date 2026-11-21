import { exigirUsuario } from "@/lib/session";
import { crearProducto, listarProductos } from "@/lib/services/productos";
import { ApiError, respuestaError } from "@/lib/errors";
export async function GET(request:Request) { try { return Response.json(await listarProductos(await exigirUsuario(),new URL(request.url).searchParams)); } catch(error) { return respuestaError(error); } }
export async function POST(request:Request) { try { const usuario=await exigirUsuario(); let datos; try { datos=await request.json(); } catch { throw new ApiError(400,"JSON_INVALIDO","El cuerpo no es JSON válido"); } return Response.json(await crearProducto(usuario,datos),{status:201}); } catch(error) { return respuestaError(error); } }
