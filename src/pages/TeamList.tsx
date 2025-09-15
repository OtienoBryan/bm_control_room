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
        <div className="text-gray-600">Loading teams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Teams List
              </h3>
              <div className="flex items-center space-x-4">
                <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                  Filter by Date:
                </label>
                <input
                  type="date"
                  id="date-filter"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
                <p className="mt-1 text-sm text-gray-500">No teams found for the selected date</p>
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
                  <div key={team.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
                      <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {team.members.length} members
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(team.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Employee #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {team.members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    {member.photo_url ? (
                                      <img className="h-8 w-8 rounded-full object-cover" src={member.photo_url} alt={member.name} />
                                    ) : (
                                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  member.role === 'Team Leader' ? 'bg-purple-100 text-purple-800' :
                                  member.role === 'Driver' ? 'bg-blue-100 text-blue-800' :
                                  member.role === 'Police' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {member.role}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {member.empl_no}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {member.id_no}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      {teamLeaders.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-purple-900">Team Leaders</div>
                          <div className="text-sm text-purple-700">
                            {teamLeaders.map(leader => leader.name).join(', ')}
                          </div>
                        </div>
                      )}
                      {drivers.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-blue-900">Drivers</div>
                          <div className="text-sm text-blue-700">
                            {drivers.map(driver => driver.name).join(', ')}
                          </div>
                        </div>
                      )}
                      {police.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-green-900">Police</div>
                          <div className="text-sm text-green-700">
                            {police.map(police => police.name).join(', ')}
                          </div>
                        </div>
                      )}
                      {otherRoles.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-900">Other Roles</div>
                          <div className="text-sm text-gray-700">
                            {otherRoles.map(member => `${member.name} (${member.role})`).join(', ')}
                          </div>
                        </div>
                      )}
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-orange-900">Vehicles</div>
                        <div className="text-sm text-orange-700">
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