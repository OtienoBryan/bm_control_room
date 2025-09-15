import api from './api';
import { Staff } from './staffService';

export interface Team {
  id: number;
  name: string;
  members: Staff[];
  vehicles: Vehicle[];
  created_at: string;
}

export interface Vehicle {
  id: number;
  registration_number: string;
  model_name: string;
  consumption: number;
  status: number;
}

export interface CreateTeamData {
  name: string;
  members: number[];
  vehicles?: number[];
}

export const teamService = {
  createTeam: async (teamData: CreateTeamData): Promise<Team> => {
    try {
      const response = await api.post('/teams', teamData);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  getTeams: async (todayOnly: boolean = false): Promise<Team[]> => {
    try {
      const response = await api.get('/teams', {
        params: { today: todayOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  checkTeamsForToday: async (): Promise<{ hasTeamsToday: boolean; teamCount: number }> => {
    try {
      const response = await api.get('/teams/check-today');
      return response.data;
    } catch (error) {
      console.error('Error checking teams for today:', error);
      throw error;
    }
  }
}; 