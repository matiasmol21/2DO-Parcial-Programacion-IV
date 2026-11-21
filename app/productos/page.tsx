import Shell from "@/components/shell";
import Catalogo from "@/components/catalogo";
import { usuarioActual } from "@/lib/session";
export default async function Productos() { const usuario=await usuarioActual();return <Shell><Catalogo admin={usuario?.rol==="admin"}/></Shell>; }
