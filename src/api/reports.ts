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
  report_type: 'progress_summary' | 'delayed_projects' | 'department_comparison'
  export_format: 'pdf' | 'excel' | 'html' | 'csv'
  report_data: Record<string, any>
  template_style?: 'standard' | 'minimal' | 'detailed'
  include_charts?: boolean
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
  success: boolean
  export_format: string
  file_name: string
  file_size_bytes: number
  download_url: string
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
    console.log('🔍 [ReportsAPI] Export request:', {
      endpoint: '/reports/export',
      params
    })

    const response = await api.post('/reports/export', params)

    console.log('📊 [ReportsAPI] Export response:', response.data)
    return response.data
  }

  // Download file from URL
  static async downloadFile(downloadUrl: string, filename?: string): Promise<void> {
    try {
      console.log('🔍 [ReportsAPI] Downloading file:', {
        downloadUrl,
        filename
      })

      // Build full URL for file download
      let fullUrl: string
      if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
        fullUrl = downloadUrl
      } else if (downloadUrl.startsWith('/api/v1/reports/download/')) {
        // API route for report file download
        fullUrl = `http://localhost:8000${downloadUrl}`
      } else if (downloadUrl.startsWith('/downloads/')) {
        // Direct file download from server
        fullUrl = `http://localhost:8000${downloadUrl}`
      } else {
        // Relative path, use API base
        fullUrl = `http://localhost:8000/api/v1${downloadUrl}`
      }

      console.log('🔍 [ReportsAPI] Full download URL:', fullUrl)

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
          case 'html':
            mimeType = 'text/html'
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

      console.log('✅ [ReportsAPI] File downloaded successfully')
    } catch (error) {
      console.error('❌ [ReportsAPI] Failed to download file:', error)
      throw error
    }
  }
}

export class ExcelAPI {
  // Transform user's Excel format to API format
  static async transformExcelFile(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          if (!data) {
            reject(new Error('Failed to read file'))
            return
          }

          // For now, return the original file as the backend should handle the mapping
          // In a real implementation, we would use a library like xlsx to transform the data
          console.log('🔄 [ExcelAPI] File transformation (placeholder):', {
            originalName: file.name,
            size: file.size
          })

          resolve(file)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  // Import applications from Excel
  static async importApplications(params: ExcelImportParams): Promise<ExcelImportResponse> {
    // Transform the file to match API expectations
    const transformedFile = await this.transformExcelFile(params.file)

    const formData = new FormData()
    formData.append('file', transformedFile)
    if (params.update_existing !== undefined) {
      formData.append('update_existing', params.update_existing.toString())
    }
    if (params.validate_only !== undefined) {
      formData.append('validate_only', params.validate_only.toString())
    }

    // Add field mapping information for backend to understand Chinese column names
    const fieldMappingJson = JSON.stringify({
      'L2ID': 'application_id',
      'L2应用': 'application_name',
      '所属L1': 'business_domain',
      '所属项目': 'business_subdomain',
      '开发负责人': 'responsible_person',
      '开发团队': 'responsible_team',
      '改造状态': 'status',
      '硬件资源保障\n优先级': 'priority',
      '所属指标': 'kpi_classification',
      '档位': 'service_tier',
      '改造目标': 'transformation_target',
      '监管验收年份': 'supervision_year'
    })
    formData.append('field_mapping', fieldMappingJson)

    console.log('🔍 [ExcelAPI] Import request:', {
      endpoint: '/excel/import/applications',
      file: params.file.name,
      size: params.file.size,
      update_existing: params.update_existing,
      validate_only: params.validate_only
    })

    const response = await api.post('/excel/import/applications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('📊 [ExcelAPI] Import response:', response.data)
    return response.data
  }

  // Export applications to Excel
  static async exportApplications(params: ExcelExportParams = {}): Promise<ExcelExportResponse> {
    console.log('🔍 [ExcelAPI] Export request:', {
      endpoint: '/excel/export/applications',
      params
    })

    const response = await api.post('/excel/export/applications', params, {
      responseType: 'blob'
    })

    console.log('📊 [ExcelAPI] Export response:', response)
    return response.data
  }

  // Export and download applications Excel file directly
  static async exportAndDownloadApplications(params: ExcelExportParams = {}, filename?: string): Promise<void> {
    try {
      console.log('🔍 [ExcelAPI] Export and download request:', {
        endpoint: '/excel/export/applications',
        params,
        filename
      })

      const response = await api.post('/excel/export/applications', params, {
        responseType: 'blob'
      })

      console.log('📊 [ExcelAPI] Export and download response:', response)

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
      console.log('🔍 [ExcelAPI] Template download request:', {
        endpoint: `/excel/template/${type}`,
        type
      })

      const response = await api.get(`/excel/template/${type}`, {
        responseType: 'blob'
      })

      console.log('📊 [ExcelAPI] Template download response:', response)

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

  // Import subtasks from Excel
  static async importSubTasks(params: ExcelImportParams): Promise<ExcelImportResponse> {
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.update_existing !== undefined) {
      formData.append('update_existing', params.update_existing.toString())
    }
    if (params.validate_only !== undefined) {
      formData.append('validate_only', params.validate_only.toString())
    }

    console.log('🔍 [ExcelAPI] SubTasks import request:', {
      endpoint: '/excel/import/subtasks',
      file: params.file.name,
      size: params.file.size,
      update_existing: params.update_existing,
      validate_only: params.validate_only
    })

    const response = await api.post('/excel/import/subtasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('📊 [ExcelAPI] SubTasks import response:', response.data)
    return response.data
  }

  // Export subtasks to Excel
  static async exportSubTasks(params: ExcelExportParams = {}): Promise<ExcelExportResponse> {
    console.log('🔍 [ExcelAPI] SubTasks export request:', {
      endpoint: '/excel/export/subtasks',
      params
    })

    const response = await api.post('/excel/export/subtasks', params, {
      responseType: 'blob'
    })

    console.log('📊 [ExcelAPI] SubTasks export response:', response)
    return response.data
  }

  // Export and download subtasks Excel file directly
  static async exportAndDownloadSubTasks(params: ExcelExportParams = {}, filename?: string): Promise<void> {
    try {
      console.log('🔍 [ExcelAPI] SubTasks export and download request:', {
        endpoint: '/excel/export/subtasks',
        params,
        filename
      })

      const response = await api.post('/excel/export/subtasks', params, {
        responseType: 'blob'
      })

      console.log('📊 [ExcelAPI] SubTasks export and download response:', response)

      // Generate filename with current timestamp if not provided
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const finalFilename = filename || `subtasks_export_${timestamp}.xlsx`

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
      console.error('Failed to export and download SubTasks Excel:', error)
      throw error
    }
  }
}