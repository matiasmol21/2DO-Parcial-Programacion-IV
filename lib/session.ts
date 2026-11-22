import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ApiError } from "@/lib/errors";

const NOMBRE_COOKIE_SESION = "sesion";
const DURACION_SESION_SEGUNDOS = 8 * 60 * 60;

function obtenerClaveSecreta() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
  }

  return new TextEncoder().encode(secreto);
}

// La cookie está firmada, protegida contra JavaScript y expira a las ocho horas.
export async function iniciarSesion(usuarioId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(usuarioId))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(obtenerClaveSecreta());

  const cookieStore = await cookies();
  cookieStore.set(NOMBRE_COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  });
}

// Se busca el usuario en cada solicitud para respetar desactivaciones y cambios de rol.
export async function usuarioActual() {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOMBRE_COOKIE_SESION)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, obtenerClaveSecreta());
    const usuarioId = Number(payload.sub);
    if (!Number.isSafeInteger(usuarioId)) {
      return null;
    }

    const usuario = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, usuarioId))
      .get();

    return usuario?.activo ? usuario : null;
  } catch {
    return null;
  }
}

export async function exigirUsuario() {
  const usuario = await usuarioActual();
  if (!usuario) {
    throw new ApiError(401, "NO_AUTENTICADO", "Iniciá sesión para continuar");
  }

  return usuario;
}
