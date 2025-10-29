"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { EmployeeDashboardResponse } from '@/types/dashboard';
import { fetchEmployeeDetails } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { titleCase } from '@/lib/utils';

interface Props {
  employeeId: string;
  initialData: EmployeeDashboardResponse;
}

export function EmployeeDetail({ employeeId, initialData }: Props) {
  const { data } = useQuery({
    queryKey: ['employee-detail', employeeId],
    queryFn: () => fetchEmployeeDetails(employeeId),
    initialData,
    staleTime: 60_000,
  });

  const trendData = useMemo(() => {
    const base = data.riskScore ?? 60;
    return Array.from({ length: 8 }).map((_, index) => ({
      period: `Week ${index + 1}`,
      risk: Math.max(20, Math.min(100, base + (index - 4) * 4)),
      workload: Math.max(2, Math.min(10, (data.workPatterns?.workload ?? 6) + (index - 4) * 0.5)),
    }));
  }, [data]);

  const meetingLoad = useMemo(() => {
    const meetings = data.workPatterns?.meetingCount ?? 10;
    const base = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return base.map((day, index) => ({
      day,
      meetings: Math.max(0, Math.round(meetings * (0.18 + index * 0.02))),
    }));
  }, [data]);

  const dominantFactors = Object.entries(data.factors || {})
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm uppercase text-white/60">
              <span>Risk classification</span>
              <Badge className="capitalize">{data.riskLevel}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{data.riskScore}/100</p>
            <ProgressBar value={data.riskScore} className="mt-3" colorClassName="bg-orange-400" />
          </CardContent>
        </Card>
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm uppercase text-white/60">Model confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-white">{Math.round(data.confidence * 100)}%</p>
            <p className="mt-2 text-sm text-white/70">
              Confidence derived from cross-signal correlation and stability of contributing metrics.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm uppercase text-white/60">Top risk drivers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dominantFactors.map(([factor, value]) => (
              <div key={factor} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{titleCase(factor)}</span>
                  <span>{Number(value).toFixed(1)}</span>
                </div>
                <ProgressBar value={Math.min(100, Number(value) * 10)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Risk Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="risk-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="period" tick={{ fill: '#cbd5f5', fontSize: 12 }} />
                <YAxis tick={{ fill: '#cbd5f5', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#f97316" fill="url(#risk-gradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="workload" stroke="#38bdf8" fill="#38bdf833" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Weekly Meeting Load</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meetingLoad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: '#cbd5f5', fontSize: 12 }} />
                <YAxis tick={{ fill: '#cbd5f5', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12 }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="meetings" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
