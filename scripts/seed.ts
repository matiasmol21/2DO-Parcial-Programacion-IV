import { hash } from "bcryptjs";
import { db, client } from "../db";
import {
  usuarios,
  categorias,
  productos,
  clientes,
  facturas,
  facturaItems,
  movimientosStock,
  movimientosCuenta,
} from "../db/schema";
import { eq } from "drizzle-orm";
import { moverStock } from "../lib/services/stock";
import { emitirFactura } from "../lib/services/facturas";
async function main() {
  const ahora = new Date().toISOString();
  await db
    .insert(usuarios)
    .values([
      {
        email: "admin@ejemplo.com",
        nombre: "Administración",
        rol: "admin",
        passwordHash: await hash("Admin1234", 12),
        creado: ahora,
      },
      {
        email: "vendedor@ejemplo.com",
        nombre: "Vendedor de prueba",
        rol: "vendedor",
        passwordHash: await hash("Vendedor1234", 12),
        creado: ahora,
      },
    ])
    .onConflictDoNothing();
  for (const nombre of [
    "Herramientas",
    "Electricidad",
    "Pinturería",
    "Ferretería",
    "Plomería",
  ])
    await db
      .insert(categorias)
      .values({ nombre, creado: ahora })
      .onConflictDoNothing();
  const cats = await db.select().from(categorias);
  const admin = (await db.select().from(usuarios)).find(
    (u) => u.email === "admin@ejemplo.com",
  );
  if (!admin) throw new Error("No se encontró al administrador");
  const nombres = [
    "María López",
    "Juan Pérez",
    "Ana Gómez",
    "Carlos Díaz",
    "Lucía Fernández",
    "Martín Rodríguez",
    "Sofía Torres",
    "Javier Ruiz",
    "Valentina Romero",
    "Diego Sánchez",
  ];
  for (let i = 0; i < nombres.length; i++)
    await db
      .insert(clientes)
      .values({
        tipoDoc: "DNI",
        nroDoc: String(30000001 + i),
        nombre: nombres[i],
        cuentaHabilitada: true,
        limiteCredito: 100000000,
        activo: true,
        creado: ahora,
      })
      .onConflictDoNothing();
  for (let i = 1; i <= 30; i++) {
    const codigo = `PR-${String(i).padStart(3, "0")}`;
    await db.transaction(async (tx) => {
      const resultado = await tx
        .insert(productos)
        .values({
          codigo,
          descripcion: `Producto de prueba ${i}`,
          categoriaId: cats[(i - 1) % cats.length].id,
          precio: 100000 + i * 12500,
          stockMinimo: 5,
          existencia: 0,
          creado: ahora,
        })
        .onConflictDoNothing()
        .returning();
      if (resultado.length)
        await moverStock(tx, {
          productoId: resultado[0].id,
          usuarioId: admin.id,
          tipo: "ingreso",
          cantidad: 20,
          motivo: "Stock inicial",
        });
    });
  }
  // Los comprobantes se crean con el servicio real. Solo se generan si no hay ventas previas.
  const existentes = await db
    .select({ id: facturas.id })
    .from(facturas)
    .limit(1);
  if (!existentes.length) {
    const catalogo = await db.select().from(productos);
    const compradores = await db.select().from(clientes);
    for (let i = 0; i < 50; i++) {
      const producto = catalogo[i % catalogo.length];
      const cliente = compradores[i % compradores.length];
      const tipo = i % 3;
      const pago =
        tipo === 0
          ? { forma: "contado" }
          : tipo === 1
            ? {
                forma: "tarjeta",
                tarjeta: { tipo: "debito", marca: "Visa", ultimos4: "1234" },
              }
            : { forma: "cuenta_corriente" };
      const f = await emitirFactura(admin, {
        clienteId: tipo === 2 ? cliente.id : null,
        items: [{ productoId: producto.id, cantidad: 1 }],
        pago,
      });
      const fecha = new Date(Date.now() - (i % 30) * 86400000).toISOString();
      await db.transaction(async (tx) => {
        await tx
          .update(facturas)
          .set({ creado: fecha })
          .where(eq(facturas.id, f.id));
        await tx
          .update(facturaItems)
          .set({ creado: fecha })
          .where(eq(facturaItems.facturaId, f.id));
        await tx
          .update(movimientosStock)
          .set({ creado: fecha })
          .where(eq(movimientosStock.facturaId, f.id));
        await tx
          .update(movimientosCuenta)
          .set({ creado: fecha })
          .where(eq(movimientosCuenta.facturaId, f.id));
      });
    }
  }
  console.log("Datos iniciales cargados.");
  client.close();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
