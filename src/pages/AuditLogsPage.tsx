import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { 
  FileTextIcon, 
  SearchIcon, 
  FilterIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon
} from 'lucide-react';
import { auditService, AuditLog, AuditLogFilters } from '../services/auditService';

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 10,
    offset: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = filters.limit || 10;

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditService.getAuditLogs(filters);
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      offset: 0 // Reset to first page when filters change
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    const currentLimit = filters.limit || 10;
    const newOffset = (newPage - 1) * currentLimit;
    setFilters(prev => ({ ...prev, offset: newOffset }));
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, offset: 0 }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ limit: 10, offset: 0 });
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    // Parse the date and convert to Nairobi timezone
    const dt = DateTime.fromSQL(dateString, { zone: 'Africa/Nairobi' });
    
    // If SQL parsing fails, try ISO format
    const dateTime = dt.isValid 
      ? dt 
      : DateTime.fromISO(dateString, { zone: 'Africa/Nairobi' });
    
    if (!dateTime.isValid) {
      return dateString; // Return original if parsing fails
    }
    
    // Format in Nairobi timezone
    return dateTime.setZone('Africa/Nairobi').toLocaleString({
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('ASSIGN')) return 'bg-purple-100 text-purple-800';
    if (action.includes('LOGIN')) return 'bg-indigo-100 text-indigo-800';
    if (action.includes('LOGOUT')) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const totalPages = Math.ceil(total / (filters.limit || 10));

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Audit Trail</h1>
            <p className="mt-1 text-xs text-gray-500">
              Track all system activities and user actions
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FilterIcon className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Action
                </label>
                <input
                  type="text"
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  placeholder="e.g., CREATE_REQUEST"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Entity Type
                </label>
                <input
                  type="text"
                  value={filters.entityType || ''}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  placeholder="e.g., request, client"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Staff ID
                </label>
                <input
                  type="number"
                  value={filters.staffId || ''}
                  onChange={(e) => handleFilterChange('staffId', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Staff ID"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats and Records Per Page Selector */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>Total Records: <strong>{total}</strong></span>
          <span>Showing: <strong>{logs.length}</strong> records</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700">
            Records per page:
          </label>
          <select
            value={filters.limit || 10}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-xs text-gray-600">Loading audit logs...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xs text-gray-600">No audit logs found</p>
        </div>
      ) : (
        <>
          {/* Audit Logs Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-3 w-3 text-gray-400" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="h-3 w-3 text-gray-400" />
                          <div className="font-medium">{log.staff_name || log.staff_username || 'Unknown'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {log.entity_type && (
                          <div>
                            <div className="font-medium">{log.entity_type}</div>
                            {log.entity_type === 'request' && log.details && (
                              <>
                                {log.action === 'ASSIGN_TEAM_TO_REQUEST' && log.details.teamName && (
                                  <div className="text-gray-600 mt-0.5">Team: {log.details.teamName}</div>
                                )}
                                {log.details.serviceTypeName && (
                                  <div className="text-gray-600 mt-0.5">Service: {log.details.serviceTypeName}</div>
                                )}
                                {log.details.branchName && (
                                  <div className="text-gray-600 mt-0.5">Branch: {log.details.branchName}</div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {log.details && (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800 text-xs">
                              View Details
                            </summary>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs max-w-md">
                              {log.entity_type === 'request' && log.details ? (
                                <div className="space-y-1">
                                  {log.action === 'ASSIGN_TEAM_TO_REQUEST' && log.details.teamName && (
                                    <div><span className="font-medium">Team:</span> {log.details.teamName}</div>
                                  )}
                                  {log.details.serviceTypeName && (
                                    <div><span className="font-medium">Service:</span> {log.details.serviceTypeName}</div>
                                  )}
                                  {log.details.branchName && (
                                    <div><span className="font-medium">Branch:</span> {log.details.branchName}</div>
                                  )}
                                  {log.details.pickupLocation && (
                                    <div><span className="font-medium">Pickup:</span> {log.details.pickupLocation}</div>
                                  )}
                                  {log.details.deliveryLocation && (
                                    <div><span className="font-medium">Delivery:</span> {log.details.deliveryLocation}</div>
                                  )}
                                  {log.details.price && (
                                    <div><span className="font-medium">Price:</span> {log.details.price}</div>
                                  )}
                                  {log.details.status && (
                                    <div><span className="font-medium">Status:</span> {log.details.status}</div>
                                  )}
                                  {log.details.myStatus !== undefined && (
                                    <div><span className="font-medium">My Status:</span> {log.details.myStatus}</div>
                                  )}
                                  {log.details.priority && (
                                    <div><span className="font-medium">Priority:</span> {log.details.priority}</div>
                                  )}
                                  {/* Show full JSON for other details */}
                                  {Object.keys(log.details).some(key => 
                                    !['serviceTypeName', 'branchName', 'pickupLocation', 'deliveryLocation', 'price', 'status', 'myStatus', 'priority', 'teamName', 'teamId', 'requestId'].includes(key)
                                  ) && (
                                    <details className="mt-2">
                                      <summary className="text-gray-600 cursor-pointer">More details</summary>
                                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              ) : (
                                <pre className="overflow-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              )}
                            </div>
                          </details>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogsPage;

