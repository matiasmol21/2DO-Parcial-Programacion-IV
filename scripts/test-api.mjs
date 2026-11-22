import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";

// Base y servidor aislados: no se usan ni se modifican los datos de práctica.
const carpeta=mkdtempSync(join(tmpdir(),"parcial-api-"));
const env={...process.env,DATABASE_URL:pathToFileURL(join(carpeta,"api.db")).href,DATABASE_AUTH_TOKEN:"",SESSION_SECRET:"secreto-exclusivo-para-las-pruebas-locales",NEXT_BUILD_DIR:".next-build",NODE_ENV:"production"};
let servidor;
function ejecutar(script){const r=spawnSync(process.execPath,["--import","tsx",script],{env,encoding:"utf8"});if(r.status!==0)throw new Error(`${script}: ${r.stderr||r.stdout}`);}
function puertoLibre(){return new Promise((resolve,reject)=>{const s=createServer();s.on("error",reject);s.listen(0,"127.0.0.1",()=>{const port=s.address().port;s.close(()=>resolve(port));});});}
async function listo(base){const limite=Date.now()+60000;while(Date.now()<limite){if(servidor.exitCode!==null)throw new Error("El servidor de prueba terminó antes de iniciar");try{await fetch(`${base}/api/auth/me`);return;}catch{await new Promise(r=>setTimeout(r,300));}}throw new Error("El servidor de prueba no respondió");}
function comprobarListado(data){assert.ok(Array.isArray(data.data));assert.ok(Number.isInteger(data.page));assert.ok(Number.isInteger(data.pageSize));assert.ok(Number.isInteger(data.total));}

