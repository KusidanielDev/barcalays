// FILE: src/components/AnalyticsCharts.tsx
"use client";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function SpendingTrend({
  data,
}: {
  data: { month: string; inflow: number; outflow: number }[];
}) {
  return (
    <div className="card h-80">
      <div className="font-semibold text-barclays-navy mb-2">
        Monthly inflow vs outflow
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="inflow" stroke="#22c55e" />
          <Line type="monotone" dataKey="outflow" stroke="#ef4444" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopMerchants({
  data,
}: {
  data: { name: string; amount: number }[];
}) {
  return (
    <div className="card h-80">
      <div className="font-semibold text-barclays-navy mb-2">
        Top payees / merchants (outflow)
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLS = [
  "#0ea5e9",
  "#22c55e",
  "#ef4444",
  "#a855f7",
  "#eab308",
  "#f97316",
  "#14b8a6",
  "#f43f5e",
];

export function CategorySplit({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="card h-80">
      <div className="font-semibold text-barclays-navy mb-2">
        Spending by description keyword
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie dataKey="value" data={data} label>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLS[i % PIE_COLS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
