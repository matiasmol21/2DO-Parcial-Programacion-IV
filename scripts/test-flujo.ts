import assert from "node:assert/strict";

async function main() {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error("Ejecutá la prueba con npm run test:flujo");
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  delete process.env.DATABASE_AUTH_TOKEN;
  const { db, client } = await import("../db");
  try {
    const { migrate } = await import("drizzle-orm/libsql/migrator"),
      { eq, sql } = await import("drizzle-orm"),
      s = await import("../db/schema");
    const { emitirFactura, anularFactura } =
        await import("../lib/services/facturas"),
      { registrarPago, obtenerPago } = await import("../lib/services/pagos"),
      { crearCliente, obtenerCliente } =
        await import("../lib/services/clientes"),
      { registrarMovimiento } = await import("../lib/services/stock");
    const { crearUsuario, editarUsuario, listarUsuarios } =
        await import("../lib/services/usuarios"),
      { crearCategoria, editarCategoria } =
        await import("../lib/services/categorias"),
      { obtenerTablero } = await import("../lib/services/tablero");
    const {
        listarProductos,
        crearProducto,
        editarProducto,
        listarMovimientos,
      } = await import("../lib/services/productos"),
      { listarFacturas } = await import("../lib/services/facturas");
    await migrate(db, { migrationsFolder: "./drizzle" });
    const ahora = new Date().toISOString();
    const [admin] = await db
      .insert(s.usuarios)
      .values({
        nombre: "Admin",
        email: "admin@test.local",
        passwordHash: "sin uso",
        rol: "admin",
        creado: ahora,
      })
      .returning();
    const [vendedor] = await db
      .insert(s.usuarios)
      .values({
        nombre: "Vendedor",
        email: "vendedor@test.local",
        passwordHash: "sin uso",
        rol: "vendedor",
        creado: ahora,
      })
      .returning();
    await assert.rejects(
      () =>
        crearUsuario(vendedor, {
          nombre: "Otro",
          email: "otro@test.local",
          rol: "vendedor",
          password: "12345678",
        }),
      (e) =>
        typeof e === "object" &&
        e !== null &&
        "status" in e &&
        e.status === 403,
    );
    await assert.rejects(
      () => editarUsuario(admin, admin.id, { activo: false }),
      (e) =>
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        e.code === "OPERACION_SOBRE_SI_MISMO",
    );
    const catTemporal = await crearCategoria(admin, { nombre: "Temporal" });
    await editarCategoria(admin, catTemporal.id, { activa: false });
    const [categoria] = await db
      .insert(s.categorias)
      .values({ nombre: "Prueba", creado: ahora })
      .returning();
    const inicial = await crearProducto(admin, {
      codigo: "INICIAL",
      descripcion: "Con stock",
      categoriaId: categoria.id,
      precio: 100,
      stockMinimo: 1,
      stockInicial: 4,
    });
    assert.equal(inicial.existencia, 4);
    assert.equal(inicial.categoria.nombre, "Prueba");
    const movimientosIniciales = await listarMovimientos(
      admin,
      inicial.id,
      new URLSearchParams("pageSize=1"),
    );
    assert.equal(movimientosIniciales.total, 1);
    assert.equal(movimientosIniciales.data[0].cantidad, 4);
    await assert.rejects(() =>
      editarProducto(admin, inicial.id, { existencia: 500 }),
    );
    const [producto] = await db
      .insert(s.productos)
      .values({
        codigo: "T1",
        descripcion: "Producto",
        categoriaId: categoria.id,
        precio: 125000,
        stockMinimo: 0,
        creado: ahora,
      })
      .returning();
    await registrarMovimiento(admin, {
      productoId: producto.id,
      tipo: "ingreso",
      cantidad: 3,
      motivo: "Inicial",
    });
    const cliente = await crearCliente(vendedor, {
      tipoDoc: "DNI",
      nroDoc: "30.123.456",
      nombre: "Cliente",
      cuentaCorriente: true,
      limiteCredito: 500000,
    });
    await assert.rejects(
      () =>
        crearCliente(vendedor, {
          tipoDoc: "DNI",
          nroDoc: "30123456",
          nombre: "Duplicado",
        }),
      (e) =>
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        e.code === "DOCUMENTO_DUPLICADO",
    );
    await assert.rejects(
      () =>
        registrarMovimiento(vendedor, {
          productoId: producto.id,
          tipo: "egreso",
          cantidad: 1,
          motivo: "Prueba",
        }),
      (e) =>
        typeof e === "object" &&
        e !== null &&
        "status" in e &&
        e.status === 403,
    );
    const primera = await emitirFactura(vendedor, {
      clienteId: cliente.id,
      items: [{ productoId: producto.id, cantidad: 2 }],
      pago: { forma: "cuenta_corriente" },
    });
    assert.equal(primera.total, 250000);
    assert.equal(primera.cliente?.nombre, "Cliente");
    assert.equal(primera.items[0].precioUnitario, 125000);
    assert.equal((await obtenerCliente(admin, cliente.id)).saldo, 250000);
    await assert.rejects(
      () =>
        registrarPago(vendedor, cliente.id, {
          importe: 250001,
          medio: "efectivo",
        }),
      (e) =>
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        e.code === "PAGO_SUPERA_DEUDA",
    );
    const pago = await registrarPago(vendedor, cliente.id, {
      importe: 50000,
      medio: "transferencia",
    });
    assert.equal((await obtenerPago(admin, pago.id)).saldoCliente, 200000);
    assert.equal((await obtenerCliente(admin, cliente.id)).saldo, 200000);
    await assert.rejects(
      () =>
        emitirFactura(vendedor, {
          clienteId: null,
          items: [{ productoId: producto.id, cantidad: 2 }],
          pago: { forma: "contado" },
        }),
      (e) =>
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        e.code === "STOCK_INSUFICIENTE",
    );
    const segunda = await emitirFactura(vendedor, {
      clienteId: null,
      items: [{ productoId: producto.id, cantidad: 1 }],
      pago: { forma: "contado" },
    });
    assert.equal(segunda.numeroFormateado, "0001-00000002");
    await assert.rejects(
      () => anularFactura(vendedor, segunda.id, { motivo: "Prueba" }),
      (e) =>
        typeof e === "object" &&
        e !== null &&
        "status" in e &&
        e.status === 403,
    );
    const anulada = await anularFactura(admin, segunda.id, {
      motivo: "Prueba",
    });
    assert.equal(anulada.anulacion?.usuario?.id, admin.id);
    assert.ok(anulada.anulacion?.fecha);
    const actual = await db
      .select()
      .from(s.productos)
      .where(eq(s.productos.id, producto.id))
      .get();
    const suma = await db
      .select({ valor: sql<number>`sum(${s.movimientosStock.cantidad})` })
      .from(s.movimientosStock)
      .where(eq(s.movimientosStock.productoId, producto.id))
      .get();
    assert.equal(actual?.existencia, 1);
    assert.equal(suma?.valor, actual?.existencia);
    const ventasSimultaneas = await Promise.allSettled(
      [1, 2].map(() =>
        emitirFactura(vendedor, {
          clienteId: null,
          items: [{ productoId: producto.id, cantidad: 1 }],
          pago: { forma: "contado" },
        }),
      ),
    );
    assert.equal(
      ventasSimultaneas.filter((r) => r.status === "fulfilled").length,
      1,
      "Solo una venta de la última unidad debe confirmarse",
    );
    const rechazada = ventasSimultaneas.find((r) => r.status === "rejected");
    assert.ok(rechazada && rechazada.status === "rejected");
    assert.equal(rechazada.reason.code, "STOCK_INSUFICIENTE");
    const final = await db
      .select()
      .from(s.productos)
      .where(eq(s.productos.id, producto.id))
      .get();
    const sumaFinal = await db
      .select({ valor: sql<number>`sum(${s.movimientosStock.cantidad})` })
      .from(s.movimientosStock)
      .where(eq(s.movimientosStock.productoId, producto.id))
      .get();
    assert.equal(final?.existencia, 0);
    assert.equal(sumaFinal?.valor, 0);
    const tablero = await obtenerTablero(admin);
    assert.equal(tablero.ventasDiarias.length, 30);
    assert.equal(tablero.mes.cantidad, 2);
    assert.equal(tablero.cuentasCorrientes.totalAdeudado, 200000);
    assert.equal(
      (await listarProductos(admin, new URLSearchParams("q=T1"))).total,
      1,
    );
    assert.equal(
      (await listarUsuarios(admin, new URLSearchParams("q=Vendedor"))).total,
      1,
    );
    const lista = await listarFacturas(
      admin,
      new URLSearchParams("estado=anulada&pageSize=1"),
    );
    assert.equal(lista.total, 1);
    assert.equal(lista.data[0].id, segunda.id);
    const otro = await crearCliente(vendedor, {
      tipoDoc: "DNI",
      nroDoc: "33111111",
      nombre: "Prueba de pagos",
      cuentaCorriente: true,
      limiteCredito: 10000,
    });
    await emitirFactura(vendedor, {
      clienteId: otro.id,
      items: [{ productoId: inicial.id, cantidad: 4 }],
      pago: { forma: "cuenta_corriente" },
    });
    const pagosSimultaneos = await Promise.allSettled(
      [1, 2].map(() =>
        registrarPago(vendedor, otro.id, { importe: 300, medio: "efectivo" }),
      ),
    );
    assert.equal(
      pagosSimultaneos.filter((r) => r.status === "fulfilled").length,
      1,
      "Solo se puede cobrar una vez cuando dos pagos juntos superarían la deuda",
    );
    const pagoRechazado = pagosSimultaneos.find((r) => r.status === "rejected");
    assert.ok(pagoRechazado && pagoRechazado.status === "rejected");
    assert.equal(pagoRechazado.reason.code, "PAGO_SUPERA_DEUDA");
    assert.equal((await obtenerCliente(admin, otro.id)).saldo, 100);
    console.log(
      "Correcto: usuarios, categorías, clientes, ventas, pagos, stock, concurrencia y tablero.",
    );
  } finally {
    client.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
