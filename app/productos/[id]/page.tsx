import { redirect } from "next/navigation";
import Shell from "@/components/shell";
import FichaProducto from "@/components/ficha-producto";
import { usuarioActual } from "@/lib/session";
import {
  listarCategorias,
  listarMovimientos,
  obtenerProducto,
} from "@/lib/services/productos";

type PropiedadesPagina = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function PaginaProducto({
  params,
  searchParams,
}: PropiedadesPagina) {
  const usuario = await usuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const { id } = await params;
  const filtros = await searchParams;
  const identificador = Number(id);
  const pagina = Math.max(1, Number.parseInt(filtros.page || "1", 10) || 1);
  const parametros = new URLSearchParams({ page: String(pagina) });

  const [producto, movimientos, categorias] = await Promise.all([
    obtenerProducto(usuario, identificador),
    listarMovimientos(usuario, identificador, parametros),
    listarCategorias(usuario),
  ]);

  return (
    <Shell>
      <FichaProducto
        id={id}
        admin={usuario.rol === "admin"}
        producto={producto}
        movimientos={movimientos}
        categorias={categorias}
        pagina={pagina}
      />
    </Shell>
  );
}
