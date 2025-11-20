import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { useAnalysisStore } from "../../stores/analysisStore";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

export const MetricsChart = () => {
  const { performanceHistory } = useAnalysisStore();

  const data = {
    labels: performanceHistory.map((_, idx) => `Run ${idx + 1}`),
    datasets: [
      {
        label: "Performance score",
        data: performanceHistory,
        tension: 0.4,
        fill: true,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.15)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#94a3b8" },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#94a3b8" },
      },
    },
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        Performance trend
      </h3>
      <Line data={data} options={options} />
    </section>
  );
};
