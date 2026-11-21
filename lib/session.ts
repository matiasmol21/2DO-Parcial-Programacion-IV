import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
const secret = () => { const value=process.env.SESSION_SECRET; if (!value || value.length < 32) throw new Error("SESSION_SECRET debe tener al menos 32 caracteres"); return new TextEncoder().encode(value); };
export async function iniciarSesion(id:number) { const token=await new SignJWT({}).setProtectedHeader({alg:"HS256"}).setSubject(String(id)).setIssuedAt().setExpirationTime("8h").sign(secret()); (await cookies()).set("sesion",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:28800}); }
export async function usuarioActual() { const token=(await cookies()).get("sesion")?.value; if(!token) return null; try { const {payload}=await jwtVerify(token,secret()); const id=Number(payload.sub); if(!Number.isSafeInteger(id)) return null; const user=await db.select().from(usuarios).where(eq(usuarios.id,id)).get(); return user?.activo ? user : null; } catch { return null; } }
export async function exigirUsuario() { const user=await usuarioActual(); if(!user) throw new ApiError(401,"NO_AUTENTICADO","Iniciá sesión para continuar"); return user; }
