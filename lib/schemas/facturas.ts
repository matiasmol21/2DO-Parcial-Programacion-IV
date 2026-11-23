import { z } from "zod";
const item = z
  .object({
    productoId: z.number().int().safe().positive(),
    cantidad: z.number().int().safe().positive(),
  })
  .strict();
const pago = z.discriminatedUnion("forma", [
  z
    .object({
      forma: z.literal("contado"),
      montoRecibido: z.number().int().safe().nonnegative().optional(),
    })
    .strict(),
  z
    .object({
      forma: z.literal("tarjeta"),
      tarjeta: z
        .object({
          tipo: z.enum(["debito", "credito"]),
          marca: z.string().trim().min(1).max(40),
          ultimos4: z.string().regex(/^\d{4}$/),
        })
        .strict(),
    })
    .strict(),
  z.object({ forma: z.literal("cuenta_corriente") }).strict(),
]);
// RF-V1 a RF-V6: la petición nunca incluye precios ni números completos de tarjeta.
export const facturaSchema = z
  .object({
    clienteId: z.number().int().safe().positive().nullable(),
    items: z.array(item).min(1),
    pago,
  })
  .strict()
  .refine(
    (v) => new Set(v.items.map((i) => i.productoId)).size === v.items.length,
    { message: "No se permiten productos repetidos", path: ["items"] },
  );
export const anulacionSchema = z
  .object({
    motivo: z.string().trim().min(1, "El motivo es obligatorio").max(500),
  })
  .strict();
