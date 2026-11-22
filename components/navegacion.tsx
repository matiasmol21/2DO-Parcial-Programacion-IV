"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ReceiptText, Package, Users, UserCog } from "lucide-react";
const enlaces=[{href:"/",label:"Inicio",icon:LayoutDashboard},{href:"/ventas",label:"Ventas",icon:ReceiptText},{href:"/productos",label:"Productos",icon:Package},{href:"/clientes",label:"Clientes",icon:Users},{href:"/usuarios",label:"Usuarios",icon:UserCog,admin:true}];
export default function Navegacion({admin}:{admin:boolean}){const ruta=usePathname();return <nav aria-label="Navegación principal" className="flex flex-wrap md:flex-col gap-1 mt-7">{enlaces.filter(e=>!e.admin||admin).map(e=>{const Icon=e.icon;const activo=e.href==="/"?ruta==="/":ruta.startsWith(e.href);return <Link key={e.href} href={e.href} aria-current={activo?"page":undefined} className={`group flex items-center rounded-xl px-3 py-3 text-sm transition-colors ${activo?"bg-[#d8f26b] text-[#173b34] shadow-sm":"text-emerald-50/75 hover:bg-white/10 hover:text-white"}`}><Icon aria-hidden="true" className="mr-3 h-4 w-4"/>{e.label}</Link>;})}</nav>;}
