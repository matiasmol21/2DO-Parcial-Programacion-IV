import Shell from "@/components/shell";
import Categorias from "@/components/categorias";
import { usuarioActual } from "@/lib/session";
export default async function Pagina() {
  const usuario = await usuarioActual();
  return (
    <Shell>
      <Categorias admin={usuario?.rol === "admin"} />
    </Shell>
  );
}
