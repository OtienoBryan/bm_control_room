import React, { useState, useEffect } from 'react';
import RequestsTable from '../components/Requests/RequestsTable';
import TeamDetailsModal from '../components/Requests/TeamDetailsModal';
import { RequestData, requestService } from '../services/requestService';
import { Team, teamService } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import StatCards from '../components/Dashboard/StatCards';

const PendingRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user, isLoading: authLoading } = useAuth();

  const fetchRequests = async () => {
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    if (!user?.id) return;
    
    try {
      // Fetch requests with myStatus = 1 (pending)
      const data = await requestService.getRequests({ myStatus: 1 });
      // Filter requests to only show those belonging to the current user
      const userRequests = data.filter(request => request.userId === user.id);
      setRequests(userRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestClick = async (request: RequestData) => {
    setSelectedRequest(request);
    if (request.team_id) {
      try {
        console.log('Fetching team with ID:', request.team_id); // Debug log
        const teams = await teamService.getTeams(false); // Get all teams
        console.log('All teams:', teams); // Debug log
        const team = teams.find(t => t.id === request.team_id);
        console.log('Found team:', team); // Debug log
        if (team) {
          console.log('Team members:', team.members); // Debug log
          setSelectedTeam(team);
        } else {
          console.log('No team found with ID:', request.team_id); // Debug log
          setSelectedTeam(null);
        }
      } catch (error) {
        console.error('Error fetching team details:', error);
        setSelectedTeam(null);
      }
    } else {
      console.log('No team_id in request:', request); // Debug log
      setSelectedTeam(null);
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    // Wait for auth to finish loading before making API calls
    if (!authLoading && user?.id) {
      fetchRequests();
    }
  }, [user?.id, authLoading]); // Re-fetch when user ID changes

  // Pagination calculations
  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, endIndex);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Show loading if auth is still initializing or data is loading
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="mt-4">
      <StatCards />
        <div className="bg-white shadow rounded-lg">
          <div className="px-3 py-3 border-b border-gray-200 sm:px-4">
            <h3 className="text-sm leading-5 font-medium text-gray-900">
              My Pending Requests
            </h3>
          </div>
          <div className="p-1.5">
            <RequestsTable 
                requests={paginatedRequests} 
                onRequestClick={(requestId) => {
                  const request = requests.find(r => r.id === requestId);
                  if (request) {
                    handleRequestClick(request);
                  }
                }}
              />
          </div>
          
          {/* Pagination Controls */}
          {requests.length > 0 && (
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
                  Showing {startIndex + 1} to {Math.min(endIndex, requests.length)} of {requests.length} entries
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
      </div>

      {selectedRequest && (
        <TeamDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRequest(null);
            setSelectedTeam(null);
          }}
          request={selectedRequest}
          team={selectedTeam}
          onSuccess={() => {
            fetchRequests();
          }}
        />
      )}
    </div>
  );
};

export default PendingRequestsPage; 