import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError, esErrorUnico } from "@/lib/errors";

type Usuario = typeof usuarios.$inferSelect;

const esquemaAlta = z
  .object({
    nombre: z.string().trim().min(1).max(100),
    email: z
      .string()
      .trim()
      .email()
      .transform((email) => email.toLowerCase()),
    rol: z.enum(["admin", "vendedor"]),
    password: z.string().min(8).max(72),
  })
  .strict();

const esquemaEdicion = esquemaAlta
  .omit({ password: true })
  .partial()
  .extend({ activo: z.boolean().optional() })
  .strict();

function usuarioPublico(usuario: Usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    creado: usuario.creado,
  };
}

function exigirAdministrador(usuario: Usuario) {
  if (usuario.rol !== "admin") {
    throw new ApiError(
      403,
      "SIN_PERMISO",
      "Solo el administrador puede gestionar usuarios",
    );
  }
}

// RF-U4: nunca se expone el hash de la contraseña.
export async function listarUsuarios(
  usuario: Usuario,
  parametros = new URLSearchParams(),
) {
  exigirAdministrador(usuario);

  const busqueda = (parametros.get("q") || "").trim().toLowerCase();
  const filtroActivo = parametros.get("activo");
  const pagina = Math.max(
    1,
    Number.parseInt(parametros.get("page") || "1", 10) || 1,
  );
  const tamanoPagina = Math.min(
    100,
    Math.max(1, Number.parseInt(parametros.get("pageSize") || "20", 10) || 20),
  );

  const condiciones = [];
  if (busqueda) {
    const patron = `%${busqueda}%`;
    condiciones.push(
      or(
        like(sql`lower(${usuarios.nombre})`, patron),
        like(sql`lower(${usuarios.email})`, patron),
      )!,
    );
  }

  if (["true", "false"].includes(filtroActivo || "")) {
    condiciones.push(eq(usuarios.activo, filtroActivo === "true"));
  }

  const where = and(...condiciones);
  const filas = await db
    .select()
    .from(usuarios)
    .where(where)
    // SQLite ordena ignorando mayúsculas; el id desempata nombres iguales.
    .orderBy(sql`lower(${usuarios.nombre}) collate nocase`, asc(usuarios.id))
    .limit(tamanoPagina)
    .offset((pagina - 1) * tamanoPagina);
  const resultadoTotal = await db
    .select({ total: sql<number>`count(*)` })
    .from(usuarios)
    .where(where)
    .get();

  return {
    data: filas.map(usuarioPublico),
    total: resultadoTotal?.total ?? 0,
    page: pagina,
    pageSize: tamanoPagina,
  };
}

// RF-U4: el email es único y la contraseña se guarda con bcrypt.
export async function crearUsuario(usuario: Usuario, entrada: unknown) {
  const datos = esquemaAlta.parse(entrada);
  exigirAdministrador(usuario);

  try {
    const [nuevoUsuario] = await db
      .insert(usuarios)
      .values({
        nombre: datos.nombre,
        email: datos.email,
        rol: datos.rol,
        passwordHash: await hash(datos.password, 12),
        creado: new Date().toISOString(),
      })
      .returning();

    return usuarioPublico(nuevoUsuario);
  } catch (error) {
    if (esErrorUnico(error)) {
      throw new ApiError(
        409,
        "EMAIL_DUPLICADO",
        "Ya existe un usuario con ese email",
      );
    }

    throw error;
  }
}

// RF-U4: el administrador no puede quitarse sus propios permisos ni desactivarse.
export async function editarUsuario(
  usuario: Usuario,
  id: number,
  entrada: unknown,
) {
  const datos = esquemaEdicion.parse(entrada);
  exigirAdministrador(usuario);

  const intentaPerderAcceso =
    datos.activo === false || (datos.rol && datos.rol !== "admin");
  if (id === usuario.id && intentaPerderAcceso) {
    throw new ApiError(
      422,
      "OPERACION_SOBRE_SI_MISMO",
      "No podés quitarte el rol ni desactivarte",
    );
  }

  try {
    const [usuarioActualizado] = await db
      .update(usuarios)
      .set(datos)
      .where(eq(usuarios.id, id))
      .returning();

    if (!usuarioActualizado) {
      throw new ApiError(404, "NO_ENCONTRADO", "Usuario no encontrado");
    }

    return usuarioPublico(usuarioActualizado);
  } catch (error) {
    if (esErrorUnico(error)) {
      throw new ApiError(
        409,
        "EMAIL_DUPLICADO",
        "Ya existe un usuario con ese email",
      );
    }

    throw error;
  }
}

// RF-U5: el administrador recibe una contraseña temporal solo una vez.
export async function restablecerPassword(usuario: Usuario, id: number) {
  exigirAdministrador(usuario);

  const passwordTemporal = randomBytes(12).toString("base64url");
  const passwordHash = await hash(passwordTemporal, 12);
  const [usuarioActualizado] = await db
    .update(usuarios)
    .set({ passwordHash })
    .where(eq(usuarios.id, id))
    .returning();

  if (!usuarioActualizado) {
    throw new ApiError(404, "NO_ENCONTRADO", "Usuario no encontrado");
  }

  return { passwordTemporal };
}

// RF-U5: para cambiar su contraseña, el usuario confirma la contraseña actual.
export async function cambiarPassword(usuario: Usuario, entrada: unknown) {
  const esquemaPassword = z
    .object({
      actual: z.string().min(1),
      nueva: z.string().min(8).max(72),
    })
    .strict();
  const datos = esquemaPassword.parse(entrada);
  const contrasenaCorrecta = await compare(datos.actual, usuario.passwordHash);

  if (!contrasenaCorrecta) {
    throw new ApiError(
      422,
      "CONTRASENA_ACTUAL_INCORRECTA",
      "La contraseña actual es incorrecta",
    );
  }

  const passwordHash = await hash(datos.nueva, 12);
  await db
    .update(usuarios)
    .set({ passwordHash })
    .where(eq(usuarios.id, usuario.id));
}
