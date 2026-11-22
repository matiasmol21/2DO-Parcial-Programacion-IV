import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categorias, productos, usuarios } from "@/db/schema";
import { ApiError, esErrorUnico } from "@/lib/errors";

type Usuario = typeof usuarios.$inferSelect;

const esquemaCategoria = z
  .object({
    nombre: z.string().trim().min(1).max(100),
  })
  .strict();

const esquemaEdicionCategoria = esquemaCategoria
  .partial()
  .extend({ activa: z.boolean().optional() })
  .strict();

function exigirAdministrador(usuario: Usuario) {
  if (usuario.rol !== "admin") {
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Solo el administrador puede gestionar categorías",
    );
  }
}

// RF-P7: crea una categoría con nombre único.
export async function crearCategoria(usuario: Usuario, entrada: unknown) {
  const datos = esquemaCategoria.parse(entrada);
  exigirAdministrador(usuario);

  try {
    const [categoria] = await db
      .insert(categorias)
      .values({
        ...datos,
        creado: new Date().toISOString(),
      })
      .returning();

    return categoria;
  } catch (error) {
    if (esErrorUnico(error)) {
      throw new ApiError(
        409,
        "NOMBRE_DUPLICADO",
        "Ya existe una categoría con ese nombre",
      );
    }

    throw error;
  }
}

// RF-P7: no permite desactivar una categoría con productos activos.
export async function editarCategoria(
  usuario: Usuario,
  id: number,
  entrada: unknown,
) {
  const datos = esquemaEdicionCategoria.parse(entrada);
  exigirAdministrador(usuario);

  return db.transaction(async (transaccion) => {
    const categoriaActual = await transaccion
      .select()
      .from(categorias)
      .where(eq(categorias.id, id))
      .get();

    if (!categoriaActual) {
      throw new ApiError(404, "NO_ENCONTRADO", "Categoría no encontrada");
    }

    const categoriaEnUso =
      datos.activa === false
        ? await transaccion
            .select()
            .from(productos)
            .where(
              and(eq(productos.categoriaId, id), eq(productos.activo, true)),
            )
            .get()
        : null;

    if (categoriaEnUso) {
      throw new ApiError(
        409,
        "CATEGORIA_EN_USO",
        "La categoría tiene productos activos",
      );
    }

    try {
      const [categoriaActualizada] = await transaccion
        .update(categorias)
        .set(datos)
        .where(eq(categorias.id, id))
        .returning();

      return categoriaActualizada;
    } catch (error) {
      if (esErrorUnico(error)) {
        throw new ApiError(
          409,
          "NOMBRE_DUPLICADO",
          "Ya existe una categoría con ese nombre",
        );
      }

      throw error;
    }
  });
}
