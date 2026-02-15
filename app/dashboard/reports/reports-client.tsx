"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import React from "react";

interface Props {
  monthly: { month: string; revenue: number; expense: number }[];
  methodDist: Record<string, number>;
  typeDist: Record<string, number>;
  tenantId: string;
  branchId?: string;
}

const COLORS = [
  "#60a5fa",
  "#34d399",
  "#f59e0b",
  "#ef4444",
  "#a78bfa",
  "#f472b6",
];

export default function ReportsClient({
  monthly,
  methodDist,
  typeDist,
}: Props) {
  const [freq, setFreq] = React.useState<"monthly" | "weekly">("monthly");
  const weekly = React.useMemo(() => {
    const buckets: Record<string, { revenue: number; expense: number }> = {};
    monthly.forEach((m) => {
      const [year, monthStr] = m.month.split("-");
      const d = new Date(Number(year), Number(monthStr) - 1, 1);
      for (let i = 0; i < 4; i++) {
        const key = `${year}-W${i + 1}`;
        if (!buckets[key]) buckets[key] = { revenue: 0, expense: 0 };
      }
      buckets[`${d.getFullYear()}-W1`].revenue += Math.round(m.revenue * 0.25);
      buckets[`${d.getFullYear()}-W2`].revenue += Math.round(m.revenue * 0.25);
      buckets[`${d.getFullYear()}-W3`].revenue += Math.round(m.revenue * 0.25);
      buckets[`${d.getFullYear()}-W4`].revenue += Math.round(m.revenue * 0.25);
      buckets[`${d.getFullYear()}-W1`].expense += Math.round(m.expense * 0.25);
      buckets[`${d.getFullYear()}-W2`].expense += Math.round(m.expense * 0.25);
      buckets[`${d.getFullYear()}-W3`].expense += Math.round(m.expense * 0.25);
      buckets[`${d.getFullYear()}-W4`].expense += Math.round(m.expense * 0.25);
    });
    return Object.entries(buckets).map(([week, v]) => ({
      week,
      revenue: v.revenue,
      expense: v.expense,
    }));
  }, [monthly]);

  const methodData = Object.entries(methodDist).map(([name, value]) => ({
    name,
    value,
  }));
  const typeData = Object.entries(typeDist).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Raporlar</h1>
        <p className="text-sm text-slate-400">
          Gelir ve gider analizi, ödeme dağılımları
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Gelir/Gider</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={freq === "monthly" ? monthly : weekly}>
                <XAxis
                  dataKey={freq === "monthly" ? "month" : "week"}
                  stroke="#94a3b8"
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#60a5fa"
                  name="Gelir"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  name="Gider"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3">
              <button
                onClick={() => setFreq("monthly")}
                className={`mr-2 rounded border px-2 py-1 text-sm ${
                  freq === "monthly"
                    ? "border-blue-600 text-white"
                    : "border-slate-700 text-slate-300"
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setFreq("weekly")}
                className={`rounded border px-2 py-1 text-sm ${
                  freq === "weekly"
                    ? "border-blue-600 text-white"
                    : "border-slate-700 text-slate-300"
                }`}
              >
                Haftalık
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Ödeme Yöntemleri</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                >
                  {methodData.map((entry, index) => (
                    <Cell
                      key={`cell-m-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle>Ödeme Türleri</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Adet" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
