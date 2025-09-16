import api from './index'

export interface AuditLogListParams {
  table_name?: string
  operation?: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id?: number
  user_name?: string  // Add user name search
  skip?: number
  limit?: number
  start_date?: string
  end_date?: string
}

export interface AuditLogListResponse {
  total: number
  items: AuditLog[]
}

export interface AuditLog {
  id: number
  table_name: string
  record_id: number
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  changed_fields: string[]
  old_values: Record<string, any>
  new_values: Record<string, any>
  user_id: number
  user_full_name: string
  created_at: string
  request_id: string
  user_ip: string
}

export interface AuditExportParams {
  format: 'csv' | 'excel' | 'json'
  table_name?: string
  record_id?: number
  user_id?: number
  operation?: 'INSERT' | 'UPDATE' | 'DELETE'
  start_date?: string
  end_date?: string
}

export interface AuditRollbackParams {
  confirm: boolean
  reason?: string
}

export interface AuditRollbackResponse {
  status: string
  rollback_audit_id: number
  affected_record: {
    table: string
    id: number
    operation: string
    restored_values: Record<string, any>
  }
  message: string
}


export class AuditAPI {
  // Get audit logs list
  static async getAuditLogs(params: AuditLogListParams = {}): Promise<AuditLogListResponse> {
    const queryParams = new URLSearchParams()

    if (params.table_name) queryParams.append('table_name', params.table_name)
    if (params.operation) queryParams.append('operation', params.operation)
    if (params.user_id !== undefined) queryParams.append('user_id', params.user_id.toString())
    if (params.user_name) queryParams.append('user_name', params.user_name)
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)

    const url = `/audit?${queryParams.toString()}`
    console.log('🔍 [AuditAPI] Request URL:', url)
    console.log('🔍 [AuditAPI] Request params object:', params)

    const response = await api.get(url)
    console.log('📊 [AuditAPI] Raw response:', response)
    console.log('📊 [AuditAPI] Response data:', response.data)

    return response.data
  }


  // Export audit logs
  static async exportAuditLogs(params: AuditExportParams): Promise<any> {
    // For CSV and Excel formats, return blob for file download
    if (params.format === 'csv' || params.format === 'excel') {
      const response = await api.post('/audit/export', params, {
        responseType: 'blob'
      })
      return response.data
    }

    // For JSON format, return structured data
    const response = await api.post('/audit/export', params)
    return response.data
  }

  // Rollback audit log operation
  static async rollbackAuditLog(auditLogId: number, params: AuditRollbackParams): Promise<AuditRollbackResponse> {
    const response = await api.post(`/audit/${auditLogId}/rollback`, params)
    return response.data
  }


  // Get audit logs for specific table and record
  static async getRecordHistory(tableName: string, recordId: number): Promise<AuditLog[]> {
    try {
      const response = await this.getAuditLogs({
        table_name: tableName,
        limit: 1000
      })
      
      // Filter by record_id on frontend since API doesn't support this filter
      return response.items.filter(log => log.record_id === recordId)
    } catch (error) {
      console.error('Failed to get record history:', error)
      return []
    }
  }

  // Get recent activities for dashboard
  static async getRecentActivities(limit: number = 10): Promise<AuditLog[]> {
    try {
      const response = await this.getAuditLogs({ limit })
      return response.items
    } catch (error) {
      console.error('Failed to get recent activities:', error)
      return []
    }
  }

  // Get user activities
  static async getUserActivities(userId: number, limit: number = 50): Promise<AuditLog[]> {
    try {
      const response = await this.getAuditLogs({ 
        user_id: userId,
        limit 
      })
      return response.items
    } catch (error) {
      console.error('Failed to get user activities:', error)
      return []
    }
  }
}