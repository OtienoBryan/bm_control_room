import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DateTime } from 'luxon';

interface DateSummary {
  date: string;
  totalRequests: number;
  totalAmount: number;
}

const DoneRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateSummaries, setDateSummaries] = useState<DateSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  useEffect(() => {
    fetchDateSummaries();
  }, [selectedYear, selectedMonth]);

  const fetchDateSummaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString()
      });

      const response = await api.get(`/requests/done/dates?${params.toString()}`);
      console.log('DoneRequestsPage - Fetched summaries:', response.data);
      if (response.data && response.data.length > 0) {
        console.log('DoneRequestsPage - First summary date:', response.data[0].date);
        // Ensure dates are strings in YYYY-MM-DD format
        const processedData = response.data.map((summary: any) => ({
          ...summary,
          date: typeof summary.date === 'string' 
            ? summary.date.split('T')[0].split(' ')[0] 
            : summary.date
        }));
        setDateSummaries(processedData);
      } else {
        setDateSummaries(response.data);
      }
    } catch (err) {
      setError('Failed to fetch done requests summaries');
      console.error('Error fetching date summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Use Luxon to format the date without timezone conversion
    const dt = DateTime.fromISO(dateString.split('T')[0]);
    if (dt.isValid) {
      return dt.toLocaleString({ weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    }
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

  const handleDateClick = (date: string | Date) => {
    // Navigate to the done details page
    let dateStr: string;
    
    if (typeof date === 'string') {
      dateStr = date.split('T')[0].split(' ')[0].trim();
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const match = date.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          dateStr = `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          console.error('Invalid date format:', date);
          return;
        }
      }
    } else if (date instanceof Date) {
      const isoString = date.toISOString();
      dateStr = isoString.split('T')[0];
    } else {
      console.error('Invalid date type:', typeof date, date);
      return;
    }
    
    console.log('DoneRequestsPage - Date clicked:', dateStr);
    navigate(`/dashboard/done-details/${encodeURIComponent(dateStr)}`);
  };

  const clearFilters = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
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
              <h1 className="text-base font-bold text-gray-900">Done Requests</h1>
              <p className="text-xs text-gray-500 mt-1">View completed requests by date</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchDateSummaries}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Refresh Data
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

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

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm border p-3 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Dates</p>
                <p className="text-lg font-bold text-green-600">{dateSummaries.length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-3 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Amount</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(dateSummaries.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0))}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Completed Requests by Date</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Total Requests
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
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
                        {summary.totalRequests}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-900 mb-1">No completed requests found</p>
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

export default DoneRequestsPage;

