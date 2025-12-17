import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XIcon, 
  UsersIcon, 
  UserIcon, 
  ShieldIcon, 
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  MapPinIcon,
  CalendarIcon,
  PackageIcon
} from 'lucide-react';
import { Team, teamService } from '../../services/teamService';
import { RequestData, requestService } from '../../services/requestService';

interface AssignTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: RequestData;
}

const AssignTeamModal: React.FC<AssignTeamModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  request 
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const teamsData = await teamService.getTeams(true);
        setTeams(teamsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setError('Please select a team');
      return;
    }

    try {
      setIsSubmitting(true);
      // Find the selected team and its team leader
      const selectedTeam = teams.find(t => t.id === selectedTeamId);
      let staff_id = null;
      if (selectedTeam) {
        const teamLeader = selectedTeam.members.find(m => m.role === 'Team Leader');
        if (teamLeader) {
          staff_id = teamLeader.id;
        }
      }
      await requestService.updateRequest(request.id, {
        team_id: selectedTeamId,
        status: 2, // 2 represents in_progress
        myStatus: 1, // Update to pending status
        staff_id // Set the crew commander (team leader)
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning team:', err);
      setError('Failed to assign team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'team leader':
        return <ShieldIcon className="h-3 w-3 text-blue-600" />;
      case 'driver':
        return <UserIcon className="h-3 w-3 text-green-600" />;
      case 'assistant':
        return <UsersIcon className="h-3 w-3 text-purple-600" />;
      default:
        return <UserIcon className="h-3 w-3 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'team leader':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'driver':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'assistant':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
                        <UsersIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-base font-semibold text-white">
                          Assign Team to Request
                        </Dialog.Title>
                        <p className="text-blue-100 text-xs">
                          Select a team to handle this service request
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoaderIcon className="h-6 w-6 text-blue-600 animate-spin" />
                      <span className="ml-2 text-xs text-gray-600">Loading teams...</span>
                    </div>
                  ) : (
                    <>
                      {/* Request Details */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                          <PackageIcon className="h-3 w-3 mr-1.5 text-blue-600" />
                          Request Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-gray-600">Service:</span>
                            <p className="font-medium text-gray-900">{request.serviceTypeName}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Pickup:</span>
                            <p className="font-medium text-gray-900">{request.pickupLocation}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Delivery:</span>
                            <p className="font-medium text-gray-900">{request.deliveryLocation}</p>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-xs text-red-800 font-medium">{error}</span>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Team Selection */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                            <UsersIcon className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                            Select Team
                          </label>
                          <select
                            value={selectedTeamId || ''}
                            onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={isLoading}
                          >
                            <option value="">Choose a team</option>
                            {teams.map((team) => {
                              const teamLeader = team.members.find(m => m.role === 'Team Leader');
                              const teamLeaderName = teamLeader ? teamLeader.name : 'No Team Leader';
                              return (
                                <option key={team.id} value={team.id}>
                                  {team.name} - {teamLeaderName} ({team.members.length} members)
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Selected Team Details */}
                        {selectedTeam && (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-blue-50 px-3 py-2 border-b border-gray-200">
                              <h4 className="text-xs font-semibold text-blue-900 flex items-center">
                                <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                                {selectedTeam.name} - Team Details
                              </h4>
                              <p className="text-xs text-blue-700 mt-0.5">
                                {selectedTeam.members.length} team members available
                              </p>
                            </div>
                            
                            <div className="p-3">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Team Members */}
                                <div>
                                  <h5 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                    <UsersIcon className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                                    Team Members
                                  </h5>
                                  <div className="space-y-2">
                                    {selectedTeam.members.map((member) => (
                                      <div key={member.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0">
                                          {member.photo_url ? (
                                            <img 
                                              src={member.photo_url} 
                                              alt={member.name}
                                              className="h-8 w-8 rounded-full object-cover"
                                            />
                                          ) : (
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                              <UserIcon className="h-4 w-4 text-blue-600" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-xs font-medium text-gray-900 truncate">
                                                {member.name}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {member.empl_no} • {member.position}
                                              </p>
                                            </div>
                                            <div className="flex flex-col items-end space-y-0.5">
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                                                {getRoleIcon(member.role)}
                                                <span className="ml-0.5">{member.role}</span>
                                              </span>
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                                                {member.status === 1 ? 'Active' : 'Inactive'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Team Summary */}
                                <div>
                                  <h5 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                                    <ShieldIcon className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                                    Team Summary
                                  </h5>
                                  <div className="space-y-2">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-blue-700">Total Members:</span>
                                        <span className="text-xs font-semibold text-blue-900">{selectedTeam.members.length}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="p-2 bg-green-50 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-green-700">Active Members:</span>
                                        <span className="text-xs font-semibold text-green-900">
                                          {selectedTeam.members.filter(m => m.status === 1).length}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="p-2 bg-purple-50 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-purple-700">Team Leader:</span>
                                        <span className="text-xs font-semibold text-purple-900">
                                          {selectedTeam.members.find(m => m.role === 'Team Leader')?.name || 'Not assigned'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="p-2 bg-gray-50 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-700">Created:</span>
                                        <span className="text-xs font-semibold text-gray-900">
                                          {new Date(selectedTeam.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || !selectedTeamId}
                            className="flex-1 px-4 py-2 text-xs text-white bg-red-900 hover:bg-red-700 disabled:bg-gray-400 rounded-lg transition-colors font-medium flex items-center justify-center"
                          >
                            {isSubmitting ? (
                              <>
                                <LoaderIcon className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                Assigning Team...
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                                Assign Team
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AssignTeamModal; 