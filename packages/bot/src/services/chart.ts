const QUICKCHART_BASE = "https://quickchart.io/chart";

const PALETTE = [
  "#2f6fed",
  "#f5a623",
  "#7ed321",
  "#d0021b",
  "#9013fe",
  "#50e3c2",
  "#b8860b",
  "#4a90e2",
  "#e67e22",
  "#16a085",
];

/**
 * QuickChart — внешний бесплатный API для рендера графиков в PNG по URL.
 * Используется вместо chartjs-node-canvas, чтобы не тащить нативные
 * биндинги canvas (ломаются в serverless).
 */
export function buildPieChartUrl(labels: string[], data: number[], title: string): string {
  const config = {
    type: "pie",
    data: {
      labels,
      datasets: [{ data, backgroundColor: PALETTE.slice(0, labels.length) }],
    },
    options: {
      plugins: {
        title: { display: true, text: title },
        legend: { position: "right" },
      },
    },
  };
  return `${QUICKCHART_BASE}?c=${encodeURIComponent(JSON.stringify(config))}&backgroundColor=white&width=600&height=400`;
}

export function buildTrendChartUrl(labels: string[], data: number[], title: string): string {
  const config = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: title,
          data,
          fill: true,
          borderColor: "#2f6fed",
          backgroundColor: "rgba(47, 111, 237, 0.15)",
          tension: 0.3,
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: title },
        legend: { display: false },
      },
    },
  };
  return `${QUICKCHART_BASE}?c=${encodeURIComponent(JSON.stringify(config))}&backgroundColor=white&width=600&height=400`;
}
