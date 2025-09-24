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
  const { user } = useAuth();

  const fetchRequests = async () => {
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
    if (!user?.id) return;
    
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
    fetchRequests();
    fetchPendingCount();
  }, [user?.id]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unscheduled Requests</h1>
              <p className="text-gray-600 mt-1">Manage and track all pending unscheduled requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchRequests}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <RefreshCwIcon size={20} />
                Refresh
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <PlusIcon size={20} />
                Add New Request
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <div className="flex items-center p-6">
              <div className={`p-2 rounded-lg ${
                statusFilter === 'all' ? 'bg-blue-200' : 'bg-blue-100'
              }`}>
                <AlertCircleIcon className={`h-6 w-6 ${
                  statusFilter === 'all' ? 'text-blue-700' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  statusFilter === 'all' ? 'text-blue-700' : 'text-gray-600'
                }`}>Total Requests</p>
                <p className={`text-2xl font-bold ${
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
            <div className="flex items-center p-6">
              <div className={`p-2 rounded-lg ${
                statusFilter === 'pending' ? 'bg-yellow-200' : 'bg-yellow-100'
              }`}>
                <ClockIcon className={`h-6 w-6 ${
                  statusFilter === 'pending' ? 'text-yellow-700' : 'text-yellow-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  statusFilter === 'pending' ? 'text-yellow-700' : 'text-gray-600'
                }`}>Pending</p>
                <p className={`text-2xl font-bold ${
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
            <div className="flex items-center p-6">
              <div className={`p-2 rounded-lg ${
                statusFilter === 'in_progress' ? 'bg-blue-200' : 'bg-blue-100'
              }`}>
                <ClockIcon className={`h-6 w-6 ${
                  statusFilter === 'in_progress' ? 'text-blue-700' : 'text-blue-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  statusFilter === 'in_progress' ? 'text-blue-700' : 'text-gray-600'
                }`}>In Progress</p>
                <p className={`text-2xl font-bold ${
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
            <div className="flex items-center p-6">
              <div className={`p-2 rounded-lg ${
                statusFilter === 'completed' ? 'bg-green-200' : 'bg-green-100'
              }`}>
                <CheckIcon className={`h-6 w-6 ${
                  statusFilter === 'completed' ? 'text-green-700' : 'text-green-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  statusFilter === 'completed' ? 'text-green-700' : 'text-gray-600'
                }`}>Completed</p>
                <p className={`text-2xl font-bold ${
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedCard === 'pending' ? 'Pending Requests' : 'Unscheduled Requests'} ({filteredRequests.length} requests)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charges
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <AlertCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">No requests found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.clientName}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.serviceTypeName}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.branchName}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="max-w-xs truncate">{request.pickupLocation}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="max-w-xs truncate">{request.deliveryLocation}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDate(request.pickupDate)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          KES {request.price?.toLocaleString() || '0'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(request.createdAt)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRequestClick(request)}
                          className="text-green-600 hover:text-green-900 transition-colors px-3 py-1 rounded-md hover:bg-green-50"
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