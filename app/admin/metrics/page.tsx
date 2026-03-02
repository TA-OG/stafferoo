'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import PageHeader from '@/app/components/PageHeader';

interface OverviewMetrics {
  period: string;
  summary: {
    conversionRate: string;
    freeAccounts: number;
    totalCost: string;
    totalRevenue: string;
    netPosition: string;
    fraudSignals: number;
    unacknowledgedAlerts: number;
  };
  costs: {
    total: number;
    sms: number;
    api: number;
    support: number;
  };
  support: {
    totalMinutes: number;
    avgMinutesPerFreeAccount: number;
    ticketCount: number;
  };
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    loadMetrics();
  }, [period]);

  async function loadMetrics() {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/metrics/overview?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${session.session?.access_token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Metrics' }]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Metrics</h1>
          <p className="mt-2 text-gray-600">Monitor conversion, costs, fraud signals, and unit economics</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium ${
                period === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Last {p.replace('d', ' days')}
            </button>
          ))}
        </div>

        {/* Critical Alerts Banner */}
        {(metrics?.summary.fraudSignals || 0) > 0 || (metrics?.summary.unacknowledgedAlerts || 0) > 0 ? (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
            <span className="text-2xl">🚨</span>
            <div className="flex-1">
              <p className="font-medium text-red-900">
                Attention Required
              </p>
              <p className="text-sm text-red-700">
                {metrics?.summary.fraudSignals} fraud signals and {metrics?.summary.unacknowledgedAlerts} unacknowledged alerts need review
              </p>
            </div>
            <a
              href="/admin/alerts"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              View Alerts
            </a>
          </div>
        ) : null}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Free → Paid Conversion"
            value={metrics?.summary.conversionRate || '0%'}
            subtitle={`${metrics?.summary.freeAccounts || 0} free accounts`}
            trend="up"
            color="purple"
          />
          <MetricCard
            title="Net Position"
            value={metrics?.summary.netPosition || '£0.00'}
            subtitle={`Revenue: ${metrics?.summary.totalRevenue || '£0.00'}`}
            trend={metrics && parseFloat(metrics.summary.netPosition.replace(/[£,]/g, '')) >= 0 ? 'up' : 'down'}
            color="green"
          />
          <MetricCard
            title="Support Time"
            value={`${metrics?.support.totalMinutes || 0}m`}
            subtitle={`${metrics?.support.avgMinutesPerFreeAccount.toFixed(1) || 0}m per free account`}
            trend="neutral"
            color="blue"
          />
          <MetricCard
            title="Total Costs"
            value={`£${(metrics?.costs.total || 0).toFixed(2)}`}
            subtitle={`SMS: £${(metrics?.costs.sms || 0).toFixed(2)}`}
            trend="neutral"
            color="orange"
          />
        </div>

        {/* Navigation to Detailed Reports */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportCard
            title="Free Account Analysis"
            description="Cost per free account, API usage, support tickets, high-cost accounts"
            href="/admin/metrics/free-accounts"
            icon="💰"
          />
          <ReportCard
            title="Postcode Economics"
            description="Staff supply, booking volume, fill rate, revenue by geography"
            href="/admin/metrics/postcodes"
            icon="📍"
          />
          <ReportCard
            title="Fraud & Security"
            description="Fraud signals, scraping detection, velocity abuse, IP anomalies"
            href="/admin/metrics/fraud"
            icon="🛡️"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'purple' | 'green' | 'blue' | 'orange';
}) {
  const colors = {
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-6`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function ReportCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all"
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </a>
  );
}
