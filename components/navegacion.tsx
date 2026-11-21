"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const enlaces=[{href:"/",label:"Inicio",icon:"▦"},{href:"/ventas",label:"Ventas",icon:"▧"},{href:"/productos",label:"Productos",icon:"▤"},{href:"/clientes",label:"Clientes",icon:"♙"},{href:"/usuarios",label:"Usuarios",icon:"♙",admin:true}];
export default function Navegacion({admin}:{admin:boolean}){const ruta=usePathname();return <nav aria-label="Navegación principal" className="flex flex-wrap md:flex-col gap-1 mt-6">{enlaces.filter(e=>!e.admin||admin).map(e=>{const activo=e.href==="/"?ruta==="/":ruta.startsWith(e.href);return <Link key={e.href} href={e.href} aria-current={activo?"page":undefined} className={`rounded-md px-3 py-2 text-sm text-emerald-50 hover:bg-white/10 ${activo?"bg-white/15 font-semibold":""}`}><span aria-hidden="true" className="mr-3">{e.icon}</span>{e.label}</Link>;})}</nav>;}
