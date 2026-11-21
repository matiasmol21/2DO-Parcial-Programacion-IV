"use client";
import { Button } from "@/components/ui/button";

export default function Imprimir() { return <Button variant="plain" size="plain" className="button" onClick={()=>window.print()}>Imprimir comprobante</Button>; }
