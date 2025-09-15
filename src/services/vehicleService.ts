import api from './api';

export interface Vehicle {
  id: number;
  registration_number: string;
  model_id: number;
  model_name: string;
  model_consumption: number;
  consumption: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleData {
  registration_number: string;
  model_id: number;
  consumption: number;
}

export interface UpdateVehicleData {
  registration_number?: string;
  model_id?: number;
  consumption?: number;
  status?: number;
}

export const vehicleService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    try {
      const response = await api.get('/vehicles');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  getVehicle: async (id: number): Promise<Vehicle> => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  },

  createVehicle: async (vehicleData: CreateVehicleData): Promise<Vehicle> => {
    try {
      const response = await api.post('/vehicles', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  updateVehicle: async (id: number, vehicleData: UpdateVehicleData): Promise<Vehicle> => {
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  deleteVehicle: async (id: number): Promise<void> => {
    try {
      await api.delete(`/vehicles/${id}`);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },

  updateVehicleStatus: async (id: number, status: number): Promise<Vehicle> => {
    try {
      const response = await api.put(`/vehicles/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  }
};
