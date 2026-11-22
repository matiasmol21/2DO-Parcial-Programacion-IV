import Shell from "@/components/shell";
import FichaProducto from "@/components/ficha-producto";
import { usuarioActual } from "@/lib/session";
export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await usuarioActual();
  return (
    <Shell>
      <FichaProducto id={(await params).id} admin={usuario?.rol === "admin"} />
    </Shell>
  );
}
