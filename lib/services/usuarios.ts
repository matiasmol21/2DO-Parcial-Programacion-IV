import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError, esErrorUnico } from "@/lib/errors";
type Usuario=typeof usuarios.$inferSelect;
const alta=z.object({nombre:z.string().trim().min(1).max(100),email:z.string().trim().email().transform(v=>v.toLowerCase()),rol:z.enum(["admin","vendedor"]),password:z.string().min(8).max(72)}).strict();
const edicion=alta.omit({password:true}).partial().extend({activo:z.boolean().optional()}).strict();
const publico=(u:Usuario)=>({id:u.id,nombre:u.nombre,email:u.email,rol:u.rol,activo:u.activo,creado:u.creado});
function admin(u:Usuario){if(u.rol!=="admin")throw new ApiError(403,"SIN_PERMISO","Solo el administrador puede gestionar usuarios");}
// RF-U4: nunca se expone el hash.
export async function listarUsuarios(u:Usuario,p=new URLSearchParams()){admin(u);const q=(p.get("q")||"").trim().toLowerCase(),activo=p.get("activo"),page=Math.max(1,parseInt(p.get("page")||"1",10)||1),pageSize=Math.min(100,Math.max(1,parseInt(p.get("pageSize")||"20",10)||20));const lista=(await db.select().from(usuarios)).map(publico).filter(x=>(!q||`${x.nombre} ${x.email}`.toLowerCase().includes(q))&&(activo!=="true"&&activo!=="false"||x.activo===(activo==="true"))).sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"));return {data:lista.slice((page-1)*pageSize,page*pageSize),total:lista.length,page,pageSize};}
// RF-U4: el email es único y la contraseña se guarda con bcrypt.
export async function crearUsuario(u:Usuario,input:unknown){const d=alta.parse(input);admin(u);try{const [nuevo]=await db.insert(usuarios).values({nombre:d.nombre,email:d.email,rol:d.rol,passwordHash:await hash(d.password,12),creado:new Date().toISOString()}).returning();return publico(nuevo);}catch(e){if(esErrorUnico(e))throw new ApiError(409,"EMAIL_DUPLICADO","Ya existe un usuario con ese email");throw e;}}
// RF-U4: el administrador no puede quitarse sus propios permisos ni desactivarse.
export async function editarUsuario(u:Usuario,id:number,input:unknown){const d=edicion.parse(input);admin(u);if(id===u.id&&(d.activo===false||(d.rol&&d.rol!=="admin")))throw new ApiError(422,"OPERACION_SOBRE_SI_MISMO","No podés quitarte el rol ni desactivarte");try{const [cambiado]=await db.update(usuarios).set(d).where(eq(usuarios.id,id)).returning();if(!cambiado)throw new ApiError(404,"NO_ENCONTRADO","Usuario no encontrado");return publico(cambiado);}catch(e){if(esErrorUnico(e))throw new ApiError(409,"EMAIL_DUPLICADO","Ya existe un usuario con ese email");throw e;}}
// RF-U5: el administrador recibe una contraseña temporal solo una vez.
export async function restablecerPassword(u:Usuario,id:number){admin(u);const passwordTemporal=randomBytes(12).toString("base64url");const [cambiado]=await db.update(usuarios).set({passwordHash:await hash(passwordTemporal,12)}).where(eq(usuarios.id,id)).returning();if(!cambiado)throw new ApiError(404,"NO_ENCONTRADO","Usuario no encontrado");return {passwordTemporal};}
// RF-U5: el cambio propio requiere conocer la contraseña actual.
export async function cambiarPassword(u:Usuario,input:unknown){const d=z.object({actual:z.string().min(1),nueva:z.string().min(8).max(72)}).strict().parse(input);if(!await compare(d.actual,u.passwordHash))throw new ApiError(422,"CONTRASENA_ACTUAL_INCORRECTA","La contraseña actual es incorrecta");await db.update(usuarios).set({passwordHash:await hash(d.nueva,12)}).where(eq(usuarios.id,u.id));}
