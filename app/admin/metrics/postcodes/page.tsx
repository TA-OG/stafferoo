'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import PageHeader from '@/app/components/PageHeader';

interface PostcodeMetric {
  district: string;
  staffCount: number;
  settingCount: number;
  bookings: {
    total: number;
    filled: number;
    cancelled: number;
    fillRate: string;
  };
  hours: number;
  revenue: number;
  avgResponseTime: string;
  supplyDemandRatio: string;
}

interface PostcodeMetrics {
  postcodes: PostcodeMetric[];
  summary: {
    totalPostcodes: number;
    totalStaff: number;
    totalSettings: number;
    totalBookings: number;
    overallFillRate: string;
    avgStaffPerPostcode: string;
    avgSettingsPerPostcode: string;
  };
  insights: {
    problemAreas: Array<{
      postcode: string;
      fillRate: string;
      bookings: number;
      staffCount: number;
      issue: string;
    }>;
    highPerformers: Array<{
      postcode: string;
      fillRate: string;
      bookings: number;
      revenue: string;
    }>;
    undersupplied: string[];
    oversupplied: string[];
  };
}

export default function PostcodeMetricsPage() {
  const [data, setData] = useState<PostcodeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/metrics/postcodes', {
        headers: {
          'Authorization': `Bearer ${session.session?.access_token}`,
        },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to load postcode metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Metrics', href: '/admin/metrics' },
          { label: 'Postcodes' }
        ]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Postcode Economics</h1>
          <p className="mt-2 text-gray-600">Unit economics by geography: supply, demand, fill rates</p>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active Postcodes</p>
              <p className="text-2xl font-bold">{data.summary.totalPostcodes}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Overall Fill Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {data.summary.overallFillRate}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Supply:Demand Ratio</p>
              <p className="text-2xl font-bold">
                {data.summary.totalStaff}:{data.summary.totalSettings}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold">{data.summary.totalBookings}</p>
            </div>
          </div>
        )}

        {/* Problem Areas */}
        {data && data.insights.problemAreas.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">🚨 Problem Areas (Low Fill Rate)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.insights.problemAreas.map((area) => (
                <div key={area.postcode} className="bg-white rounded p-3">
                  <p className="font-medium">{area.postcode}</p>
                  <p className="text-sm text-red-600">Fill rate: {area.fillRate}</p>
                  <p className="text-xs text-gray-500">
                    {area.bookings} bookings, {area.staffCount} staff
                  </p>
                  <p className="text-xs font-medium text-orange-600 mt-1">
                    Issue: {area.issue.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Postcode Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-lg">Postcode Details</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Postcode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supply:Demand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fill Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.postcodes.map((pc) => (
                    <tr key={pc.district}>
                      <td className="px-4 py-3 font-medium">{pc.district}</td>
                      <td className="px-4 py-3">{pc.staffCount}</td>
                      <td className="px-4 py-3">{pc.settingCount}</td>
                      <td className="px-4 py-3">{pc.supplyDemandRatio}</td>
                      <td className="px-4 py-3">
                        {pc.bookings.total}
                        <span className="text-xs text-green-600 ml-1">
                          ({pc.bookings.filled} filled)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          parseFloat(pc.bookings.fillRate) > 80 ? 'text-green-600' :
                          parseFloat(pc.bookings.fillRate) > 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {pc.bookings.fillRate}
                        </span>
                      </td>
                      <td className="px-4 py-3">£{pc.revenue?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