try {
 ejecutar("scripts/migrate.ts");ejecutar("scripts/seed.ts");
 const port=await puertoLibre(),base=`http://127.0.0.1:${port}`;
 servidor=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-p",String(port),"-H","127.0.0.1"],{env,stdio:["ignore","pipe","pipe"]});
 let salida="";servidor.stdout.on("data",d=>salida+=d);servidor.stderr.on("data",d=>salida+=d);
 await listo(base);
 async function request(path,{method="GET",body,cookie,esperado=200,raw}={}){const r=await fetch(base+path,{method,headers:{...(cookie?{cookie}:{}),...(body!==undefined||raw!==undefined?{"content-type":"application/json"}:{})},...(body!==undefined?{body:JSON.stringify(body)}:raw!==undefined?{body:raw}:{})});const texto=await r.text();let data;try{data=texto?JSON.parse(texto):null;}catch{throw new Error(`${method} ${path}: la respuesta no es JSON`);}assert.equal(r.status,esperado,`${method} ${path}: ${texto}`);return {data,response:r};}
 async function error(path,opciones,code){const {data}=await request(path,opciones);assert.equal(data?.error?.code,code,`${opciones.method||"GET"} ${path}`);return data.error;}
 const login=async(email,password)=>{const {response,data}=await request("/api/auth/login",{method:"POST",body:{email,password}});assert.ok(data.id&&data.email&&data.rol);const header=response.headers.get("set-cookie");assert.match(header,/httponly/i);assert.match(header,/samesite=lax/i);return header.split(";")[0];};
 await error("/api/auth/me",{esperado:401},"NO_AUTENTICADO");
 await error("/api/auth/login",{method:"POST",raw:"{",esperado:400},"JSON_INVALIDO");
 await error("/api/auth/login",{method:"POST",body:{email:"admin@ejemplo.com",password:"incorrecta"},esperado:401},"CREDENCIALES_INVALIDAS");
 const admin=await login("admin@ejemplo.com","Admin1234"),vendedor=await login("vendedor@ejemplo.com","Vendedor1234");
 const me=(await request("/api/auth/me",{cookie:admin})).data;assert.equal(me.rol,"admin");
 const vendedorActual=(await request("/api/auth/me",{cookie:vendedor})).data;
 // El seed debe alcanzar los mínimos que pide el parcial desde una base vacía.
 const productosIniciales = (
   await request("/api/productos?pageSize=100", { cookie: admin })
 ).data;
 const clientesIniciales = (
   await request("/api/clientes?pageSize=100", { cookie: admin })
 ).data;
 const usuariosIniciales = (
   await request("/api/usuarios?pageSize=100", { cookie: admin })
 ).data;
 const facturasIniciales = (
   await request("/api/facturas?pageSize=100", { cookie: admin })
 ).data;
 assert.equal(productosIniciales.total, 30, "El seed debe crear 30 productos");
 assert.equal(clientesIniciales.total, 10, "El seed debe crear 10 clientes");
 assert.equal(usuariosIniciales.total, 2, "El seed debe crear los dos roles");
 assert.equal(facturasIniciales.total, 50, "El seed debe crear 50 facturas");
 assert.equal(typeof facturasIniciales.totalEmitido, "number");
 await error("/api/usuarios",{cookie:vendedor,esperado:403},"SIN_PERMISO");
 const users=(await request("/api/usuarios?pageSize=1",{cookie:admin})).data;comprobarListado(users);assert.equal(users.data.length,1);assert.ok(!("passwordHash" in users.data[0]));
 const nuevo=(await request("/api/usuarios",{method:"POST",cookie:admin,esperado:201,body:{nombre:"Prueba",email:"api-prueba@ejemplo.com",rol:"vendedor",password:"Prueba1234"}})).data;
 const usuariosFiltrados=(await request("/api/usuarios?q=api-prueba&activo=true&pageSize=1",{cookie:admin})).data;comprobarListado(usuariosFiltrados);assert.equal(usuariosFiltrados.total,1);assert.equal(usuariosFiltrados.data[0].id,nuevo.id);
 const paginaUsuariosVacia=(await request("/api/usuarios?q=api-prueba&activo=true&page=2&pageSize=1",{cookie:admin})).data;assert.equal(paginaUsuariosVacia.total,1);assert.equal(paginaUsuariosVacia.data.length,0);
 await error("/api/usuarios",{method:"POST",cookie:admin,esperado:409,body:{nombre:"Duplicado",email:"api-prueba@ejemplo.com",rol:"vendedor",password:"Prueba1234"}},"EMAIL_DUPLICADO");
 await error(`/api/usuarios/${me.id}`,{method:"PATCH",cookie:admin,esperado:422,body:{activo:false}},"OPERACION_SOBRE_SI_MISMO");
 await request(`/api/usuarios/${nuevo.id}`,{method:"PATCH",cookie:admin,body:{nombre:"Prueba editada"}});
 const reset=(await request(`/api/usuarios/${nuevo.id}/reset-password`,{method:"POST",cookie:admin})).data;assert.ok(reset.passwordTemporal);
 const temporal=await login("api-prueba@ejemplo.com",reset.passwordTemporal);
 await error("/api/auth/password",{method:"PUT",cookie:temporal,esperado:422,body:{actual:"incorrecta",nueva:"Nueva1234"}},"CONTRASENA_ACTUAL_INCORRECTA");
 await request("/api/auth/password",{method:"PUT",cookie:temporal,esperado:204,body:{actual:reset.passwordTemporal,nueva:"Nueva1234"}});
 await request(`/api/usuarios/${nuevo.id}`,{method:"PATCH",cookie:admin,body:{activo:false}});
 await error("/api/auth/me",{cookie:temporal,esperado:401},"NO_AUTENTICADO");
 const cats=(await request("/api/categorias",{cookie:vendedor})).data;assert.ok(cats.length>=5);
 const cat=(await request("/api/categorias",{method:"POST",cookie:admin,esperado:201,body:{nombre:"Categoría API"}})).data;
 await error("/api/categorias",{method:"POST",cookie:admin,esperado:409,body:{nombre:"Categoría API"}},"NOMBRE_DUPLICADO");
 await request(`/api/categorias/${cat.id}`,{method:"PATCH",cookie:admin,body:{nombre:"Categoría API editada"}});
 const nuevoProducto={codigo:"API-001",descripcion:"Producto API",categoriaId:cat.id,precio:10000,stockMinimo:1,stockInicial:5};
 await error("/api/productos",{method:"POST",cookie:vendedor,esperado:403,body:nuevoProducto},"SIN_PERMISO");
 const prod=(await request("/api/productos",{method:"POST",cookie:admin,esperado:201,body:nuevoProducto})).data;assert.equal(prod.existencia,5);assert.equal(prod.categoria.id,cat.id);
 assert.equal((await request("/api/productos?pageSize=1000",{cookie:admin})).data.pageSize,100);
 const productosFiltrados=(await request("/api/productos?q=api-001&categoriaId="+cat.id+"&pageSize=1",{cookie:vendedor})).data;comprobarListado(productosFiltrados);assert.equal(productosFiltrados.total,1);assert.equal(productosFiltrados.data[0].id,prod.id);
 await error("/api/productos",{method:"POST",cookie:admin,esperado:409,body:nuevoProducto},"CODIGO_DUPLICADO");
 await error(`/api/productos/${prod.id}`,{method:"PATCH",cookie:admin,esperado:422,body:{existencia:99}},"VALIDACION");
 await error(`/api/categorias/${cat.id}`,{method:"PATCH",cookie:admin,esperado:409,body:{activa:false}},"CATEGORIA_EN_USO");
 await request(`/api/productos/${prod.id}`,{method:"PATCH",cookie:admin,body:{descripcion:"Producto editado"}});
 assert.equal((await request(`/api/productos/${prod.id}`,{cookie:vendedor})).data.descripcion,"Producto editado");
 comprobarListado((await request("/api/productos?q=API-001",{cookie:vendedor})).data);
 const productosBajoMinimo = (
   await request("/api/productos?bajoMinimo=true", { cookie: vendedor })
 ).data;
 comprobarListado(productosBajoMinimo);
 assert.ok(
   productosBajoMinimo.data.every(
     (producto) => producto.existencia < producto.stockMinimo,
   ),
 );
 const mov=(await request(`/api/productos/${prod.id}/movimientos`,{method:"POST",cookie:admin,esperado:201,body:{tipo:"ingreso",cantidad:2,motivo:"Reposición",observacion:"Caja"}})).data;assert.equal(mov.existenciaResultante,7);
 await error(`/api/productos/${prod.id}/movimientos`,{method:"POST",cookie:admin,esperado:409,body:{tipo:"egreso",cantidad:100,motivo:"Prueba"}},"STOCK_INSUFICIENTE");
 const movimientosProducto=(await request(`/api/productos/${prod.id}/movimientos?pageSize=1`,{cookie:vendedor})).data;comprobarListado(movimientosProducto);assert.equal(movimientosProducto.total,2);assert.equal(movimientosProducto.data.length,1);
 const segundaPaginaMovimientos=(await request(`/api/movimientos-stock?productoId=${prod.id}&page=2&pageSize=1`,{cookie:vendedor})).data;comprobarListado(segundaPaginaMovimientos);assert.equal(segundaPaginaMovimientos.total,2);assert.equal(segundaPaginaMovimientos.data.length,1);
 const hoyArgentina=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const movimientosDelDia=(await request(`/api/movimientos-stock?productoId=${prod.id}&tipo=ingreso&desde=${hoyArgentina}&hasta=${hoyArgentina}`,{cookie:vendedor})).data;assert.equal(movimientosDelDia.total,2);
 const cdata={tipoDoc:"DNI",nroDoc:"40000999",nombre:"Cliente API",cuentaCorriente:true,limiteCredito:50000};
 const cliente=(await request("/api/clientes",{method:"POST",cookie:vendedor,esperado:201,body:cdata})).data;
 await error("/api/clientes",{method:"POST",cookie:vendedor,esperado:409,body:cdata},"DOCUMENTO_DUPLICADO");
 await request(`/api/clientes/${cliente.id}`,{method:"PATCH",cookie:vendedor,body:{telefono:"12345678"}});
 assert.equal((await request(`/api/clientes/${cliente.id}`,{cookie:vendedor})).data.telefono,"12345678");
 const clientesConDeuda = (
   await request(
     "/api/clientes?conDeuda=true&orden=saldo&pageSize=100",
     { cookie: vendedor },
   )
 ).data;
 comprobarListado(clientesConDeuda);
 assert.equal(typeof clientesConDeuda.totalAdeudado,"number");
 const clientePorDocumento = (
   await request("/api/clientes?q=40.000.999", { cookie: vendedor })
 ).data;
 assert.equal(clientePorDocumento.total, 1);
 assert.equal(clientePorDocumento.data[0].id, cliente.id);
 const prox=(await request("/api/facturas/proximo-numero",{cookie:vendedor})).data;assert.match(prox.numeroFormateado,/^\d{4}-\d{8}$/);
 await error("/api/facturas",{method:"POST",cookie:vendedor,esperado:422,body:{clienteId:null,items:[{productoId:prod.id,cantidad:1}],pago:{forma:"cuenta_corriente"}}},"CUENTA_CORRIENTE_NO_HABILITADA");
 await error("/api/facturas",{method:"POST",cookie:vendedor,esperado:422,body:{clienteId:null,items:[{productoId:prod.id,cantidad:1}],pago:{forma:"tarjeta",tarjeta:{tipo:"credito",marca:"Visa",ultimos4:"1234",numero:"1234567890121234"}}}},"VALIDACION");
 await error("/api/facturas",{method:"POST",cookie:vendedor,esperado:422,body:{clienteId:null,items:[{productoId:prod.id,cantidad:1}],pago:{forma:"contado",montoRecibido:9999}}},"MONTO_INSUFICIENTE");
 await error("/api/facturas",{method:"POST",cookie:vendedor,esperado:422,body:{clienteId:cliente.id,items:[{productoId:prod.id,cantidad:6}],pago:{forma:"cuenta_corriente"}}},"LIMITE_CREDITO_EXCEDIDO");
 const vacio=(await request("/api/productos",{method:"POST",cookie:admin,esperado:201,body:{codigo:"API-VACIO",descripcion:"Sin stock",categoriaId:cat.id,precio:100,stockMinimo:0}})).data;
 const faltantes=await error("/api/facturas",{method:"POST",cookie:vendedor,esperado:409,body:{clienteId:null,items:[{productoId:prod.id,cantidad:8},{productoId:vacio.id,cantidad:1}],pago:{forma:"contado"}}},"STOCK_INSUFICIENTE");assert.equal(faltantes.details.length,2);
 await request(`/api/productos/${vacio.id}`,{method:"PATCH",cookie:admin,body:{activo:false}});await error("/api/facturas",{method:"POST",cookie:vendedor,esperado:422,body:{clienteId:null,items:[{productoId:vacio.id,cantidad:1}],pago:{forma:"contado"}}},"PRODUCTO_INACTIVO");
 const fac=(await request("/api/facturas",{method:"POST",cookie:vendedor,esperado:201,body:{clienteId:cliente.id,items:[{productoId:prod.id,cantidad:1}],pago:{forma:"cuenta_corriente"}}})).data;assert.equal(fac.total,10000);assert.equal(fac.items[0].precioUnitario,10000);assert.equal(fac.saldoCliente,10000);
 await request(`/api/productos/${prod.id}`,{method:"PATCH",cookie:admin,body:{precio:12000}});assert.equal((await request(`/api/facturas/${fac.id}`,{cookie:vendedor})).data.items[0].precioUnitario,10000);
 const facturasCliente = (
   await request(
     `/api/facturas?clienteId=${cliente.id}&estado=emitida&forma=cuenta_corriente&pageSize=100`,
     { cookie: vendedor },
   )
 ).data;
 comprobarListado(facturasCliente);
 assert.equal(facturasCliente.total,1);
 assert.equal(facturasCliente.data[0].id,fac.id);
 const facturaPorNumero = (
   await request(
     `/api/facturas?q=${fac.numeroFormateado}`,
     { cookie: vendedor },
   )
 ).data;
 assert.equal(facturaPorNumero.total, 1);
 assert.equal(facturaPorNumero.data[0].id, fac.id);
 const facturasVendedor = (
   await request(
     `/api/facturas?vendedorId=${vendedorActual.id}`,
     { cookie: vendedor },
   )
 ).data;
 assert.ok(facturasVendedor.data.some((factura) => factura.id === fac.id));
 const facturasPorFecha = (
   await request(
     `/api/facturas?vendedorId=${vendedorActual.id}&desde=${hoyArgentina}&hasta=${hoyArgentina}`,
     { cookie: vendedor },
   )
 ).data;
 assert.ok(facturasPorFecha.data.some((factura) => factura.id === fac.id));
 const ordenadas=(await request("/api/facturas?pageSize=100",{cookie:vendedor})).data.data;
 for(let i=1;i<ordenadas.length;i++)assert.ok(ordenadas[i-1].fecha>=ordenadas[i].fecha,"Las facturas deben ordenarse por fecha descendente");
 const cuenta=(await request(`/api/clientes/${cliente.id}/cuenta`,{cookie:vendedor})).data;assert.equal(cuenta.saldo,10000);
 await error(`/api/clientes/${cliente.id}/pagos`,{method:"POST",cookie:vendedor,esperado:422,body:{importe:20001,medio:"efectivo"}},"PAGO_SUPERA_DEUDA");
 const pago=(await request(`/api/clientes/${cliente.id}/pagos`,{method:"POST",cookie:vendedor,esperado:201,body:{importe:4000,medio:"efectivo"}})).data;assert.equal(pago.saldoCliente,6000);assert.equal((await request(`/api/pagos/${pago.id}`,{cookie:vendedor})).data.saldoCliente,6000);assert.equal((await request(`/api/facturas/${fac.id}`,{cookie:vendedor})).data.saldoCliente,10000);
 await error(`/api/clientes/${cliente.id}`,{method:"PATCH",cookie:vendedor,esperado:422,body:{activo:false}},"SALDO_PENDIENTE");
 await error(`/api/facturas/${fac.id}/anulacion`,{method:"POST",cookie:vendedor,esperado:403,body:{motivo:"Error"}},"SIN_PERMISO");
 // La deuda pendiente se acredita y el excedente se registra como reintegro.
 const stockAntes=(await request(`/api/productos/${prod.id}`,{cookie:admin})).data.existencia;
 const anuladaCuenta=(await request(`/api/facturas/${fac.id}/anulacion`,{method:"POST",cookie:admin,body:{motivo:"Error"}})).data;
 assert.equal(anuladaCuenta.estado,"anulada");
 assert.equal(anuladaCuenta.anulacion.reintegroEfectivo,4000);
 const cuentaAnulada=(await request(`/api/clientes/${cliente.id}/cuenta`,{cookie:admin})).data;
 assert.equal(cuentaAnulada.saldo,0);
 const creditoAnulacion=cuentaAnulada.movimientos.find((movimiento)=>movimiento.facturaId===fac.id&&movimiento.tipo==="credito");
 assert.equal(creditoAnulacion.importe,6000);
 assert.equal((await request(`/api/productos/${prod.id}`,{cookie:admin})).data.existencia,stockAntes+1);
 const contado=(await request("/api/facturas",{method:"POST",cookie:vendedor,esperado:201,body:{clienteId:null,items:[{productoId:prod.id,cantidad:1}],pago:{forma:"contado",montoRecibido:15000}}})).data;assert.equal(contado.pago.vuelto,3000);
 const anulada=(await request(`/api/facturas/${contado.id}/anulacion`,{method:"POST",cookie:admin,body:{motivo:"Prueba"}})).data;assert.equal(anulada.estado,"anulada");assert.equal(anulada.anulacion.usuario.id,me.id);
 await error(`/api/facturas/${contado.id}/anulacion`,{method:"POST",cookie:admin,esperado:409,body:{motivo:"Repetida"}},"FACTURA_ANULADA");
 const tablero=(await request("/api/tablero",{cookie:vendedor})).data;assert.equal(tablero.ventasDiarias.length,30);assert.equal(tablero.porFormaDePago.length,3);
 const ultimo=(await request("/api/productos",{method:"POST",cookie:admin,esperado:201,body:{codigo:"API-ULTIMA",descripcion:"Última unidad",categoriaId:cat.id,precio:100,stockMinimo:0,stockInicial:1}})).data;
 const peticion={method:"POST",headers:{cookie:vendedor,"content-type":"application/json"},body:JSON.stringify({clienteId:null,items:[{productoId:ultimo.id,cantidad:1}],pago:{forma:"contado"}})};
 const intentos=await Promise.all([fetch(base+"/api/facturas",peticion),fetch(base+"/api/facturas",peticion)]);assert.deepEqual(intentos.map(r=>r.status).sort(),[201,409]);const sinStock=await intentos.find(r=>r.status===409).json();assert.equal(sinStock.error.code,"STOCK_INSUFICIENTE");
 await request("/api/clientes",{method:"POST",cookie:vendedor,esperado:201,body:{tipoDoc:"DNI",nroDoc:"40111111",nombre:"Posterior a concurrencia",cuentaCorriente:false}});
 await request("/api/auth/logout",{method:"POST",cookie:vendedor,esperado:204});
 console.log("API: rutas de autenticación, usuarios, categorías, productos, stock, clientes, pagos, facturas y tablero verificadas en SQLite temporal.");
} catch(error){console.error(error);process.exitCode=1;}
finally {if(servidor&&servidor.exitCode===null){const salida=new Promise(resolve=>servidor.once("exit",resolve));servidor.kill();await salida;}try{rmSync(carpeta,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch(e){console.error(`No se pudo borrar la base temporal: ${carpeta}`,e);process.exitCode=1;}}
