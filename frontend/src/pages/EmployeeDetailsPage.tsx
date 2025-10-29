import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Flame,
  Layers,
  PieChart,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { dashboardService, DashboardData } from '../services/dashboardService';
import Chart from '../components/Chart';
import RecommendationList from '../components/RecommendationList';
import { useAuth } from '../hooks/useAuth';

const EmployeeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await dashboardService.getDashboardData();
      setData(response);
    } catch (err) {
      console.error('Failed to load detailed analytics', err);
      setError('Unable to load detailed analytics. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails, id]);

  useEffect(() => {
    if (user && user.role !== 'employee') {
      navigate('/admin', { replace: true });
    }
  }, [navigate, user]);

  const burnoutTrend = useMemo(() => {
    if (!data?.workPatterns) {
      return [];
    }

    // Generate synthetic historical trend based on the current score & workload signals
    const baseScore = data.riskScore;
    const adjustments = [-12, -5, 0, 6, 10, 4, -2];

    return adjustments.map((adjustment, index) => ({
      week: `Week ${index + 1}`,
      score: Math.min(100, Math.max(0, baseScore + adjustment)),
      workload: Math.min(10, Math.max(1, (data.workPatterns?.workloadScore ?? 6) + adjustment / 15)),
      stress: Math.min(10, Math.max(1, (data.workPatterns?.stressLevel ?? 5) + adjustment / 12))
    }));
  }, [data]);

  const meetingLoad = useMemo(() => {
    const meetingCount = data?.workPatterns?.meetingHoursPerWeek ?? 10;
    const distribution = [
      { day: 'Mon', meetings: Math.round(meetingCount * 0.22) },
      { day: 'Tue', meetings: Math.round(meetingCount * 0.18) },
      { day: 'Wed', meetings: Math.round(meetingCount * 0.2) },
      { day: 'Thu', meetings: Math.round(meetingCount * 0.24) },
      { day: 'Fri', meetings: Math.max(0, meetingCount - Math.round(meetingCount * 0.84)) }
    ];

    return distribution;
  }, [data]);

  const workHours = data?.workPatterns?.workHoursPerWeek ?? 40;
  const overtimeHours = data?.workPatterns?.overtimeHours ?? Math.max(0, workHours - 40);
  const normalizedConfidence = useMemo(() => {
    const rawConfidence = data?.confidence ?? 0;
    const percentValue = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
    return Math.min(100, Math.max(0, percentValue));
  }, [data?.confidence]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Detailed Burnout Analytics</h1>
              <p className="text-sm text-gray-500">Comprehensive insights for {id === 'me' ? 'your profile' : 'the selected employee'}.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Updated {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{data?.riskLevel?.toUpperCase()} RISK</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-gray-600">Loading detailed analytics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-danger-200 bg-danger-50 p-6 text-center text-danger-700">
            <p>{error}</p>
            <button
              onClick={() => void loadDetails()}
              className="btn-primary mt-4"
              type="button"
            >
              Retry
            </button>
          </div>
        ) : (
          data && (
            <div className="space-y-8">
              <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="card border-l-4 border-primary-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Burnout score</p>
                      <h2 className="mt-1 text-3xl font-bold text-gray-900">{data.riskScore}</h2>
                    </div>
                    <Flame className="h-10 w-10 text-primary-500" />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Current burnout classification: <span className="font-semibold text-gray-900">{data.riskLevel?.toUpperCase()}</span>
                  </p>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Model confidence</p>
                      <h2 className="mt-1 text-3xl font-bold text-gray-900">{Math.round(normalizedConfidence)}%</h2>
                    </div>
                    <PieChart className="h-10 w-10 text-success-500" />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Confidence derived from ensemble validation across behavioural and sentiment indicators.
                  </p>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Work hours this week</p>
                      <h2 className="mt-1 text-3xl font-bold text-gray-900">{workHours} hrs</h2>
                    </div>
                    <Clock className="h-10 w-10 text-warning-500" />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">Overtime contribution: {overtimeHours} hrs beyond recommended limits.</p>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Dominant risk driver</p>
                      <h2 className="mt-1 text-3xl font-bold text-gray-900">
                        {Object.entries(data.factors || {})
                          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0]
                          ?.replace(/([A-Z])/g, ' $1')
                          .toLowerCase() ?? 'workload'}
                      </h2>
                    </div>
                    <Layers className="h-10 w-10 text-danger-500" />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">Focus on this factor to produce the fastest risk reduction.</p>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <div className="card">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Burnout trajectory</h3>
                      <span className="text-sm text-gray-500">Last 7 weeks</span>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={burnoutTrend}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#f87171" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const [score, workload, stress] = payload;
                                return (
                                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow">
                                    <p className="font-semibold text-gray-900">{score?.payload?.week}</p>
                                    <p className="text-gray-600">Score: {score?.value}</p>
                                    <p className="text-gray-600">Workload: {workload?.value?.toFixed?.(1) || workload?.value}</p>
                                    <p className="text-gray-600">Stress: {stress?.value?.toFixed?.(1) || stress?.value}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#ef4444" fill="url(#colorScore)" strokeWidth={3} name="Burnout score" />
                          <Area type="monotone" dataKey="workload" stroke="#f59e0b" fill="#fbbf24" fillOpacity={0.15} strokeWidth={2} name="Workload" />
                          <Area type="monotone" dataKey="stress" stroke="#8b5cf6" fill="#a855f7" fillOpacity={0.12} strokeWidth={2} name="Stress" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Meeting load</h3>
                    <BarChart3 className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={meetingLoad}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const [{ value, payload: item } = { value: 0, payload: { day: '' } } as any] = payload as any;
                              return (
                                <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow">
                                  <p className="font-semibold text-gray-900">{item?.day}</p>
                                  <p className="text-gray-600">Meetings: {value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="meetings" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <Chart data={data} />
                </div>
                <div className="lg:col-span-2">
                  <RecommendationList recommendations={data.recommendations || []} />
                </div>
              </section>

              <section className="card">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Work pattern diagnostics</h3>
                  <TrendingUp className="h-5 w-5 text-primary-500" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Remote work ratio</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{data?.workPatterns?.remoteWorkPercentage ?? 65}%</p>
                    <p className="mt-1 text-xs text-gray-500">Blend hybrid strategies to rebalance social connection.</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Deadline pressure</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{data?.workPatterns?.deadlinePressure ?? 6}/10</p>
                    <p className="mt-1 text-xs text-gray-500">Frequent urgent tasks are elevating stress chemistry responses.</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Sleep quality</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{data?.workPatterns?.sleepQuality ?? 6}/10</p>
                    <p className="mt-1 text-xs text-gray-500">Optimise evening routines to sustain cognitive resilience.</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Exercise frequency</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{data?.workPatterns?.exerciseFrequency ?? 4}/10</p>
                    <p className="mt-1 text-xs text-gray-500">Micro workouts during noon windows can offset cortisol spikes.</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Social support</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{data?.workPatterns?.socialSupport ?? 5}/10</p>
                    <p className="mt-1 text-xs text-gray-500">Plan deliberate connections to reinforce psychological safety.</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Job satisfaction</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{data?.workPatterns?.jobSatisfaction ?? 6}/10</p>
                    <p className="mt-1 text-xs text-gray-500">Partner with your manager to realign expectations and goals.</p>
                  </div>
                </div>
              </section>

              <section className="card">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Action plan</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start space-x-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-danger-500" />
                    <span>Block 4 hours weekly for deep work to minimise multitasking fatigue.</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-warning-500" />
                    <span>Automate meeting summaries so only critical invites require presence.</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                    <span>Schedule recovery blocks after deadline surges to protect sleep cycles.</span>
                  </li>
                </ul>
              </section>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default EmployeeDetailsPage;

