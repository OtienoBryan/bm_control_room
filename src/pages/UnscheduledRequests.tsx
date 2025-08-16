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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  const fetchRequests = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      // Fetch requests with myStatus = 0 (unscheduled)
      const data = await requestService.getRequests({ myStatus: 0 });
      // Filter requests to only show those belonging to the current user
      const userRequests = data.filter(request => request.userId === user.id);
      setRequests(userRequests);
      
              // Calculate statistics based on status
        const pending = userRequests.filter(r => r.status === 0).length;
        const inProgress = userRequests.filter(r => r.status === 1).length;
        const completed = userRequests.filter(r => r.status === 2).length;
      
      setStats({
        total: userRequests.length,
        pending,
        inProgress,
        completed
      });
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.id]);

  const handleSuccess = () => {
    fetchRequests();
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

  // Filter functions
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.deliveryLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || request.priority === filterPriority;
    const matchesBranch = filterBranch === 'all' || request.branchName === filterBranch;
    const matchesStatus = statusFilter === 'all' || getStatusLabel(request.status) === statusFilter;
    
    return matchesSearch && matchesPriority && matchesBranch && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircleIcon size={16} className="text-red-600" />;
      case 'medium':
        return <ClockIcon size={16} className="text-yellow-600" />;
      case 'low':
        return <AlertCircleIcon size={16} className="text-green-600" />;
      default:
        return <AlertCircleIcon size={16} className="text-gray-600" />;
    }
  };

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
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              statusFilter === 'all' 
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
            onClick={() => setStatusFilter('pending')}
            className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              statusFilter === 'pending' 
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
            onClick={() => setStatusFilter('in_progress')}
            className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              statusFilter === 'in_progress' 
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
            onClick={() => setStatusFilter('completed')}
            className={`bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              statusFilter === 'completed' 
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
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            
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
              Request Details ({filteredRequests.length} requests)
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
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                    <td colSpan={10} className="px-6 py-12 text-center">
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
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                            <div className="text-sm text-gray-500">ID: {request.id}</div>
                          </div>
                        </div>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                          {getPriorityIcon(request.priority)}
                          <span className="ml-1 capitalize">{request.priority}</span>
                        </span>
                      </td>
                      
                                             <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           request.status === 2
                             ? 'bg-green-100 text-green-800 border border-green-200'
                             : request.status === 1
                             ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                             : request.status === 3
                             ? 'bg-red-100 text-red-800 border border-red-200'
                             : 'bg-gray-100 text-gray-800 border border-gray-200'
                         }`}>
                           {request.status === 2 && <CheckIcon className="h-3 w-3 mr-1" />}
                           {request.status === 1 && <ClockIcon className="h-3 w-3 mr-1" />}
                           {request.status === 3 && <XIcon className="h-3 w-3 mr-1" />}
                           <span className="capitalize">
                             {getStatusLabel(request.status).replace('_', ' ')}
                           </span>
                         </span>
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