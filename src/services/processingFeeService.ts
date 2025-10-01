import { api } from './api';

export interface ProcessingFee {
  id: number;
  client_id: number;
  fee_type: string;
  description?: string;
  amount: number;
  is_percentage: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class ProcessingFeeService {
  private baseUrl = '/clients';

  async getProcessingFees(clientId: number): Promise<ProcessingFee[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${clientId}/processing-fees`);
      return response.data;
    } catch (error) {
      console.error('Error fetching processing fees:', error);
      throw error;
    }
  }

  async createProcessingFee(clientId: number, feeData: {
    fee_type: string;
    description?: string;
    amount: number;
    is_percentage?: boolean;
    is_active?: boolean;
  }): Promise<ProcessingFee> {
    try {
      const response = await api.post(`${this.baseUrl}/${clientId}/processing-fees`, feeData);
      return response.data;
    } catch (error) {
      console.error('Error creating processing fee:', error);
      throw error;
    }
  }

  async updateProcessingFee(clientId: number, feeId: number, feeData: {
    fee_type: string;
    description?: string;
    amount: number;
    is_percentage?: boolean;
    is_active?: boolean;
  }): Promise<ProcessingFee> {
    try {
      const response = await api.put(`${this.baseUrl}/${clientId}/processing-fees/${feeId}`, feeData);
      return response.data;
    } catch (error) {
      console.error('Error updating processing fee:', error);
      throw error;
    }
  }

  async deleteProcessingFee(clientId: number, feeId: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${clientId}/processing-fees/${feeId}`);
    } catch (error) {
      console.error('Error deleting processing fee:', error);
      throw error;
    }
  }
}

export default new ProcessingFeeService();

