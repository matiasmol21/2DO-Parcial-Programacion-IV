import { redirect } from "next/navigation";
import Shell from "@/components/shell";
import GestionUsuarios from "@/components/gestion-usuarios";
import { usuarioActual } from "@/lib/session";
export default async function Pagina() {
  const u = await usuarioActual();
  if (!u) redirect("/login");
  if (u.rol !== "admin") redirect("/");
  return (
    <Shell>
      <GestionUsuarios />
    </Shell>
  );
}
