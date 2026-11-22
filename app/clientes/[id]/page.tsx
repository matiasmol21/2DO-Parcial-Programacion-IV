import Shell from "@/components/shell";
import FichaCliente from "@/components/ficha-cliente";
import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/session";
import { consultarCuenta, obtenerCliente } from "@/lib/services/clientes";

type PropiedadesPagina = {
  params: Promise<{ id: string }>;
};

export default async function PaginaCliente({
  params,
}: PropiedadesPagina) {
  const usuario = await usuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  const { id } = await params;
  const identificador = Number(id);

  const [cliente, cuenta] = await Promise.all([
    obtenerCliente(usuario, identificador),
    consultarCuenta(usuario, identificador, new URLSearchParams()),
  ]);

  return (
    <Shell>
      <FichaCliente id={id} cliente={cliente} cuenta={cuenta} />
    </Shell>
  );
}
