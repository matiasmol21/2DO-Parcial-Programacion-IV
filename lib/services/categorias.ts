import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categorias, productos, usuarios } from "@/db/schema";
import { ApiError, esErrorUnico } from "@/lib/errors";
type Usuario=typeof usuarios.$inferSelect;
const esquema=z.object({nombre:z.string().trim().min(1).max(100)}).strict();
const edicion=esquema.partial().extend({activa:z.boolean().optional()}).strict();
function admin(u:Usuario){if(u.rol!=="admin")throw new ApiError(403,"SIN_PERMISO","Solo el administrador puede gestionar categorías");}
// RF-P7: alta de categoría con nombre único.
export async function crearCategoria(u:Usuario,input:unknown){const d=esquema.parse(input);admin(u);try{const [c]=await db.insert(categorias).values({...d,creado:new Date().toISOString()}).returning();return c;}catch(e){if(esErrorUnico(e))throw new ApiError(409,"NOMBRE_DUPLICADO","Ya existe una categoría con ese nombre");throw e;}}
// RF-P7: no se desactiva una categoría que tiene productos activos.
export async function editarCategoria(u:Usuario,id:number,input:unknown){const d=edicion.parse(input);admin(u);return db.transaction(async tx=>{const c=await tx.select().from(categorias).where(eq(categorias.id,id)).get();if(!c)throw new ApiError(404,"NO_ENCONTRADO","Categoría no encontrada");if(d.activa===false&&await tx.select().from(productos).where(and(eq(productos.categoriaId,id),eq(productos.activo,true))).get())throw new ApiError(409,"CATEGORIA_EN_USO","La categoría tiene productos activos");try{const [resultado]=await tx.update(categorias).set(d).where(eq(categorias.id,id)).returning();return resultado;}catch(e){if(esErrorUnico(e))throw new ApiError(409,"NOMBRE_DUPLICADO","Ya existe una categoría con ese nombre");throw e;}});}
