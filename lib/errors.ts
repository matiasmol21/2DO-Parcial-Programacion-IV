import { ZodError } from "zod";
export class ApiError extends Error { constructor(public status:number, public code:string, message:string, public details?:unknown) { super(message); } }
export function esErrorUnico(error:unknown):boolean { let actual:unknown=error; for(let i=0;i<5&&actual;i++){if(String(actual).toUpperCase().includes("UNIQUE")) return true;actual=typeof actual==="object"&&"cause" in actual?(actual as {cause:unknown}).cause:null;}return false; }
export function respuestaError(error:unknown) {
  if (error instanceof ZodError) return Response.json({error:{code:"VALIDACION",message:"Revisá los datos ingresados",details:error.issues.map(issue=>({campo:issue.path.join("."),mensaje:issue.message}))}},{status:422});
  if (error instanceof ApiError) return Response.json({error:{code:error.code,message:error.message,details:error.details}},{status:error.status});
  console.error(error); return Response.json({error:{code:"ERROR_INTERNO",message:"Ocurrió un error inesperado"}},{status:500});
}
