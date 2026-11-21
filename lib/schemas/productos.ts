import { z } from "zod";
export const productoSchema=z.object({codigo:z.string().trim().min(1,"Ingresá un código").max(80),descripcion:z.string().trim().min(1,"Ingresá una descripción").max(200),categoriaId:z.number().int().positive(),precio:z.number().int().safe().nonnegative(),stockMinimo:z.number().int().safe().nonnegative()}).strict();
export const altaProductoSchema=productoSchema.extend({stockInicial:z.number().int().safe().nonnegative().optional()}).strict();
export const edicionProductoSchema=productoSchema.partial().extend({activo:z.boolean().optional()}).strict();
