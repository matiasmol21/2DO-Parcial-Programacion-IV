"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { moneda } from "@/lib/formato";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);
export default function Graficos({
  diarias,
  formas,
}: {
  diarias: { fecha: string; importe: number }[];
  formas: { forma: string; importe: number }[];
}) {
  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-4 mt-5">
      <section className="panel p-5">
        <h2 className="font-semibold">Ventas de los últimos 30 días</h2>
        <div className="h-64 mt-4">
          <Bar
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => moneda(Number(c.raw)) } },
              },
              scales: { y: { ticks: { callback: (v) => moneda(Number(v)) } } },
            }}
            data={{
              labels: diarias.map((d) => d.fecha.slice(5)),
              datasets: [
                {
                  label: "Ventas",
                  data: diarias.map((d) => d.importe),
                  backgroundColor: "#21866d",
                },
              ],
            }}
          />
        </div>
      </section>
      <section className="panel p-5">
        <h2 className="font-semibold">Medios de pago del mes</h2>
        <div className="h-64 mt-4">
          <Doughnut
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (c) => `${c.label}: ${moneda(Number(c.raw))}`,
                  },
                },
              },
            }}
            data={{
              labels: formas.map((f) => f.forma.replace("_", " ")),
              datasets: [
                {
                  data: formas.map((f) => f.importe),
                  backgroundColor: ["#156a55", "#81b9a6", "#d3b778"],
                },
              ],
            }}
          />
        </div>
      </section>
    </div>
  );
}
