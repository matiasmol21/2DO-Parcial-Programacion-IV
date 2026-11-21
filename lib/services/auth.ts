import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";
// RF-U1: la contraseña se verifica contra el hash y nunca se devuelve.
export async function autenticar(input:unknown) { const datos=z.object({email:z.string().email(),password:z.string().min(1)}).strict().parse(input); const user=await db.select().from(usuarios).where(eq(usuarios.email,datos.email.toLowerCase())).get(); if(!user?.activo || !(await compare(datos.password,user.passwordHash))) throw new ApiError(401,"CREDENCIALES_INVALIDAS","Email o contraseña incorrectos"); return user; }
