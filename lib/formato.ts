export const moneda = (centavos: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    centavos / 100,
  );
export const fecha = (valor: string) =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
export const numeroRecibo = (numero: number) =>
  `R 0001-${String(numero).padStart(8, "0")}`;
export const numeroFactura = (numero: number, punto = 1) =>
  `${String(punto).padStart(4, "0")}-${String(numero).padStart(8, "0")}`;
