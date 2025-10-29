"use client";

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchAdminEmployee } from '@/services/api';
import { EmployeeDashboardResponse } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmployeeDetail } from './employee-detail';

interface Props {
  employeeId: string;
  initialData: EmployeeDashboardResponse;
}

export function AdminEmployeeDetail({ employeeId, initialData }: Props) {
  const { data } = useQuery({
    queryKey: ['admin-employee', employeeId],
    queryFn: () => fetchAdminEmployee(employeeId),
    initialData,
    staleTime: 60_000,
  });

  const employeeInfo = useMemo(() => data.user, [data.user]);

  return (
    <div className="space-y-8">
      <Card className="bg-white/5">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white text-2xl">
                {employeeInfo.firstName} {employeeInfo.lastName}
              </CardTitle>
              <p className="text-sm text-white/70">{employeeInfo.email}</p>
            </div>
            <Badge className="capitalize" variant={data.riskLevel === 'critical' ? 'critical' : 'outline'}>
              {data.riskLevel} risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-white/60">Current risk score</p>
            <p className="text-3xl font-semibold text-white">{data.riskScore}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-white/60">Confidence</p>
            <p className="text-3xl font-semibold text-white">{Math.round(data.confidence * 100)}%</p>
          </div>
        </CardContent>
      </Card>

      <EmployeeDetail employeeId={employeeId} initialData={data} />

      {data.recommendations?.length ? (
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <Badge className="mb-2 uppercase" variant={recommendation.priority === 'high' ? 'critical' : 'outline'}>
                  {recommendation.priority} priority
                </Badge>
                <h4 className="text-white font-semibold">{recommendation.title}</h4>
                <p className="text-sm text-white/70">{recommendation.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
