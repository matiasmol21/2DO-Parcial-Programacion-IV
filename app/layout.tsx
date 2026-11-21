import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Mostrador | Gestión comercial", description:"Sistema de gestión comercial para práctica" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="es"><body>{children}</body></html>; }
