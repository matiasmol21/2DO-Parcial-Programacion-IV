import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { categorias, productos } from "@/db/schema";
import { ApiError, esErrorUnico } from "@/lib/errors";
import { usuarios } from "@/db/schema";
import {
  altaProductoSchema,
  edicionProductoSchema,
} from "@/lib/schemas/productos";
import { listarTodosMovimientos, moverStock } from "@/lib/services/stock";
type Usuario = typeof usuarios.$inferSelect;
// RF-P1: el stock se consulta, nunca se recibe al crear el producto.
export async function listarProductos(
  usuario: Usuario,
  p = new URLSearchParams(),
) {
  const busqueda = (p.get("q") || "").toLowerCase();
  const categoriaId = p.get("categoriaId");
  const soloBajoMinimo = p.get("bajoMinimo") === "true";
  const filtroActivo = p.get("activo");
  const pagina = Math.max(1, Number.parseInt(p.get("page") || "1", 10) || 1);
  const tamanoPagina = Math.min(
    100,
    Math.max(1, Number.parseInt(p.get("pageSize") || "20", 10) || 20),
  );

  const condiciones = [];
  if (filtroActivo === "todos" && usuario.rol === "admin") {
    // El administrador puede ver productos activos e inactivos.
  } else if (filtroActivo === "false" && usuario.rol === "admin") {
    condiciones.push(eq(productos.activo, false));
  } else {
    condiciones.push(eq(productos.activo, true));
  }

  if (busqueda) {
    const patron = `%${busqueda}%`;
    condiciones.push(
      like(
        sql`lower(${productos.codigo} || ' ' || ${productos.descripcion})`,
        patron,
      )!,
    );
  }

  if (categoriaId) {
    condiciones.push(eq(productos.categoriaId, Number(categoriaId)));
  }

  if (soloBajoMinimo) {
    condiciones.push(sql`${productos.existencia} < ${productos.stockMinimo}`);
  }

  const where = and(...condiciones);
  const filas = await db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      descripcion: productos.descripcion,
      categoria: categorias.nombre,
      categoriaId: productos.categoriaId,
      precio: productos.precio,
      existencia: productos.existencia,
      stockMinimo: productos.stockMinimo,
      activo: productos.activo,
    })
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(where)
    .orderBy(asc(productos.descripcion), asc(productos.id))
    .limit(tamanoPagina)
    .offset((pagina - 1) * tamanoPagina);
  const resultadoTotal = await db
    .select({ total: sql<number>`count(*)` })
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(where)
    .get();
  const datos = filas.map((producto) => ({
    ...producto,
    categoria: { id: producto.categoriaId, nombre: producto.categoria },
    bajoMinimo: producto.existencia < producto.stockMinimo,
  }));

  return {
    data: datos,
    total: resultadoTotal?.total ?? 0,
    page: pagina,
    pageSize: tamanoPagina,
  };
}
// RF-P2: la autorización se aplica en el servidor.
export async function crearProducto(usuario: Usuario, input: unknown) {
  const { stockInicial = 0, ...datos } = altaProductoSchema.parse(input);
  if (usuario.rol !== "admin")
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Solo el administrador puede crear productos",
    );
  try {
    const id = await db.transaction(async (tx) => {
      const categoria = await tx
        .select()
        .from(categorias)
        .where(eq(categorias.id, datos.categoriaId))
        .get();
      if (!categoria?.activa)
        throw new ApiError(
          422,
          "VALIDACION",
          "La categoría no existe o está inactiva",
        );
      const [p] = await tx
        .insert(productos)
        .values({ ...datos, creado: new Date().toISOString() })
        .returning();
      if (stockInicial > 0)
        await moverStock(tx, {
          productoId: p.id,
          usuarioId: usuario.id,
          tipo: "ingreso",
          cantidad: stockInicial,
          motivo: "Stock inicial",
        });
      return p.id;
    });
    return obtenerProducto(usuario, id);
  } catch (e) {
    if (esErrorUnico(e))
      throw new ApiError(
        409,
        "CODIGO_DUPLICADO",
        "Ya existe un producto con ese código",
      );
    throw e;
  }
}
export async function listarCategorias(_usuario: Usuario) {
  return db
    .select()
    .from(categorias)
    .where(eq(categorias.activa, true))
    .orderBy(categorias.nombre);
}
// RF-P1/P6: ficha de producto e historial.
export async function obtenerProducto(_usuario: Usuario, id: number) {
  const producto = await db
    .select({
      id: productos.id,
      codigo: productos.codigo,
      descripcion: productos.descripcion,
      categoriaId: productos.categoriaId,
      categoria: categorias.nombre,
      precio: productos.precio,
      existencia: productos.existencia,
      stockMinimo: productos.stockMinimo,
      activo: productos.activo,
    })
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(eq(productos.id, id))
    .get();
  if (!producto)
    throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado");
  return {
    ...producto,
    categoria: { id: producto.categoriaId, nombre: producto.categoria },
    bajoMinimo: producto.existencia < producto.stockMinimo,
  };
}
// RF-P2/P3: la existencia se ajusta mediante movimientos de stock.
export async function editarProducto(
  usuario: Usuario,
  id: number,
  input: unknown,
) {
  const { existencia: existenciaDeseada, ...datos } =
    edicionProductoSchema.parse(input);
  if (usuario.rol !== "admin")
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Solo el administrador puede editar productos",
    );
  return db
    .transaction(async (tx) => {
      const actual = await tx
        .select()
        .from(productos)
        .where(eq(productos.id, id))
        .get();
      if (!actual)
        throw new ApiError(404, "NO_ENCONTRADO", "Producto no encontrado");
      if (datos.categoriaId || datos.activo === true) {
        const cat = await tx
          .select()
          .from(categorias)
          .where(eq(categorias.id, datos.categoriaId || actual.categoriaId))
          .get();
        if (!cat?.activa)
          throw new ApiError(
            422,
            "VALIDACION",
            "La categoría no existe o está inactiva",
          );
      }
      try {
        if (Object.keys(datos).length > 0) {
          await tx
            .update(productos)
            .set(datos)
            .where(eq(productos.id, id));
        }
      } catch (e) {
        if (esErrorUnico(e))
          throw new ApiError(
            409,
            "CODIGO_DUPLICADO",
            "Ya existe un producto con ese código",
          );
        throw e;
      }

      if (
        existenciaDeseada !== undefined &&
        existenciaDeseada !== actual.existencia
      ) {
        const diferencia = existenciaDeseada - actual.existencia;
        await moverStock(tx, {
          productoId: id,
          usuarioId: usuario.id,
          tipo: diferencia > 0 ? "ingreso" : "egreso",
          cantidad: Math.abs(diferencia),
          motivo: "Ajuste de existencia desde edición",
        });
      }
    })
    .then(() => obtenerProducto(usuario, id));
}
export async function listarMovimientos(
  usuario: Usuario,
  id: number,
  p = new URLSearchParams(),
) {
  await obtenerProducto(usuario, id);
  const parametros = new URLSearchParams(p);
  parametros.set("productoId", String(id));
  return listarTodosMovimientos(usuario, parametros);
}
