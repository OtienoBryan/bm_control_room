import api from './api';

export interface AuditLog {
  id: number;
  staff_id: number | null;
  staff_name: string | null;
  staff_username: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  staffId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export const auditService = {
  /**
   * Get audit logs with optional filters
   */
  getAuditLogs: async (filters?: AuditLogFilters): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.staffId) params.append('staffId', filters.staffId.toString());
    if (filters?.action) params.append('action', filters.action);
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get<AuditLogResponse>(`/audit-logs?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single audit log by ID
   */
  getAuditLog: async (id: number): Promise<AuditLog> => {
    const response = await api.get<AuditLog>(`/audit-logs/${id}`);
    return response.data;
  }
};


