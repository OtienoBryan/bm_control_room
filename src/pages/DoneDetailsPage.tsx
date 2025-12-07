import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DateTime } from 'luxon';

interface RequestData {
  id: number;
  clientName: string;
  userName: string;
  branchName: string;
  serviceTypeName: string;
  pickupLocation: string;
  deliveryLocation: string;
  price: string;
  status: string;
  myStatus: number;
  pickupDate: string;
  createdAt: string;
  updatedAt: string;
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

const DoneDetailsPage: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestData[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | ''>('');
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!date) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Decode the date from URL parameter
      const decodedDate = decodeURIComponent(date);
      console.log('DoneDetailsPage - Original URL param:', date);
      console.log('DoneDetailsPage - Decoded date:', decodedDate);
      
      // Extract just the date part (YYYY-MM-DD) - remove time and any spaces if present
      // Use the date exactly as it comes from the database - NO conversion, NO timezone handling
      let dateStr = decodedDate.split('T')[0].split(' ')[0].trim();
      
      // Validate the date format using regex only - no date parsing
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        // Try to extract YYYY-MM-DD from the string using regex
        const match = decodedDate.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          dateStr = `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          console.error('Invalid date format:', decodedDate);
          setError('Invalid date format');
          return;
        }
      }
      
      // Use Luxon only for validation, not for conversion
      // Parse as a simple date string without timezone to validate format
      const dateTime = DateTime.fromISO(dateStr);
      if (!dateTime.isValid) {
        console.error('Invalid date format:', dateStr);
        setError('Invalid date format');
        return;
      }
      
      // Use the date string as-is (YYYY-MM-DD format) - exactly as from database
      // NO conversion, NO timezone handling - use the string directly
      
      console.log('DoneDetailsPage - Final formatted date for API:', dateStr);
      
      // Make API call with the formatted date and my_status = 3
      // This will fetch ONLY requests for this specific date
      const response = await api.get('/requests', {
        params: { 
          date: dateStr,
          myStatus: 3
        }
      });
      
      console.log('DoneDetailsPage - API response status:', response.status);
      console.log('DoneDetailsPage - Fetched requests count:', response.data?.length || 0);
      
      // Verify all returned requests are for the correct date
      if (response.data && response.data.length > 0) {
        const sampleRequest = response.data[0];
        const requestDate = sampleRequest.pickupDate || sampleRequest.pickup_date;
        console.log('DoneDetailsPage - Sample request pickup_date:', requestDate);
        console.log('DoneDetailsPage - Expected date:', dateStr);
        
        // Filter out any requests that don't match the date (safety check)
        const filteredByDate = response.data.filter((req: any) => {
          const reqDate = req.pickupDate || req.pickup_date;
          if (reqDate) {
            const reqDateStr = typeof reqDate === 'string' 
              ? reqDate.split('T')[0].split(' ')[0] 
              : new Date(reqDate).toISOString().split('T')[0];
            return reqDateStr === dateStr;
          }
          return false;
        });
        
        if (filteredByDate.length !== response.data.length) {
          console.warn(`DoneDetailsPage - Filtered out ${response.data.length - filteredByDate.length} requests that didn't match the date`);
        }
        
        setRequests(filteredByDate);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error('DoneDetailsPage - Error fetching requests:', error);
      console.error('DoneDetailsPage - Error response:', error?.response?.data);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch requests';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (date) {
      fetchRequests();
      fetchClients();
    }
  }, [date, fetchRequests]);

  useEffect(() => {
    if (selectedClient) {
      fetchBranches(selectedClient);
    } else {
      setBranches([]);
      setSelectedBranch('');
    }
  }, [selectedClient]);

  useEffect(() => {
    applyFilters();
  }, [requests, selectedClient, selectedBranch, selectedRequestType]);

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

  const applyFilters = () => {
    let filtered = [...requests];

    if (selectedClient) {
      // Filter by client name
      filtered = filtered.filter(request => 
        request.clientName && request.clientName.toLowerCase().includes(
          clients.find(c => c.id === selectedClient)?.name.toLowerCase() || ''
        )
      );
    }

    if (selectedBranch) {
      // Filter by branch name
      filtered = filtered.filter(request => 
        request.branchName && request.branchName.toLowerCase().includes(
          branches.find(b => b.id === selectedBranch)?.name.toLowerCase() || ''
        )
      );
    }

    if (selectedRequestType) {
      // Filter by request type (normal/adhoc)
      if (selectedRequestType === 'normal') {
        // Normal requests are not adhoc requests (client name is not "Adhoc Request")
        filtered = filtered.filter(request => 
          request.clientName && request.clientName !== 'Adhoc Request'
        );
      } else if (selectedRequestType === 'adhoc') {
        // Adhoc requests have client name "Adhoc Request"
        filtered = filtered.filter(request => 
          request.clientName === 'Adhoc Request'
        );
      }
    }

    setFilteredRequests(filtered);
  };

  const clearFilters = () => {
    setSelectedClient('');
    setSelectedBranch('');
    setSelectedRequestType('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
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

  if (error) {
    return (
      <div className="px-3 sm:px-4 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-3">
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
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/dashboard/done-requests')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mb-3"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Done Requests
              </button>
              <h1 className="text-base font-bold text-gray-900">
                Done Requests for {date ? formatDate(date) : ''}
              </h1>
              <p className="mt-1 text-xs text-gray-500">
                {filteredRequests.length} of {requests.length} completed request{requests.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Request Type</label>
                <select
                  value={selectedRequestType}
                  onChange={(e) => setSelectedRequestType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="">All Types</option>
                  <option value="normal">Normal</option>
                  <option value="adhoc">Adhoc</option>
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

        {/* Requests Table */}
        <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
          <div className="px-3 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Request Details</h2>
          </div>
          
          <div className="overflow-x-auto">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-xs font-medium text-gray-900">No completed requests found</h3>
                <p className="mt-1 text-[11px] text-gray-500">
                  No completed requests were found for this date.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Pickup Location
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Location
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {request.clientName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {request.branchName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {request.serviceTypeName || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {request.pickupLocation || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {request.deliveryLocation || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatCurrency(Number(request.price || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoneDetailsPage;

