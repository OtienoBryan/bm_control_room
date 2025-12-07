import React, { useState, useEffect } from 'react';
import RunsTable from '../components/Requests/RunsTable';
import TeamDetailsModal from '../components/Requests/TeamDetailsModal';
import { RequestData, requestService } from '../services/requestService';
import { Team, teamService } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';

const RunsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  const fetchRequests = async () => {
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    if (!user?.id) return;
    
    try {
      // Fetch requests with myStatus = 1 (pending)
      const data = await requestService.getRequests({ myStatus: 3 });
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
        const teams = await teamService.getTeams();
        const team = teams.find(t => t.id === request.team_id);
        setSelectedTeam(team || null);
      } catch (error) {
        console.error('Error fetching team details:', error);
        setSelectedTeam(null);
      }
    } else {
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
        <div className="bg-white shadow rounded-lg">
          <div className="px-3 py-3 border-b border-gray-200 sm:px-4">
            <h3 className="text-sm leading-5 font-medium text-gray-900">
              Runs Reports
            </h3>
          </div>
          <div className="p-1.5">
            <RunsTable 
              requests={requests} 
              onRequestClick={(requestId) => {
                const request = requests.find(r => r.id === requestId);
                if (request) {
                  handleRequestClick(request);
                }
              }}
            />
          </div>
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

export default RunsPage; 