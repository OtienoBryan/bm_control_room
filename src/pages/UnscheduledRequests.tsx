import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  RefreshCwIcon, 
  FilterIcon, 
  SearchIcon, 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon,
  AlertCircleIcon,
  ClockIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';
import RequestFormModal from '../components/Requests/RequestFormModal';
import AssignTeamModal from '../components/Requests/AssignTeamModal';
import { RequestData, requestService } from '../services/requestService';
import { useAuth } from '../contexts/AuthContext';

const UnscheduledRequestsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignTeamModalOpen, setIsAssignTeamModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user, isLoading: authLoading } = useAuth();

  const fetchRequests = async () => {
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Fetch unscheduled requests (myStatus = 0) for the main table
      const unscheduledData = await requestService.getRequests({ myStatus: 0 });
      
      // Filter requests to only show those belonging to the current user
      const userUnscheduledRequests = unscheduledData.filter(request => request.userId === user.id);
      
      setRequests(userUnscheduledRequests);
      
      // Calculate statistics for unscheduled requests only
      const inProgress = userUnscheduledRequests.filter(r => r.status === 1).length;
      const completed = userUnscheduledRequests.filter(r => r.status === 2).length;
      
      
      setStats({
        total: userUnscheduledRequests.length,
        pending: 0, // This will be updated by fetchPendingCount
        inProgress,
        completed
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    if (authLoading || !user?.id) return;
    
    try {
      // Fetch only pending requests (myStatus = 1) for the pending card
      const pendingData = await requestService.getRequests({ myStatus: 1 });
      
      // Filter requests to only show those belonging to the current user
      const userPendingRequests = pendingData.filter(request => request.userId === user.id);
      
      // Store pending requests for display
      setPendingRequests(userPendingRequests);
      
      // Update only the pending count in stats
      setStats(prevStats => ({
        ...prevStats,
        pending: userPendingRequests.length
      }));
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading before making API calls
    if (!authLoading && user?.id) {
      fetchRequests();
      fetchPendingCount();
    }
  }, [user?.id, authLoading]);

  const handleSuccess = () => {
    fetchRequests();
    fetchPendingCount();
    // Reset to all view when refreshing
    setSelectedCard('all');
    setStatusFilter('all');
  };

  const handleRequestClick = (request: RequestData) => {
    setSelectedRequest(request);
    setIsAssignTeamModalOpen(true);
  };

  // Helper function to get status label
  const getStatusLabel = (status: number): string => {
    switch (status) {
      case 0: return 'pending';
      case 1: return 'in_progress';
      case 2: return 'completed';
      case 3: return 'cancelled';
      default: return 'unknown';
    }
  };

  // Get the current dataset based on selected card
  const getCurrentDataset = () => {
    switch (selectedCard) {
      case 'pending':
        return pendingRequests;
      case 'all':
      default:
        return requests;
    }
  };

  // Filter functions
  const filteredRequests = getCurrentDataset().filter(request => {
    // If search term is empty, match all requests
    const matchesSearch = searchTerm === '' || 
      request.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.deliveryLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = filterBranch === 'all' || request.branchName === filterBranch;
    const matchesStatus = statusFilter === 'all' || getStatusLabel(request.status) === statusFilter;
    
    return matchesSearch && matchesBranch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBranch, statusFilter, selectedCard, itemsPerPage]);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique branches for filter
  const uniqueBranches = Array.from(new Set(requests.map(r => r.branchName))).filter(Boolean);

  // Show loading if auth is still initializing or data is loading
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 py-4">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Unscheduled Requests</h1>
              <p className="text-xs text-gray-600 mt-0.5">Manage and track all pending unscheduled requests</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchRequests}
                className="bg-gray-600 text-white px-2.5 py-1 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-xs"
              >
                <RefreshCwIcon size={14} />
                Refresh
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-900 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-sm text-xs"
              >
                <PlusIcon size={14} />
                Add New Request
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div 
            onClick={() => {
              setSelectedCard('all');
              setStatusFilter('all');
            }}
            className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              selectedCard === 'all' 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center p-3">
              <div className={`p-1.5 rounded-lg ${
                statusFilter === 'all' ? 'bg-blue-200' : 'bg-blue-100'
              }`}>
                <AlertCircleIcon className={`h-4 w-4 ${
                  statusFilter === 'all' ? 'text-blue-700' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${
                  statusFilter === 'all' ? 'text-blue-700' : 'text-gray-600'
                }`}>Total Requests</p>
                <p className={`text-base font-bold ${
                  statusFilter === 'all' ? 'text-blue-700' : 'text-gray-900'
                }`}>{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => {
              setSelectedCard('pending');
              setStatusFilter('all');
            }}
            className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              selectedCard === 'pending' 
                ? 'border-yellow-300 bg-yellow-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center p-3">
              <div className={`p-1.5 rounded-lg ${
                statusFilter === 'pending' ? 'bg-yellow-200' : 'bg-yellow-100'
              }`}>
                <ClockIcon className={`h-4 w-4 ${
                  statusFilter === 'pending' ? 'text-yellow-700' : 'text-yellow-600'
                }`} />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${
                  statusFilter === 'pending' ? 'text-yellow-700' : 'text-gray-600'
                }`}>Pending</p>
                <p className={`text-base font-bold ${
                  statusFilter === 'pending' ? 'text-yellow-700' : 'text-yellow-600'
                }`}>{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => {
              setSelectedCard('all');
              setStatusFilter('in_progress');
            }}
            className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              selectedCard === 'all' && statusFilter === 'in_progress'
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center p-3">
              <div className={`p-1.5 rounded-lg ${
                statusFilter === 'in_progress' ? 'bg-blue-200' : 'bg-blue-100'
              }`}>
                <ClockIcon className={`h-4 w-4 ${
                  statusFilter === 'in_progress' ? 'text-blue-700' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${
                  statusFilter === 'in_progress' ? 'text-blue-700' : 'text-gray-600'
                }`}>In Progress</p>
                <p className={`text-base font-bold ${
                  statusFilter === 'in_progress' ? 'text-blue-700' : 'text-blue-600'
                }`}>{stats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => {
              setSelectedCard('all');
              setStatusFilter('completed');
            }}
            className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              selectedCard === 'all' && statusFilter === 'completed'
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center p-3">
              <div className={`p-1.5 rounded-lg ${
                statusFilter === 'completed' ? 'bg-green-200' : 'bg-green-100'
              }`}>
                <CheckIcon className={`h-4 w-4 ${
                  statusFilter === 'completed' ? 'text-green-700' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${
                  statusFilter === 'completed' ? 'text-green-700' : 'text-gray-600'
                }`}>Completed</p>
                <p className={`text-base font-bold ${
                  statusFilter === 'completed' ? 'text-green-700' : 'text-green-600'
                }`}>{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hidden">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search requests by client, branch, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              {uniqueBranches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">
              {selectedCard === 'pending' ? 'Pending Requests' : 'Unscheduled Requests'} ({filteredRequests.length} requests)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Location
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Location
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Date
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Charges
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center">
                      <div className="text-gray-500">
                        <AlertCircleIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm font-medium">No requests found</p>
                        <p className="text-xs">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{request.clientName}</div>
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{request.serviceTypeName}</div>
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{request.branchName}</div>
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center text-xs text-gray-900">
                          <MapPinIcon className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="max-w-xs truncate">{request.pickupLocation}</span>
                        </div>
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center text-xs text-gray-900">
                          <MapPinIcon className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="max-w-xs truncate">{request.deliveryLocation}</span>
                        </div>
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center text-xs text-gray-900">
                          <CalendarIcon className="h-3 w-3 text-gray-400 mr-1" />
                          {formatDate(request.pickupDate)}
                        </div>
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          KES {request.price?.toLocaleString() || '0'}
                        </div>
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatDateTime(request.createdAt)}
                      </td>
                      
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={() => handleRequestClick(request)}
                          className="text-green-600 hover:text-green-900 transition-colors px-2 py-0.5 rounded-md hover:bg-green-50"
                          title="Assign Team"
                        >
                          Assign Team
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {filteredRequests.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-700">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs text-gray-700">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} entries
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-1 text-xs text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 py-1 text-xs border rounded ${
                            currentPage === page
                              ? 'bg-red-600 text-white border-red-600'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <RequestFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />

        {selectedRequest && (
          <AssignTeamModal
            isOpen={isAssignTeamModalOpen}
            onClose={() => {
              setIsAssignTeamModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={handleSuccess}
            request={selectedRequest}
          />
        )}
      </div>
    </div>
  );
};

export default UnscheduledRequestsPage;