import { ApiError, respuestaError } from "@/lib/errors";
import { exigirUsuario } from "@/lib/session";
export async function leerJson(request:Request):Promise<unknown> { try { return await request.json(); } catch { throw new ApiError(400,"JSON_INVALIDO","El cuerpo no es JSON válido"); } }
export function identificador(valor:string):number { const id=Number(valor); if(!Number.isSafeInteger(id)||id<1) throw new ApiError(404,"NO_ENCONTRADO","Recurso no encontrado"); return id; }
export async function conUsuario(fn:(usuario:Awaited<ReturnType<typeof exigirUsuario>>)=>Promise<Response>) { try { return await fn(await exigirUsuario()); } catch(error) { return respuestaError(error); } }
