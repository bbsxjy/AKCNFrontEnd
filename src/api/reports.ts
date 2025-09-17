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
  // Transform user's Excel format to API format with sheet selection
  static async transformExcelFile(file: File, sheetType: 'applications' | 'subtasks' = 'applications'): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as ArrayBuffer
          if (!data) {
            reject(new Error('Failed to read file'))
            return
          }

          console.log('🔄 [ExcelAPI] Starting Excel transformation:', {
            originalName: file.name,
            size: file.size,
            sheetType
          })

          // Import xlsx dynamically to handle Excel files
          const XLSX = await import('xlsx')

          // Read the workbook
          const workbook = XLSX.read(data, { type: 'array' })

          // Select appropriate sheet based on type
          let sheetName: string
          if (sheetType === 'applications') {
            sheetName = workbook.SheetNames.find(name => name.includes('总追踪表')) || workbook.SheetNames[0]
          } else {
            sheetName = workbook.SheetNames.find(name => name.includes('子追踪表')) || workbook.SheetNames[1] || workbook.SheetNames[0]
          }

          console.log(`📋 [ExcelAPI] Using sheet: "${sheetName}" for ${sheetType}`)
          const worksheet = workbook.Sheets[sheetName]

          // Convert to JSON to process data
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (!jsonData.length) {
            reject(new Error('Excel文件为空'))
            return
          }

          // Get headers and data rows
          const originalHeaders = jsonData[0] as string[]
          const dataRows = jsonData.slice(1)

          console.log('📋 [ExcelAPI] Original headers:', originalHeaders)
          console.log('📊 [ExcelAPI] Data rows count:', dataRows.length)

          // Import field mapping based on sheet type
          const {
            APPLICATION_FIELD_MAPPING,
            SUBTASK_FIELD_MAPPING,
            APPLICATION_STATUS_MAPPING,
            SUBTASK_STATUS_MAPPING,
            PRIORITY_VALUE_MAPPING,
            TARGET_VALUE_MAPPING
          } = await import('@/utils/excelFieldMapping')

          const fieldMapping = sheetType === 'applications' ? APPLICATION_FIELD_MAPPING : SUBTASK_FIELD_MAPPING
          const statusMapping = sheetType === 'applications' ? APPLICATION_STATUS_MAPPING : SUBTASK_STATUS_MAPPING

          // Create new headers by mapping original headers
          const newHeaders: string[] = []
          const headerMapping: number[] = []

          originalHeaders.forEach((header, index) => {
            const mappedField = fieldMapping[header]
            if (mappedField) {
              newHeaders.push(mappedField)
              headerMapping.push(index)
            }
          })

          console.log('🔄 [ExcelAPI] Mapped headers:', newHeaders)

          // Transform data rows
          const transformedRows = dataRows.map((row: any[], rowIndex: number) => {
            const newRow: any[] = []
            headerMapping.forEach((originalIndex, newIndex) => {
              let value = row[originalIndex]
              const fieldName = newHeaders[newIndex]

              // Apply value transformations based on field type and sheet type
              if (fieldName === 'status' && value && statusMapping[value]) {
                value = statusMapping[value]
              } else if (fieldName === 'priority' && value && PRIORITY_VALUE_MAPPING[value]) {
                value = PRIORITY_VALUE_MAPPING[value]
              } else if (fieldName === 'transformation_target' && value && TARGET_VALUE_MAPPING[value]) {
                value = TARGET_VALUE_MAPPING[value]
              } else if (fieldName === 'supervision_year' && typeof value === 'string' && value.includes('年')) {
                value = parseInt(value.replace('年', ''))
              } else if (fieldName === 'application_id') {
                value = String(value || '')
                // Ensure application_id is not empty
                if (!value.trim()) {
                  value = `APP_${Date.now()}_${rowIndex + 1}`
                }
              } else if (fieldName === 'application_name') {
                value = String(value || '')
                // For applications sheet, generate name if empty; for subtasks, use actual data
                if (!value.trim() && sheetType === 'applications') {
                  value = `Application_${rowIndex + 1}`
                }
              } else if (fieldName === 'business_domain') {
                value = String(value || '')
                // Provide default business domain if empty
                if (!value.trim()) {
                  value = 'Core'
                }
              } else if (sheetType === 'subtasks' && (
                fieldName.includes('_date') ||
                fieldName === 'planned_start_date' ||
                fieldName === 'actual_start_date' ||
                fieldName === 'planned_end_date' ||
                fieldName === 'actual_end_date'
              )) {
                // Handle Excel date serial numbers for subtask dates
                if (typeof value === 'number' && value > 25569) {
                  const excelDate = new Date((value - 25569) * 86400 * 1000)
                  value = excelDate.toISOString().split('T')[0]
                } else if (value instanceof Date) {
                  value = value.toISOString().split('T')[0]
                }
              } else {
                // Ensure all other fields are strings to avoid type issues
                value = String(value || '')
              }

              newRow.push(value || '')
            })
            return newRow
          })

          // Set default values for required fields that might be missing
          if (!newHeaders.includes('business_domain') && sheetType === 'applications') {
            newHeaders.push('business_domain')
            transformedRows.forEach(row => {
              row.push('Core')
            })
          }

          console.log('🔧 [ExcelAPI] Final headers with defaults:', newHeaders)

          // Create new workbook with transformed data
          const newWorksheet = XLSX.utils.aoa_to_sheet([newHeaders, ...transformedRows])
          const newWorkbook = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Applications')

          // Convert to buffer
          const newExcelBuffer = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' })

          // Create new file
          const transformedFile = new File([newExcelBuffer], `transformed_${file.name}`, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })

          // Debug: Check first few rows of transformed data
          console.log('🔍 [ExcelAPI] Sample transformed data:')
          console.log('Headers:', newHeaders)
          if (transformedRows.length > 0) {
            console.log('Row 1:', transformedRows[0])
            if (transformedRows.length > 1) {
              console.log('Row 2:', transformedRows[1])
            }
          }

          console.log('✅ [ExcelAPI] Excel transformation completed:', {
            originalHeaders: originalHeaders.length,
            mappedHeaders: newHeaders.length,
            dataRows: transformedRows.length,
            newFileName: transformedFile.name,
            newSize: transformedFile.size,
            hasValidData: transformedRows.length > 0 && transformedRows[0].some(cell => cell !== '')
          })

          // Debug: Save transformed file to downloads for inspection
          if (process.env.NODE_ENV === 'development') {
            const downloadUrl = URL.createObjectURL(transformedFile)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `debug_${transformedFile.name}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(downloadUrl)
            console.log('💾 [ExcelAPI] Debug: Transformed file saved to downloads for inspection')
          }

          resolve(transformedFile)
        } catch (error) {
          console.error('❌ [ExcelAPI] Excel transformation failed:', error)
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

    // Note: Excel file has been transformed to use English column names that the API expects

    console.log('🔍 [ExcelAPI] Import request:', {
      endpoint: '/excel/import/applications',
      originalFile: params.file.name,
      originalSize: params.file.size,
      transformedFile: transformedFile.name,
      transformedSize: transformedFile.size,
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