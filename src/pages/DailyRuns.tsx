import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DateSummary {
  date: string;
  totalRuns: number;
  totalRunsCompleted: number;
  totalAmount: number;
  totalAmountCompleted: number;
}

interface Client {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
  client_id: number;
}

const DailyRuns: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateSummaries, setDateSummaries] = useState<DateSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | ''>('');
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'table' | 'line' | 'bar' | 'doughnut'>('table');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchBranches(selectedClient);
    } else {
      setBranches([]);
      setSelectedBranch('');
    }
  }, [selectedClient]);

  useEffect(() => {
    fetchDateSummaries();
  }, [selectedYear, selectedMonth, selectedClient, selectedBranch]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchBranches = async (clientId: number) => {
    try {
      const response = await api.get(`/clients/${clientId}/branches`);
      setBranches(response.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchDateSummaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString()
      });
      
      if (selectedClient) {
        params.append('clientId', selectedClient.toString());
      }
      if (selectedBranch) {
        params.append('branchId', selectedBranch.toString());
      }

      const response = await api.get(`/runs/summaries?${params.toString()}`);
      setDateSummaries(response.data);
    } catch (err) {
      setError('Failed to fetch run summaries');
      console.error('Error fetching date summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  
  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalRuns = dateSummaries.reduce((sum, summary) => sum + Number(summary.totalRuns || 0), 0);
    const totalAmount = dateSummaries.reduce((sum, summary) => sum + Number(summary.totalAmount || 0), 0);
    const totalCompleted = dateSummaries.reduce((sum, summary) => sum + Number(summary.totalRunsCompleted || 0), 0);
    const totalAmountCompleted = dateSummaries.reduce((sum, summary) => sum + Number(summary.totalAmountCompleted || 0), 0);
    const completionRate = totalRuns > 0 ? (totalCompleted / totalRuns) * 100 : 0;
    const averageRunValue = totalRuns > 0 ? totalAmount / totalRuns : 0;

    return {
      totalRuns,
      totalAmount,
      totalCompleted,
      totalAmountCompleted,
      completionRate,
      averageRunValue
    };
  }, [dateSummaries]);

  // Chart data configurations
  const lineChartData = {
    labels: dateSummaries.map(summary => formatDate(summary.date)),
    datasets: [
      {
        label: 'Total Runs',
        data: dateSummaries.map(summary => summary.totalRuns),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Completed Runs',
        data: dateSummaries.map(summary => summary.totalRunsCompleted),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      }
    ]
  };

  const barChartData = {
    labels: dateSummaries.map(summary => formatDate(summary.date)),
    datasets: [
      {
        label: 'Revenue',
        data: dateSummaries.map(summary => Number(summary.totalAmount || 0)),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y1',
      }
    ]
  };

  const doughnutChartData = {
    labels: ['Completed', 'Pending', 'In Progress'],
    datasets: [
      {
        data: [
          summaryStats.totalCompleted,
          summaryStats.totalRuns - summaryStats.totalCompleted,
          0 // You can add in-progress data if available
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)'
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            if (context.datasetIndex === 0 || context.datasetIndex === 1) {
              return `${context.dataset.label}: ${context.parsed.y} runs`;
            }
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Number of Runs',
          font: { size: 12 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Amount ($)',
          font: { size: 12 }
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      }
    }
  };

  const clearFilters = () => {
    setSelectedClient('');
    setSelectedBranch('');
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Daily Runs Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor daily operations, revenue, and performance metrics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                onClick={fetchDateSummaries}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Refresh Data
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  >
                    <option value="">All Clients</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 disabled:bg-gray-100"
                    disabled={!selectedClient}
                  >
                    <option value="">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  >
                    {monthOptions.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Runs</p>
                <p className="text-3xl font-bold text-blue-600">{summaryStats.totalRuns}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(summaryStats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-yellow-600">{summaryStats.completionRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Run Value</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(summaryStats.averageRunValue)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'line', label: 'Line Chart', icon: '📈' },
              { key: 'bar', label: 'Bar Chart', icon: '📊' },
              { key: 'doughnut', label: 'Distribution', icon: '🥧' },
              { key: 'table', label: 'Table View', icon: '📋' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === key
                    ? 'bg-red-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-red-300'
                }`}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart/Table Views */}
        {viewMode === 'line' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Runs Performance Trend</h3>
            <Line options={chartOptions} data={lineChartData} />
          </div>
        )}

        {viewMode === 'bar' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue</h3>
            <Bar options={chartOptions} data={barChartData} />
          </div>
        )}

        {viewMode === 'doughnut' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Runs Completion Distribution</h3>
            <div className="flex justify-center">
              <div className="w-80 h-80">
                <Doughnut 
                  data={doughnutChartData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: 'bottom' as const,
                        labels: { usePointStyle: true, padding: 20 }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Daily Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Runs
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dateSummaries.map((summary) => {
                    const completionRate = summary.totalRuns > 0 ? (summary.totalRunsCompleted / summary.totalRuns) * 100 : 0;
                    return (
                      <tr key={summary.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(summary.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {summary.totalRuns}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {summary.totalRunsCompleted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(Number(summary.totalAmount || 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            completionRate >= 80 ? 'bg-green-100 text-green-800' :
                            completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {completionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {dateSummaries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-lg font-medium text-gray-900 mb-2">No data available</p>
                          <p className="text-gray-600">Try adjusting your filters or selecting a different time period.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center">
          <a
            href="/dashboard/runs"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
          >
            View Detailed Reports
          </a>
        </div>
      </div>
    </div>
  );
};

export default DailyRuns; 