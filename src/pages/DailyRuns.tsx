import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DateTime } from 'luxon';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateSummaries, setDateSummaries] = useState<DateSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | ''>('');
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
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
      console.log('DailyRuns - Fetched summaries:', response.data);
      if (response.data && response.data.length > 0) {
        console.log('DailyRuns - First summary date (raw):', response.data[0].date);
        console.log('DailyRuns - First summary date type:', typeof response.data[0].date);
        console.log('DailyRuns - First summary date JSON:', JSON.stringify(response.data[0].date));
        // Ensure dates are strings in YYYY-MM-DD format
        const processedData = response.data.map((summary: any) => ({
          ...summary,
          date: typeof summary.date === 'string' 
            ? summary.date.split('T')[0].split(' ')[0] 
            : summary.date
        }));
        console.log('DailyRuns - Processed first date:', processedData[0].date);
        setDateSummaries(processedData);
      } else {
      setDateSummaries(response.data);
      }
    } catch (err) {
      setError('Failed to fetch run summaries');
      console.error('Error fetching date summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Use Luxon to format the date without timezone conversion
    // Parse the date string as-is from database (YYYY-MM-DD format)
    const dt = DateTime.fromISO(dateString.split('T')[0]);
    if (dt.isValid) {
      return dt.toLocaleString({ weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    }
    // Fallback to original if Luxon parsing fails
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


  const clearFilters = () => {
    setSelectedClient('');
    setSelectedBranch('');
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
  };

  const handleDateClick = (date: string | Date) => {
    // Navigate to the separate page for date requests
    // Use the date exactly as it comes from the database - NO conversion
    let dateStr: string;
    
    console.log('DailyRuns - handleDateClick called with:', date);
    console.log('DailyRuns - Date type:', typeof date);
    console.log('DailyRuns - Date value:', JSON.stringify(date));
    
    if (typeof date === 'string') {
      // Extract just the date part (YYYY-MM-DD) from the string
      // The date from database should be in format "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ"
      // We want ONLY the YYYY-MM-DD part, no time, no timezone
      dateStr = date.split('T')[0].split(' ')[0].trim();
      
      console.log('DailyRuns - Extracted date string:', dateStr);
      
      // Validate it's in YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Try to extract YYYY-MM-DD using regex
        const match = date.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          dateStr = `${match[1]}-${match[2]}-${match[3]}`;
          console.log('DailyRuns - Regex extracted date:', dateStr);
        } else {
          console.error('Invalid date format:', date);
          return;
        }
      }
    } else if (date instanceof Date) {
      // If it's a Date object, we need to be careful
      // Get the date components directly without timezone conversion
      // Use Luxon to parse from the date object's local date components
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
      console.log('DailyRuns - Converted Date object to:', dateStr);
    } else {
      console.error('Invalid date type:', typeof date, date);
      return;
    }
    
    console.log('DailyRuns - Final date string for navigation:', dateStr);
    
    // URL encode the date to handle special characters
    navigate(`/dashboard/date-requests/${encodeURIComponent(dateStr)}`);
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h1 className="text-base font-bold text-gray-900">Daily Runs Dashboard</h1>
              <p className="text-xs text-gray-500 mt-1">Monitor daily operations, revenue, and performance metrics</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard/runs')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                View Detailed Reports
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button
                onClick={fetchDateSummaries}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Refresh Data
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Client</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 text-xs rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  >
                    <option value="">All Clients</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Branch</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 text-xs rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 disabled:bg-gray-100"
                    disabled={!selectedClient}
                  >
                    <option value="">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  >
                    {monthOptions.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm border p-3 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Runs</p>
                <p className="text-lg font-bold text-blue-600">{summaryStats.totalRuns}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-3 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(summaryStats.totalAmount)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Daily Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Total Runs
                    </th>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dateSummaries.map((summary) => {
                    return (
                      <tr key={summary.date} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          <button
                            onClick={() => handleDateClick(summary.date)}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                          {formatDate(summary.date)}
                          </button>
                        </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {summary.totalRuns}
                        </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {formatCurrency(Number(summary.totalAmount || 0))}
                        </td>
                      </tr>
                    );
                  })}
                  {dateSummaries.length === 0 && (
                    <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-xs text-gray-500">
                        <div className="flex flex-col items-center">
                        <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        <p className="text-sm font-medium text-gray-900 mb-1">No data available</p>
                        <p className="text-xs text-gray-600">Try adjusting your filters or selecting a different time period.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
};

export default DailyRuns; 