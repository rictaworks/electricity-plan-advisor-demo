"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { RankedPlan } from "@/types/result";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SavingsChartProps {
  plans: RankedPlan[];
}

export default function SavingsChart({ plans }: SavingsChartProps) {
  const labels = plans.map((p) => p.plan_name);
  const savings = plans.map((p) => p.saving_vs_standard);
  const colors = savings.map((s) =>
    s > 0 ? "rgba(22, 163, 74, 0.7)" : "rgba(220, 38, 38, 0.7)"
  );

  const data = {
    labels,
    datasets: [
      {
        label: "年間節約額（円）",
        data: savings,
        backgroundColor: colors,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "各プランの年間節約額（標準プラン比）",
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (v: string | number) => `${Number(v).toLocaleString()}円`,
        },
      },
    },
  };

  return (
    <div style={{ height: Math.max(400, plans.length * 24) }}>
      <Bar data={data} options={options} />
    </div>
  );
}
