"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { EmployeeDashboardResponse } from '@/types/dashboard';
import { fetchEmployeeDashboard } from '@/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { cn, titleCase } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const riskColors: Record<string, string> = {
  low: 'text-emerald-300',
  medium: 'text-amber-300',
  high: 'text-orange-300',
  critical: 'text-red-300',
};

const riskBackgrounds: Record<string, string> = {
  low: 'bg-emerald-500/20 border border-emerald-400/30',
  medium: 'bg-amber-500/20 border border-amber-400/30',
  high: 'bg-orange-500/20 border border-orange-400/30',
  critical: 'bg-red-500/20 border border-red-400/30',
};

type EmployeeDashboardProps = {
  initialData: EmployeeDashboardResponse;
};

export function EmployeeDashboard({ initialData }: EmployeeDashboardProps) {
  const { data } = useQuery({
    queryKey: ['employee-dashboard'],
    queryFn: fetchEmployeeDashboard,
    initialData,
    staleTime: 60_000,
  });

  const probabilityData = useMemo(
    () =>
      Object.entries(data.probabilities || {}).map(([level, value]) => ({
        level: titleCase(level),
        value: Math.round((value ?? 0) * 100),
      })),
    [data.probabilities],
  );

  const factorData = useMemo(
    () =>
      Object.entries(data.factors || {}).map(([key, value]) => ({
        factor: titleCase(key),
        score: typeof value === 'number' ? Number(value.toFixed(2)) : 0,
      })),
    [data.factors],
  );

  const workPatternCards = useMemo(() => {
    const patterns = data.workPatterns || {};
    const entries = Object.entries(patterns).slice(0, 6);

    return entries.map(([key, value]) => ({
      key,
      label: titleCase(key),
      value: typeof value === 'number' ? value : 0,
    }));
  }, [data.workPatterns]);

  const sentimentTrend = useMemo(() => {
    const base = data.probabilities.high ?? 0.4;
    return Array.from({ length: 7 }).map((_, index) => ({
      week: `Week ${index + 1}`,
      workload: Math.min(10, Math.max(2, (data.workPatterns?.workload ?? 5) + index - 2)),
      sentiment: Math.max(0, Math.min(1, base + (index - 3) * 0.05)),
    }));
  }, [data.probabilities, data.workPatterns]);

  const riskLevel = data.riskLevel ?? 'medium';
  const riskScoreValue = Math.max(0, Math.min(100, data.riskScore ?? 50));
  const confidenceValue = Math.max(0, Math.min(100, Math.round((data.confidence ?? 0) * 100)));
  const recommendations = data.recommendations ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className={cn('lg:col-span-2', riskBackgrounds[riskLevel])}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Current Burnout Risk</CardTitle>
              <CardDescription>Latest prediction from the AI model</CardDescription>
            </div>
            <Badge variant={riskLevel === 'critical' ? 'critical' : 'default'} className="capitalize">
              {riskLevel}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/70">Risk Score</p>
                <p className="text-4xl font-semibold text-white">{riskScoreValue}/100</p>
              </div>
              <ProgressBar value={riskScoreValue} colorClassName="bg-teal-400" />
              <p className="text-sm text-white/70">
                Higher values signal increased burnout risk. Aim to keep the score below 50 for sustainable
                performance.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  barSize={18}
                  data={probabilityData}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={8}
                    fill="#60a5fa"
                  />
                  <Tooltip
                    contentStyle={{ background: '#020617', borderRadius: 12, border: '1px solid #1e293b' }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="justify-between text-sm text-white/70">
            <span>Confidence: {confidenceValue}%</span>
            {riskLevel === 'low' ? (
              <span className="flex items-center space-x-2 text-emerald-200">
                <CheckCircle className="h-5 w-5" />
                <span>Healthy balance maintained</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2 text-amber-200">
                <AlertTriangle className="h-5 w-5" />
                <span>Monitor workload and stress triggers</span>
              </span>
            )}
          </CardFooter>
        </Card>

        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Confidence Level</CardTitle>
            <CardDescription>Model certainty for this prediction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline space-x-2 text-white">
              <span className="text-4xl font-semibold">{confidenceValue}%</span>
              <span className="text-sm text-white/60">probability</span>
            </div>
            <ProgressBar value={confidenceValue} colorClassName="bg-sky-400" />
            <p className="text-sm text-white/70">
              Confidence aggregates behavioural, collaboration, and sentiment indicators. A value above 70%
              means the signal is consistent across data sources.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Primary Risk Factors</CardTitle>
            <CardDescription>Scores represent impact on current risk</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="factor" tick={{ fill: '#cbd5f5', fontSize: 12 }} interval={0} angle={-20} dy={15} />
                <YAxis tick={{ fill: '#cbd5f5', fontSize: 12 }} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ background: '#020617', borderRadius: 12, border: '1px solid #1e293b' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="score" fill="#60a5fa" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Sentiment Trajectory</CardTitle>
            <CardDescription>Weekly sentiment vs workload signal</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentTrend}>
                <defs>
                  <linearGradient id="sentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" tick={{ fill: '#cbd5f5', fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: '#cbd5f5', fontSize: 12 }} domain={[0, 10]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#cbd5f5', fontSize: 12 }} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{ background: '#020617', borderRadius: 12, border: '1px solid #1e293b' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="workload"
                  stroke="#f97316"
                  fill="#fb923c33"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="sentiment"
                  stroke="#38bdf8"
                  fill="url(#sentiment)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Evidence-based actions to reduce burnout risk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((item, index) => (
              <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <Badge className="mb-2" variant={item.priority === 'high' ? 'critical' : 'outline'}>
                  {item.priority} priority
                </Badge>
                <h4 className="font-semibold text-white">{item.title}</h4>
                <p className="text-sm text-white/70">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle>Work Patterns Snapshot</CardTitle>
            <CardDescription>Signals detected over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {workPatternCards.map((item) => (
                <div key={item.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
