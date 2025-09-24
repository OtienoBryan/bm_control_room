import React, { useState, useEffect } from 'react';
import { Vehicle, vehicleService, CreateVehicleData } from '../services/vehicleService';
import { VehicleModel, vehicleModelService } from '../services/vehicleModelService';

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [newVehicle, setNewVehicle] = useState<CreateVehicleData>({
    registration_number: '',
    model_id: 0,
    consumption: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && vehicle.status === 1) ||
      (statusFilter === 'inactive' && vehicle.status === 0);
    
    return matchesSearch && matchesStatus;
  });

  const activeVehiclesCount = vehicles.filter(v => v.status === 1).length;
  const inactiveVehiclesCount = vehicles.filter(v => v.status === 0).length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [vehiclesData, modelsData] = await Promise.all([
          vehicleService.getVehicles(),
          vehicleModelService.getActiveVehicleModels()
        ]);
        setVehicles(vehiclesData);
        setVehicleModels(modelsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'model_id') {
      const modelId = parseInt(value) || 0;
      const selectedModel = vehicleModels.find(model => model.id === modelId);
      
      setNewVehicle(prev => ({
        ...prev,
        model_id: modelId,
        consumption: selectedModel ? selectedModel.consumption : 0
      }));
    } else {
      setNewVehicle(prev => ({
        ...prev,
        [name]: name === 'consumption' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && editingVehicle) {
        const updatedVehicle = await vehicleService.updateVehicle(editingVehicle.id, newVehicle);
        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? updatedVehicle : v));
      } else {
        const createdVehicle = await vehicleService.createVehicle(newVehicle);
        setVehicles(prev => [...prev, createdVehicle]);
      }

      // Reset form and close modal
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingVehicle(null);
      setNewVehicle({
        registration_number: '',
        model_id: 0,
        consumption: 0
      });
      setError(null);
    } catch (err) {
      setError(isEditMode ? 'Failed to update vehicle' : 'Failed to create vehicle');
      console.error('Error:', err);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setNewVehicle({
      registration_number: vehicle.registration_number,
      model_id: vehicle.model_id,
      consumption: vehicle.consumption
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (vehicleId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const updatedVehicle = await vehicleService.updateVehicleStatus(vehicleId, newStatus);
      setVehicles(prev => prev.map(v => v.id === vehicleId ? updatedVehicle : v));
      setError(null);
    } catch (err) {
      console.error('Error updating vehicle status:', err);
      setError('Failed to update vehicle status. Please try again.');
    }
  };

  const handleDelete = async (vehicleId: number) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehicleService.deleteVehicle(vehicleId);
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
        setError(null);
      } catch (err) {
        console.error('Error deleting vehicle:', err);
        setError('Failed to delete vehicle. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading vehicles...</div>
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
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your fleet vehicles and their specifications</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Vehicle
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Vehicles</dt>
                    <dd className="text-lg font-medium text-gray-900">{vehicles.length}</dd>
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
                    <dd className="text-lg font-medium text-gray-900">{activeVehiclesCount}</dd>
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
                    <dd className="text-lg font-medium text-gray-900">{inactiveVehiclesCount}</dd>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Consumption</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {vehicles.length > 0 
                        ? (vehicles.reduce((sum, v) => sum + v.consumption, 0) / vehicles.length).toFixed(1)
                        : '0'
                      } Km/L
                    </dd>
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
                  <label htmlFor="search" className="sr-only">Search vehicles</label>
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
                      placeholder="Search by registration or model..."
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="min-w-0 max-w-xs">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {filteredVehicles.length} of {vehicles.length} vehicles
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consumption (Km/L)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No vehicles found
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehicle.registration_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.model_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.consumption} Km/L</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vehicle.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vehicle.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(vehicle.id, vehicle.status)}
                            className={`transition-colors ${
                              vehicle.status === 1 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {vehicle.status === 1 ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isEditMode ? 'Update vehicle information' : 'Fill in the details to add a new vehicle'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setEditingVehicle(null);
                    setNewVehicle({
                      registration_number: '',
                      model: '',
                      consumption: 0
                    });
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
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    id="registration_number"
                    required
                    value={newVehicle.registration_number}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., KCA 123A"
                  />
                </div>
                
                <div>
                  <label htmlFor="model_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Model
                  </label>
                  <select
                    name="model_id"
                    id="model_id"
                    required
                    value={newVehicle.model_id}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value={0}>Select a model...</option>
                    {vehicleModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.consumption} Km/L
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="consumption" className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Consumption (Km/L)
                  </label>
                  <input
                    type="number"
                    name="consumption"
                    id="consumption"
                    required
                    min="0"
                    step="0.1"
                    value={newVehicle.consumption}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., 12.5"
                  />
                  {newVehicle.model_id > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Default consumption from selected model. You can modify this value if needed.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setEditingVehicle(null);
                    setNewVehicle({
                      registration_number: '',
                      model_id: 0,
                      consumption: 0
                    });
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {isEditMode ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
