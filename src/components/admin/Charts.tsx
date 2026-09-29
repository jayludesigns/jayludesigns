import { formatVes } from "@/lib/utils";
import type { SalesPoint } from "@/lib/data/finance";

/**
 * Gráfico de ventas en SVG puro.
 *
 * No se usa una librería de gráficos: son 30 barras y el sitio entero se
 * apoya en blanco y negro, así que un `rect` por día hace el trabajo y no
 * añade 100 kB al panel.
 */
export function SalesChart({
  points,
  height = 140,
}: {
  points: SalesPoint[];
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-500">
        Todavía no hay ventas en este periodo.
      </p>
    );
  }

  const max = Math.max(...points.map((point) => point.revenue_ves), 1);
  const gap = 2;
  const barWidth = 100 / points.length;
  const width = barWidth - gap / points.length;

  return (
    <div>
      <div className="flex items-end gap-px" style={{ height }}>
        {points.map((point) => {
          const ratio = point.revenue_ves / max;
          const barHeight = Math.max(ratio > 0 ? 2 : 0, ratio * height);
          return (
            <div
              key={point.date}
              className="group relative flex-1"
              style={{ height }}
              title={`${point.label} · ${formatVes(point.revenue_ves)} · ${point.orders} pedidos`}
            >
              <div
                className="absolute bottom-0 w-full bg-ink transition-colors group-hover:bg-ember-600/70"
                style={{ height: barHeight, width: `${width}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[0.57rem] text-ink-500">
        <span>{points[0]?.label}</span>
        <span>
          pico {formatVes(max)} · {points.reduce((acc, p) => acc + p.orders, 0)} pedidos
        </span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Barras horizontales para rankings (top productos, por colección…). */
export function RankBars({
  rows,
  formatValue = (value: number) => String(value),
}: {
  rows: { name: string; units: number; revenue_ves: number }[];
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(...rows.map((row) => row.units || row.revenue_ves), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const metric = row.units || row.revenue_ves;
        return (
          <li key={row.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-semibold">{row.name}</span>
              <span className="shrink-0 font-mono text-xs tabular">
                {row.units ? `${row.units} u` : ""} {formatValue(row.revenue_ves)}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-ink-100">
              <div
                className="h-full bg-ember-600"
                style={{ width: `${Math.max(3, (metric / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
