import api from './index'

export interface ProgressSummaryParams {
  format?: 'html' | 'json' | 'pdf'
  team?: string
  start_date?: string
  end_date?: string
}

export interface DelayedProjectsParams {
  format?: 'html' | 'json' | 'pdf'
  threshold_days?: number
}

export interface TeamPerformanceParams {
  format?: 'html' | 'json' | 'pdf'
  team?: string
  period?: 'monthly' | 'quarterly' | 'yearly'
}

export interface ReportExportParams {
  report_type: 'progress_summary' | 'delayed_projects' | 'team_performance'
  format: 'excel' | 'pdf' | 'csv'
  filters: Record<string, any>
}

export interface ProgressSummaryResponse {
  report_type: string
  format: string
  content?: string
  file_url?: string
  metadata: {
    total_applications: number
    completed: number
    in_progress: number
    not_started: number
    average_progress: number
  }
}

export interface DelayedProjectsResponse {
  report_type: string
  format: string
  content?: string
  file_url?: string
  data: Array<{
    application_id: string
    application_name: string
    delay_days: number
    delayed_subtasks: any[]
  }>
}

export interface TeamPerformanceResponse {
  report_type: string
  format: string
  content?: string
  file_url?: string
  metadata: Record<string, any>
}

export interface ExportResponse {
  file_url: string
  expires_at: string
}

export interface ExcelImportParams {
  file: File
  update_existing?: boolean
  validate_only?: boolean
}

export interface ExcelImportResponse {
  status: string
  imported: number
  updated: number
  skipped: number
  errors: Array<{
    row: number
    error: string
    data: Record<string, any>
  }>
}

export interface ExcelExportParams {
  filters?: Record<string, any>
  columns?: string[]
}

export interface ExcelExportResponse {
  file_url: string
  rows_exported: number
  expires_at: string
}

export class ReportsAPI {
  // Generate progress summary report
  static async getProgressSummary(params: ProgressSummaryParams = {}): Promise<ProgressSummaryResponse> {
    const queryParams = new URLSearchParams()

    if (params.format) queryParams.append('format', params.format)
    if (params.team) queryParams.append('team', params.team)
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)

    const response = await api.get(`/reports/progress-summary?${queryParams.toString()}`)
    return response.data
  }

  // Generate delayed projects report
  static async getDelayedProjects(params: DelayedProjectsParams = {}): Promise<DelayedProjectsResponse> {
    const queryParams = new URLSearchParams()

    if (params.format) queryParams.append('format', params.format)
    if (params.threshold_days) queryParams.append('threshold_days', params.threshold_days.toString())

    const response = await api.get(`/reports/delayed-projects?${queryParams.toString()}`)
    return response.data
  }

  // Generate team performance report
  static async getTeamPerformance(params: TeamPerformanceParams = {}): Promise<TeamPerformanceResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.format) queryParams.append('format', params.format)
    if (params.team) queryParams.append('team', params.team)
    if (params.period) queryParams.append('period', params.period)

    const response = await api.get(`/reports/team-performance?${queryParams.toString()}`)
    return response.data
  }

  // Export report
  static async exportReport(params: ReportExportParams): Promise<ExportResponse> {
    const response = await api.post('/reports/export', params)
    return response.data
  }

  // Download file from URL
  static async downloadFile(fileUrl: string, filename?: string): Promise<void> {
    try {
      // Build full URL for file download
      // If fileUrl starts with '/api/v1' or is relative, use API base
      // If it's absolute URL or starts with '/downloads', use base server URL
      let fullUrl: string
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        fullUrl = fileUrl
      } else if (fileUrl.startsWith('/downloads/')) {
        // Direct file download from server
        fullUrl = `http://localhost:8000${fileUrl}`
      } else if (fileUrl.startsWith('/api/v1/downloads/')) {
        // API route for file download
        fullUrl = `http://localhost:8000${fileUrl}`
      } else {
        // Relative path, use API
        fullUrl = fileUrl
      }

      // Use fetch directly for file downloads to avoid API interceptors
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token_1_admin_full_access_test_2024'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()

      // Determine MIME type based on file extension
      let mimeType = 'application/octet-stream'
      if (filename) {
        const ext = filename.toLowerCase().split('.').pop()
        switch (ext) {
          case 'xlsx':
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          case 'xls':
            mimeType = 'application/vnd.ms-excel'
            break
          case 'pdf':
            mimeType = 'application/pdf'
            break
          case 'csv':
            mimeType = 'text/csv'
            break
        }
      }

      const finalBlob = new Blob([blob], { type: mimeType })
      const url = window.URL.createObjectURL(finalBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
      throw error
    }
  }
}

export class ExcelAPI {
  // Import applications from Excel
  static async importApplications(params: ExcelImportParams): Promise<ExcelImportResponse> {
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.update_existing !== undefined) {
      formData.append('update_existing', params.update_existing.toString())
    }
    if (params.validate_only !== undefined) {
      formData.append('validate_only', params.validate_only.toString())
    }

    const response = await api.post('/excel/import/applications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  // Export applications to Excel
  static async exportApplications(params: ExcelExportParams = {}): Promise<ExcelExportResponse> {
    const response = await api.post('/excel/export/applications', params, {
      responseType: 'blob'
    })
    return response.data
  }

  // Export and download applications Excel file directly
  static async exportAndDownloadApplications(params: ExcelExportParams = {}, filename?: string): Promise<void> {
    try {
      const response = await api.post('/excel/export/applications', params, {
        responseType: 'blob'
      })

      // Generate filename with current timestamp if not provided
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const finalFilename = filename || `applications_export_${timestamp}.xlsx`

      // Create blob with proper MIME type
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = finalFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export and download Excel:', error)
      throw error
    }
  }

  // Download Excel template
  static async downloadTemplate(type: 'applications' | 'subtasks'): Promise<void> {
    try {
      const response = await api.get(`/excel/template/${type}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}_template.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download template:', error)
      throw error
    }
  }
}