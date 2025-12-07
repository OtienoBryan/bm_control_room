import React, { useState, useEffect } from 'react';
import { Team, teamService } from '../services/teamService';
import { Staff } from '../services/staffService';
import { Vehicle } from '../services/vehicleService';

const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0] // Set default to current date
  );

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const teamsData = await teamService.getTeams(false); // Fetch all teams first to debug
        console.log('Fetched teams data:', teamsData); // Debug log
        setTeams(teamsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Filter teams when selectedDate changes
  useEffect(() => {
    const filtered = teams.filter(team => {
      const teamDate = new Date(team.created_at).toISOString().split('T')[0];
      return teamDate === selectedDate;
    });
    setFilteredTeams(filtered);
  }, [selectedDate, teams]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xs text-gray-600">Loading teams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xs text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="mt-4">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 sm:px-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm leading-6 font-medium text-gray-900">
                Teams List
              </h3>
              <div className="flex items-center space-x-3">
                <label htmlFor="date-filter" className="text-xs font-medium text-gray-700">
                  Filter by Date:
                </label>
                <input
                  type="date"
                  id="date-filter"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-xs font-medium text-gray-900">No teams found</h3>
                <p className="mt-1 text-xs text-gray-500">No teams found for the selected date</p>
              </div>
            ) : (
              filteredTeams.map((team) => {
                console.log('Team data:', team); // Debug log
                console.log('Team vehicles:', team.vehicles); // Debug log
                const teamLeaders = team.members.filter(m => m.role === 'Team Leader');
                const drivers = team.members.filter(m => m.role === 'Driver');
                const police = team.members.filter(m => m.role === 'Police');
                const otherRoles = team.members.filter(m => 
                  m.role !== 'Team Leader' && m.role !== 'Driver' && m.role !== 'Police'
                );

                return (
                  <div key={team.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">{team.name}</h4>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                          {team.members.length} members
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(team.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Employee #
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              ID #
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {team.members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-6 w-6">
                                    {member.photo_url ? (
                                      <img className="h-6 w-6 rounded-full object-cover" src={member.photo_url} alt={member.name} />
                                    ) : (
                                      <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                        <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-2">
                                    <div className="text-xs font-medium text-gray-900">{member.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  member.role === 'Team Leader' ? 'bg-purple-100 text-purple-800' :
                                  member.role === 'Driver' ? 'bg-blue-100 text-blue-800' :
                                  member.role === 'Police' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {member.role}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                {member.empl_no}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                {member.id_no}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  member.status === 1 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {member.status === 1 ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Team Summary */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                      {teamLeaders.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-2.5">
                          <div className="text-xs font-medium text-purple-900 mb-1">Team Leaders</div>
                          <div className="text-xs text-purple-700">
                            {teamLeaders.map(leader => leader.name).join(', ')}
                          </div>
                        </div>
                      )}
                      {drivers.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-2.5">
                          <div className="text-xs font-medium text-blue-900 mb-1">Drivers</div>
                          <div className="text-xs text-blue-700">
                            {drivers.map(driver => driver.name).join(', ')}
                          </div>
                        </div>
                      )}
                      {police.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-2.5">
                          <div className="text-xs font-medium text-green-900 mb-1">Police</div>
                          <div className="text-xs text-green-700">
                            {police.map(police => police.name).join(', ')}
                          </div>
                        </div>
                      )}
                      {otherRoles.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <div className="text-xs font-medium text-gray-900 mb-1">Other Roles</div>
                          <div className="text-xs text-gray-700">
                            {otherRoles.map(member => `${member.name} (${member.role})`).join(', ')}
                          </div>
                        </div>
                      )}
                      <div className="bg-orange-50 rounded-lg p-2.5">
                        <div className="text-xs font-medium text-orange-900 mb-1">Vehicles</div>
                        <div className="text-xs text-orange-700">
                          {team.vehicles && team.vehicles.length > 0 ? (
                            team.vehicles.map(vehicle => `${vehicle.registration_number} (${vehicle.model_name})`).join(', ')
                          ) : (
                            'No vehicles assigned'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamList; 