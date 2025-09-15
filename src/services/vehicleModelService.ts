import api from './api';

export interface VehicleModel {
  id: number;
  name: string;
  consumption: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleModelData {
  name: string;
  consumption: number;
}

export interface UpdateVehicleModelData {
  name?: string;
  consumption?: number;
  status?: number;
}

export const vehicleModelService = {
  getVehicleModels: async (): Promise<VehicleModel[]> => {
    try {
      const response = await api.get('/vehicle-models');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle models:', error);
      throw error;
    }
  },

  getActiveVehicleModels: async (): Promise<VehicleModel[]> => {
    try {
      const response = await api.get('/vehicle-models/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active vehicle models:', error);
      throw error;
    }
  },

  getVehicleModel: async (id: number): Promise<VehicleModel> => {
    try {
      const response = await api.get(`/vehicle-models/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle model:', error);
      throw error;
    }
  },

  createVehicleModel: async (modelData: CreateVehicleModelData): Promise<VehicleModel> => {
    try {
      const response = await api.post('/vehicle-models', modelData);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle model:', error);
      throw error;
    }
  },

  updateVehicleModel: async (id: number, modelData: UpdateVehicleModelData): Promise<VehicleModel> => {
    try {
      const response = await api.put(`/vehicle-models/${id}`, modelData);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle model:', error);
      throw error;
    }
  },

  deleteVehicleModel: async (id: number): Promise<void> => {
    try {
      await api.delete(`/vehicle-models/${id}`);
    } catch (error) {
      console.error('Error deleting vehicle model:', error);
      throw error;
    }
  },

  updateVehicleModelStatus: async (id: number, status: number): Promise<VehicleModel> => {
    try {
      const response = await api.put(`/vehicle-models/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle model status:', error);
      throw error;
    }
  }
};
