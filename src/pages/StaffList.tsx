import React, { useState, useEffect, useRef } from 'react';
import { Staff, staffService, CreateStaffData } from '../services/staffService';
import { Role, roleService } from '../services/roleService';
import { Vehicle, vehicleService } from '../services/vehicleService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { teamService } from '../services/teamService';

interface Team {
  id: number;
  name: string;
  members: Staff[];
  vehicles: Vehicle[];
  created_at: string;
}

const REQUIRED_ROLES = ['Team Leader', 'Driver'];
const OPTIONAL_ROLES = ['Cash Officer', 'Police'];

const StaffList: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<CreateStaffData>({
    name: '',
    photo_url: '',
    empl_no: '',
    id_no: 0,
    role: ''
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isShufflerModalOpen, setIsShufflerModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff[]>([]);
  const [teamSize, setTeamSize] = useState(4);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [shuffledTeams, setShuffledTeams] = useState<Staff[][]>([]);
  const [shuffledTeamVehicles, setShuffledTeamVehicles] = useState<Vehicle[][]>([]);
  const [hasTeamsToday, setHasTeamsToday] = useState(false);
  const [isCheckingTeams, setIsCheckingTeams] = useState(false);

  // Get current date in format: DD MMMM YYYY
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Filter staff based on search and role
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.empl_no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const activeStaffCount = staff.filter(s => s.status === 1).length;
  const inactiveStaffCount = staff.filter(s => s.status === 0).length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching staff and roles data...');
        
        const [staffData, rolesData, vehiclesData] = await Promise.all([
          staffService.getStaffList(),
          roleService.getRoles(),
          vehicleService.getVehicles()
        ]);
        
        console.log('Staff data:', staffData);
        console.log('Roles data:', rolesData);
        console.log('Vehicles data:', vehiclesData);
        
        setStaff(staffData);
        setRoles(rolesData);
        setVehicles(vehiclesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        let errorMessage = 'Failed to load data. Please try again later.';
        
        if (err instanceof Error) {
          errorMessage = `Error: ${err.message}`;
        } else if (err.response) {
          errorMessage = `Server Error: ${err.response.data.message || 'Unknown error'}`;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check for existing teams when component loads
  useEffect(() => {
    checkTeamsForToday();
  }, []);

  const checkTeamsForToday = async () => {
    try {
      setIsCheckingTeams(true);
      const result = await teamService.checkTeamsForToday();
      setHasTeamsToday(result.hasTeamsToday);
      return result.hasTeamsToday;
    } catch (err) {
      console.error('Error checking teams for today:', err);
      setError('Failed to check existing teams');
      return false;
    } finally {
      setIsCheckingTeams(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: name === 'id_no' ? parseInt(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      let photoUrl = newStaff.photo_url;

      if (selectedFile) {
        photoUrl = await staffService.uploadPhoto(selectedFile);
      }

      if (isEditMode && editingStaff) {
        const updatedStaff = await staffService.updateStaff(editingStaff.id, {
          ...newStaff,
          photo_url: photoUrl
        });
        setStaff(prev => prev.map(s => s.id === editingStaff.id ? updatedStaff : s));
      } else {
        const createdStaff = await staffService.createStaff({
          ...newStaff,
          photo_url: photoUrl
        });
        setStaff(prev => [...prev, createdStaff]);
      }

      // Reset form and close modal
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingStaff(null);
      setNewStaff({
        name: '',
        photo_url: '',
        empl_no: '',
        id_no: 0,
        role: ''
      });
      setSelectedFile(null);
    } catch (err) {
      setError(isEditMode ? 'Failed to update staff member' : 'Failed to create staff member');
      console.error('Error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`cit-staff-list-${currentDate.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setNewStaff({
      name: staff.name,
      photo_url: staff.photo_url,
      empl_no: staff.empl_no,
      id_no: staff.id_no,
      role: staff.role
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (staffId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      console.log('Toggling staff status:', { staffId, currentStatus, newStatus });
      
      const updatedStaff = await staffService.updateStaffStatus(staffId, newStatus);
      console.log('Staff status updated:', updatedStaff);
      
      setStaff(prev => prev.map(s => s.id === staffId ? updatedStaff : s));
      setError(null); // Clear any existing errors
    } catch (err) {
      console.error('Error updating staff status:', err);
      setError('Failed to update staff status. Please try again.');
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleShuffleTeams = async () => {
    try {
      // Check if teams already exist for today
      const teamsExistToday = await checkTeamsForToday();
      
      if (teamsExistToday) {
        setError('Teams have already been created for today. You can only create teams once per day.');
        return;
      }

      // Get active staff only
      const activeStaff = staff.filter(s => s.status === 1);
      
      // Get active vehicles only
      const activeVehicles = vehicles.filter(v => v.status === 1);
      
      if (activeVehicles.length < 2) {
        setError('Not enough active vehicles. At least 2 vehicles are required to create teams.');
        return;
      }
      
      // Group staff by role
      const staffByRole = activeStaff.reduce((acc, member) => {
        if (!acc[member.role]) {
          acc[member.role] = [];
        }
        acc[member.role].push(member);
        return acc;
      }, {} as Record<string, Staff[]>);

      // Shuffle each role group
      Object.keys(staffByRole).forEach(role => {
        staffByRole[role] = shuffleArray(staffByRole[role]);
      });

      // Shuffle vehicles
      const shuffledVehicles = shuffleArray([...activeVehicles]);

      // Create teams with required composition: 1 Team Leader, 2 Drivers, 2 Police
      const teams: Staff[][] = [];
      const teamVehicles: Vehicle[][] = [];
      const teamLeaders = staffByRole['Team Leader'] || [];
      const drivers = staffByRole['Driver'] || [];
      const police = staffByRole['Police'] || [];

      // Calculate maximum number of teams we can create
      const maxTeams = Math.min(
        teamLeaders.length,
        Math.floor(drivers.length / 2),
        Math.floor(police.length / 2),
        Math.floor(shuffledVehicles.length / 2) // Each team needs 2 vehicles
      );

      for (let i = 0; i < maxTeams; i++) {
        const team: Staff[] = [];
        const vehicles: Vehicle[] = [];
        
        // Add 1 Team Leader
        if (teamLeaders[i]) {
          team.push(teamLeaders[i]);
        }
        
        // Add 2 Drivers
        if (drivers[i * 2]) team.push(drivers[i * 2]);
        if (drivers[i * 2 + 1]) team.push(drivers[i * 2 + 1]);
        
        // Add 2 Police
        if (police[i * 2]) team.push(police[i * 2]);
        if (police[i * 2 + 1]) team.push(police[i * 2 + 1]);
        
        // Add 2 Vehicles
        if (shuffledVehicles[i * 2]) vehicles.push(shuffledVehicles[i * 2]);
        if (shuffledVehicles[i * 2 + 1]) vehicles.push(shuffledVehicles[i * 2 + 1]);
        
        if (team.length > 0) {
          teams.push(team);
          teamVehicles.push(vehicles);
        }
      }

      if (teams.length === 0) {
        setError('Not enough active staff with the required roles to create teams.');
        return;
      }

      // Save teams to database with vehicles
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const teamName = `Team ${i + 1} - ${new Date().toLocaleDateString()}`;
        
        // Assign 2 vehicles to each team
        const teamVehicleIds = teamVehicles[i].map(vehicle => vehicle.id);
        
        await teamService.createTeam({
          name: teamName,
          members: team.map(member => member.id),
          vehicles: teamVehicleIds
        });
      }

      setShuffledTeams(teams);
      setShuffledTeamVehicles(teamVehicles);
      setIsShufflerModalOpen(true);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error shuffling teams:', err);
      setError('Failed to create teams. Please try again.');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingTeam(true);
      
      // Get active staff members grouped by role
      const staffByRole = staff.reduce((acc, member) => {
        if (member.status === 1) {
          if (!acc[member.role]) {
            acc[member.role] = [];
          }
          acc[member.role].push(member);
        }
        return acc;
      }, {} as Record<string, Staff[]>);

      // Create teams ensuring each has the required roles, and add optional roles if available
      const teams: Staff[][] = [];
      let teamIndex = 0;
      let canCreateMoreTeams = true;

      while (canCreateMoreTeams) {
        const team: Staff[] = [];
        // Add required roles
        for (const role of REQUIRED_ROLES) {
          if (staffByRole[role] && staffByRole[role].length > teamIndex) {
            team.push(staffByRole[role][teamIndex]);
          } else {
            canCreateMoreTeams = false;
            break;
          }
        }
        // Add optional roles if available
        for (const role of OPTIONAL_ROLES) {
          if (staffByRole[role] && staffByRole[role].length > teamIndex) {
            team.push(staffByRole[role][teamIndex]);
          }
        }
        if (canCreateMoreTeams) {
          teams.push(team);
          teamIndex++;
        }
      }

      if (teams.length === 0) {
        setError('Not enough staff to create any teams');
        return;
      }

      // Create each team
      for (const teamMembers of teams) {
        await teamService.createTeam({
          name: `${teamName} ${teams.indexOf(teamMembers) + 1}`,
          members: teamMembers.map(member => member.id)
        });
      }

      setIsTeamModalOpen(false);
      setTeamName('');
      setTeamSize(4);
      setError(null);
    } catch (err) {
      console.error('Error creating teams:', err);
      setError('Failed to create teams');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading staff list...</div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your team members and their roles</p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Staff
                </button>
                <button
                  onClick={() => setIsTeamModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Create Teams
                </button>
                <button
                  onClick={handleShuffleTeams}
                  disabled={isCheckingTeams || hasTeamsToday}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-colors ${
                    isCheckingTeams || hasTeamsToday
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                  }`}
                >
                  {isCheckingTeams ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking...
                    </>
                  ) : hasTeamsToday ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Teams Created Today
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Shuffle Teams
                    </>
                  )}
                </button>
                <a
                  href="/dashboard/photo-list"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photo List
                </a>
                <button
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors ${
                    isExporting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Staff</dt>
                    <dd className="text-lg font-medium text-gray-900">{staff.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">{activeStaffCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inactive</dt>
                    <dd className="text-lg font-medium text-gray-900">{inactiveStaffCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Roles</dt>
                    <dd className="text-lg font-medium text-gray-900">{roles.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex-1 min-w-0 max-w-xs">
                  <label htmlFor="search" className="sr-only">Search staff</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search by name or employee number..."
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="min-w-0 max-w-xs">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {filteredStaff.length} of {staff.length} staff members
                </span>
              </div>
            </div>
          </div>
          
          <div ref={contentRef} className="overflow-x-auto">
            {viewMode === 'table' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {member.photo_url ? (
                              <img className="h-10 w-10 rounded-full object-cover" src={member.photo_url} alt={member.name} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.empl_no}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.id_no}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(member.id, member.status)}
                            className={`transition-colors ${
                              member.status === 1 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {member.status === 1 ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredStaff.map((member) => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-center justify-center mb-4">
                          {member.photo_url ? (
                            <img className="h-20 w-20 rounded-full object-cover" src={member.photo_url} alt={member.name} />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                              <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">{member.name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
                            {member.role}
                          </span>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium">Employee #:</span> {member.empl_no}</p>
                            <p><span className="font-medium">ID #:</span> {member.id_no}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.status === 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.status === 1 ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex justify-center space-x-2 mt-4">
                            <button
                              onClick={() => handleEdit(member)}
                              className="text-blue-600 hover:text-blue-900 transition-colors p-2 rounded-full hover:bg-blue-50"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(member.id, member.status)}
                              className={`transition-colors p-2 rounded-full hover:bg-gray-50 ${
                                member.status === 1 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {member.status === 1 ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isEditMode ? 'Update staff member information' : 'Fill in the details to add a new staff member'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setEditingStaff(null);
                    setNewStaff({
                      name: '',
                      photo_url: '',
                      empl_no: '',
                      id_no: 0,
                      role: ''
                    });
                    setSelectedFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={newStaff.name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="photo" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input
                            id="photo"
                            name="photo"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Selected: {selectedFile.name}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="empl_no" className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Number
                    </label>
                    <input
                      type="text"
                      name="empl_no"
                      id="empl_no"
                      required
                      value={newStaff.empl_no}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="EMP001"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="id_no" className="block text-sm font-medium text-gray-700 mb-2">
                      ID Number
                    </label>
                    <input
                      type="number"
                      name="id_no"
                      id="id_no"
                      required
                      value={newStaff.id_no}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    id="role"
                    required
                    value={newStaff.role}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setEditingStaff(null);
                    setNewStaff({
                      name: '',
                      photo_url: '',
                      empl_no: '',
                      id_no: 0,
                      role: ''
                    });
                    setSelectedFile(null);
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    isEditMode ? 'Update Staff' : 'Add Staff'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Create Teams</h3>
                  <p className="mt-1 text-sm text-gray-500">Automatically generate teams with required roles</p>
                </div>
                <button
                  onClick={() => {
                    setIsTeamModalOpen(false);
                    setTeamName('');
                    setTeamSize(4);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateTeam} className="px-6 py-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name Prefix
                  </label>
                  <input
                    type="text"
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="e.g., Team"
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Required Roles per Team:</h4>
                  <div className="space-y-2">
                    {REQUIRED_ROLES.map(role => {
                      const availableCount = staff.filter(m => m.role === role && m.status === 1).length;
                      return (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{role}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            availableCount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {availableCount} available
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Team Creation Info</h4>
                  <p className="text-sm text-blue-700">
                    Teams will be created automatically with the required roles. Each team will have at least one Team Leader and one Driver.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTeamModalOpen(false);
                    setTeamName('');
                    setTeamSize(4);
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTeam}
                  className={`px-6 py-3 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors ${
                    isCreatingTeam ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCreatingTeam ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Teams...
                    </div>
                  ) : (
                    'Create Teams'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shuffler Modal */}
      {isShufflerModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 transform transition-all max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Shuffled Teams</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Automatically shuffled teams with 1 Team Leader, 2 Drivers, 2 Police, and 2 Vehicles
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsShufflerModalOpen(false);
                    setShuffledTeams([]);
                    setShuffledTeamVehicles([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {shuffledTeams.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No teams can be created</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Not enough active staff with the required roles (Team Leader, Driver, Police)
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {shuffledTeams.map((team, teamIndex) => (
                    <div key={teamIndex} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Team {teamIndex + 1}</h4>
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {team.length} members
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {shuffledTeamVehicles[teamIndex]?.length || 0} vehicles
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
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {team.map((member) => (
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Vehicles Section */}
                      {shuffledTeamVehicles[teamIndex] && shuffledTeamVehicles[teamIndex].length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Assigned Vehicles</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {shuffledTeamVehicles[teamIndex].map((vehicle, vehicleIndex) => (
                              <div key={vehicleIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {vehicle.registration_number}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {vehicle.model_name}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">
                                      {vehicle.consumption} Km/L
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      vehicle.status === 1 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {vehicle.status === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {shuffledTeams.length > 0 && (
                    <span>
                      {shuffledTeams.length} team{shuffledTeams.length !== 1 ? 's' : ''} created with shuffled staff
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleShuffleTeams}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Shuffle Again
                  </button>
                  <button
                    onClick={() => {
                      setIsShufflerModalOpen(false);
                      setShuffledTeams([]);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;