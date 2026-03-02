'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import PageHeader from '@/app/components/PageHeader';

interface FreeAccount {
  id: string;
  name: string;
  email: string;
  postcode: string;
  registeredAt: string;
  costs: {
    total: number;
    support: number;
    sms: number;
    api: number;
  };
  usage: {
    smsCount: number;
    apiCalls: number;
    supportMinutes: number;
    supportTickets: number;
  };
  flagForReview: boolean;
}

interface FreeAccountMetrics {
  accounts: FreeAccount[];
  highCostAccounts: FreeAccount[];
  summary: {
    totalFreeAccounts: number;
    highCostAccountsCount: number;
    avgCostPerAccount: string;
    avgApiCallsPerAccount: string;
    avgSupportTicketsPerAccount: string;
    totalCostAllFree: string;
  };
}

export default function FreeAccountsMetricsPage() {
  const [data, setData] = useState<FreeAccountMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [minCost, setMinCost] = useState(5);

  useEffect(() => {
    loadData();
  }, [minCost]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/metrics/free-accounts?minCost=${minCost}`, {
        headers: {
          'Authorization': `Bearer ${session.session?.access_token}`,
        },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to load free account metrics:', error);
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
          { label: 'Free Accounts' }
        ]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Free Account Analysis</h1>
          <p className="mt-2 text-gray-600">Cost per account, API usage, support burden</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Cost Threshold: £{minCost}
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={minCost}
            onChange={(e) => setMinCost(parseInt(e.target.value))}
            className="w-full max-w-md"
          />
          <p className="text-sm text-gray-500 mt-1">
            Show accounts costing more than £{minCost} in the last 30 days
          </p>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Free Accounts</p>
              <p className="text-2xl font-bold">{data.summary.totalFreeAccounts}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">High Cost Accounts</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.summary.highCostAccountsCount}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Avg Cost per Account</p>
              <p className="text-2xl font-bold">£{data.summary.avgCostPerAccount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Cost (All Free)</p>
              <p className="text-2xl font-bold text-red-600">
                £{data.summary.totalCostAllFree}
              </p>
            </div>
          </div>
        )}

        {/* High Cost Accounts Table */}
        {data && data.highCostAccounts.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-lg text-red-700">
                ⚠️ High Cost Accounts (Review Recommended)
              </h2>
              <p className="text-sm text-gray-600">
                These free accounts are consuming significant resources. Consider outreach or sunsetting.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Support</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Calls</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SMS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.highCostAccounts.map((account) => (
                    <tr key={account.id} className="bg-red-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-sm text-gray-500">{account.email}</p>
                        <p className="text-xs text-gray-400">{account.postcode}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-red-700">
                        £{account.costs.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {account.usage.supportMinutes}m
                        <span className="text-xs text-gray-500 block">
                          {account.usage.supportTickets} tickets
                        </span>
                      </td>
                      <td className="px-4 py-3">{account.usage.apiCalls}</td>
                      <td className="px-4 py-3">{account.usage.smsCount}</td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Accounts Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-lg">All Free Accounts</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Support Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.accounts.map((account) => (
                    <tr key={account.id} className={account.flagForReview ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-sm text-gray-500">{account.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(account.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        £{account.costs.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {account.usage.supportMinutes}m
                      </td>
                      <td className="px-4 py-3">
                        {account.usage.apiCalls}
                      </td>
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
