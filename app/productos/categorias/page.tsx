import { redirect } from "next/navigation";
import Shell from "@/components/shell";
import Categorias from "@/components/categorias";
import { usuarioActual } from "@/lib/session";
import { listarCategorias } from "@/lib/services/productos";

export default async function PaginaCategorias() {
  const usuario = await usuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const categorias = await listarCategorias(usuario);

  return (
    <Shell>
      <Categorias admin={usuario.rol === "admin"} lista={categorias} />
    </Shell>
  );
}
