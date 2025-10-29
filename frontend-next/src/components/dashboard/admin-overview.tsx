"use client";

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Link from 'next/link';
import { AdminDashboardResponse, AdminMetrics, AdminEmployeeSummary, RiskLevel } from '@/types/dashboard';
import { fetchAdminMetrics, fetchAdminOverview } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { titleCase } from '@/lib/utils';

const riskPalette: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#fbbf24',
  high: '#fb7185',
  critical: '#ef4444',
};

type AdminOverviewProps = {
  initialData: AdminDashboardResponse;
};

export function AdminOverview({ initialData }: AdminOverviewProps) {
  const [search, setSearch] = useState('');

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: fetchAdminOverview,
    initialData,
    staleTime: 60_000,
  });

  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: fetchAdminMetrics,
    staleTime: 60_000,
  });

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return data.employees;
    const term = search.toLowerCase();
    return data.employees.filter((employee) =>
      [employee.firstName, employee.lastName, employee.email].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [data.employees, search]);

  const pieData = useMemo(
    () => Object.entries(data.summary.riskBuckets).map(([risk, value]) => ({ name: titleCase(risk), value })),
    [data.summary.riskBuckets],
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-white">{data.summary.totalEmployees}</p>
            <p className="text-sm text-white/70">Active employees monitored by the platform</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Average Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-white">{data.summary.averageRiskScore}</p>
            <p className="text-sm text-white/70">A composite score across all employees</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Refresh Data</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-white/70">Pull the latest predictions from the ML service.</p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {metrics && (
        <section className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white/5">
            <CardHeader>
              <CardTitle>Baseline Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-white">
                {Math.round((metrics.summary?.accuracy ?? 0) * 1000) / 1000}
              </p>
              <p className="text-sm text-white/70">
                Evaluation accuracy averaged across validation split.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/5">
            <CardHeader>
              <CardTitle>Macro F1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-white">
                {Math.round((metrics.summary?.macro_f1 ?? 0) * 1000) / 1000}
              </p>
              <p className="text-sm text-white/70">Balanced performance across risk classes.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5">
            <CardHeader>
              <CardTitle>ROC AUC</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-white">
                {Math.round((metrics.summary?.roc_auc ?? 0) * 1000) / 1000}
              </p>
              <p className="text-sm text-white/70">
                Multi-class discrimination score using one-vs-one AUC.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={riskPalette[entry.name.toLowerCase() as RiskLevel]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12 }}
                  formatter={(value: number, name: string) => [`${value} employees`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Search Employees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bg-white/10 text-white placeholder:text-white/50"
            />
            <p className="text-sm text-white/70">Filtered employees: {filteredEmployees.length}</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Employee Risk Table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-semibold text-white">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell className="text-white/60">{employee.email}</TableCell>
                    <TableCell>
                      <Badge className="capitalize" variant={employee.riskLevel === 'critical' ? 'critical' : 'outline'}>
                        {employee.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.riskScore}</TableCell>
                    <TableCell className="capitalize text-white/70">{employee.trend}</TableCell>
                    <TableCell className="text-white/60">
                      {new Date(employee.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/employee/${employee.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
