import { z } from "zod";

const textoOpcional = z.string().trim().max(200).nullable().optional();
// RF-C2: el mismo esquema se usa en el formulario y el servicio.
export const clienteSchema = z
  .object({
    tipoDoc: z.enum(["DNI", "CUIT"]),
    nroDoc: z
      .string()
      .trim()
      .min(1, "Ingresá el documento")
      .max(30)
      .refine(
        (v) => /^\d+$/.test(v.replace(/[.\-\s]/g, "")),
        "El documento debe contener dígitos",
      ),
    nombre: z.string().trim().min(1, "Ingresá el nombre").max(120),
    domicilio: textoOpcional,
    telefono: textoOpcional,
    email: z
      .union([
        z.string().trim().email("Ingresá un email válido"),
        z.literal(""),
        z.null(),
      ])
      .optional(),
    cuentaCorriente: z.boolean().default(false),
    limiteCredito: z.number().int().safe().nonnegative().nullable().optional(),
  })
  .strict();
export const editarClienteSchema = clienteSchema
  .partial()
  .extend({ activo: z.boolean().optional() })
  .strict();
export const pagoSchema = z
  .object({
    importe: z
      .number()
      .int()
      .safe()
      .positive("El importe debe ser mayor a cero"),
    medio: z.enum(["efectivo", "transferencia", "tarjeta_debito"]),
    observacion: z.string().trim().max(500).nullable().optional(),
  })
  .strict();
