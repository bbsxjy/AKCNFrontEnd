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
    l2_id: string
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
  success: boolean
  status?: string
  total_rows?: number
  processed_rows?: number
  updated_rows?: number
  skipped_rows?: number
  processing_time_ms?: number
  imported?: number  // Legacy compatibility
  updated?: number   // Legacy compatibility
  skipped?: number   // Legacy compatibility
  applications?: {
    total_rows: number
    imported: number
    updated: number
    skipped: number
  }
  subtasks?: {
    total_rows: number
    imported: number
    updated: number
    skipped: number
  }
  errors: Array<{
    row: number
    column?: string
    message?: string
    error?: string  // Legacy compatibility
    value?: any
    sheet?: string
    data?: Record<string, any>  // Legacy compatibility
  }>
  skipped_items?: Array<{
    row: number
    reason: string
    data?: Record<string, any>
    sheet?: string
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
  // Transform complete Excel file with both applications and subtasks (DEPRECATED - kept for future use)
  private static async transformCompleteExcelFileDeprecated(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as ArrayBuffer
          if (!data) {
            reject(new Error('Failed to read file'))
            return
          }

          console.log('🔄 [ExcelAPI] Starting complete Excel transformation:', {
            originalName: file.name,
            size: file.size,
            type: 'complete_import'
          })

          // Import xlsx dynamically to handle Excel files
          const XLSX = await import('xlsx')

          // Read the workbook
          const workbook = XLSX.read(data, { type: 'array' })
          console.log('📋 [ExcelAPI] Available sheets:', workbook.SheetNames)

          // Find both sheets
          const appSheetName = workbook.SheetNames.find(name => name.includes('总追踪表')) || workbook.SheetNames[0]
          const subtaskSheetName = workbook.SheetNames.find(name => name.includes('子追踪表')) || workbook.SheetNames[1]

          console.log(`📋 [ExcelAPI] Using application sheet: "${appSheetName}"`)
          console.log(`📋 [ExcelAPI] Using subtask sheet: "${subtaskSheetName}"`)

          // Process both sheets and combine into a single workbook
          const newWorkbook = XLSX.utils.book_new()

          // Process application sheet
          if (appSheetName && workbook.Sheets[appSheetName]) {
            const transformedAppSheet = await this.transformSingleSheet(workbook.Sheets[appSheetName], 'applications')
            XLSX.utils.book_append_sheet(newWorkbook, transformedAppSheet, 'Applications')
          }

          // Process subtask sheet
          if (subtaskSheetName && workbook.Sheets[subtaskSheetName]) {
            const transformedSubtaskSheet = await this.transformSingleSheet(workbook.Sheets[subtaskSheetName], 'subtasks')
            XLSX.utils.book_append_sheet(newWorkbook, transformedSubtaskSheet, 'SubTasks')
          }

          // Convert to buffer
          const newExcelBuffer = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' })

          // Create new file
          const transformedFile = new File([newExcelBuffer], `complete_transformed_${file.name}`, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })

          console.log('✅ [ExcelAPI] Complete Excel transformation completed:', {
            originalSize: file.size,
            newSize: transformedFile.size,
            newFileName: transformedFile.name,
            sheets: ['Applications', 'SubTasks']
          })

          resolve(transformedFile)
        } catch (error) {
          console.error('❌ [ExcelAPI] Complete Excel transformation failed:', error)
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  // Helper method to transform a single sheet
  static async transformSingleSheet(worksheet: any, sheetType: 'applications' | 'subtasks'): Promise<any> {
    const XLSX = await import('xlsx')

    // Convert to JSON to process data
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (!jsonData.length) {
      throw new Error(`Excel文件中的${sheetType}表为空`)
    }

    // Get headers and data rows
    const originalHeaders = jsonData[0] as string[]
    const dataRows = jsonData.slice(1)

    console.log(`📋 [ExcelAPI] Processing ${sheetType} sheet:`, {
      headers: originalHeaders.length,
      dataRows: dataRows.length
    })

    // Import field mapping
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

    console.log(`🔄 [ExcelAPI] ${sheetType} mapped headers:`, newHeaders)

    // Transform data rows
    const transformedRows = dataRows.map((row: any[], rowIndex: number) => {
      const newRow: any[] = []
      headerMapping.forEach((originalIndex, newIndex) => {
        let value = row[originalIndex]
        const fieldName = newHeaders[newIndex]

        // Apply value transformations
        if (fieldName === 'status' && value && statusMapping[value]) {
          value = statusMapping[value]
        } else if (fieldName === 'priority' && value && PRIORITY_VALUE_MAPPING[value]) {
          value = PRIORITY_VALUE_MAPPING[value]
        } else if (fieldName === 'transformation_target' && value && TARGET_VALUE_MAPPING[value]) {
          value = TARGET_VALUE_MAPPING[value]
        } else if (fieldName === 'supervision_year' && typeof value === 'string' && value.includes('年')) {
          value = parseInt(value.replace('年', ''))
        } else if (fieldName === 'l2_id') {
          value = String(value || '')
          if (!value.trim()) {
            value = `APP_${Date.now()}_${rowIndex + 1}`
          }
        } else if (fieldName === 'application_name') {
          value = String(value || '')
          if (!value.trim() && sheetType === 'applications') {
            value = `Application_${rowIndex + 1}`
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

    // Add default fields if needed
    if (sheetType === 'applications' && !newHeaders.includes('business_domain')) {
      newHeaders.push('business_domain')
      transformedRows.forEach(row => {
        row.push('Core')
      })
    }

    // Create new worksheet with transformed data
    return XLSX.utils.aoa_to_sheet([newHeaders, ...transformedRows])
  }

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
          let selectedSheetName: string
          if (sheetType === 'applications') {
            selectedSheetName = workbook.SheetNames.find(name => name.includes('总追踪表')) || workbook.SheetNames[0]
          } else {
            selectedSheetName = workbook.SheetNames.find(name => name.includes('子追踪表')) || workbook.SheetNames[1] || workbook.SheetNames[0]
          }

          console.log(`📋 [ExcelAPI] Using sheet: "${selectedSheetName}" for ${sheetType}`)
          const worksheet = workbook.Sheets[selectedSheetName]
          if (!worksheet) {
            reject(new Error(`无法找到工作表: ${selectedSheetName}`))
            return
          }

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
          const transformedRows = (dataRows as any[][]).map((row: any[], rowIndex: number) => {
            const newRow: any[] = []
            headerMapping.forEach((originalIndex, newIndex) => {
              let value = row[originalIndex]
              const fieldName = newHeaders[newIndex]

              // Apply value transformations based on field type and sheet type
              if (fieldName && fieldName === 'status' && value && statusMapping[value]) {
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
          // Use appropriate sheet name based on type
          const sheetName = sheetType === 'applications' ? 'Applications' : 'SubTasks'
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName)

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
          // Disabled for production
          if (false) {
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

  // Transform complete Excel file with both applications and subtasks sheets (Main implementation)
  static async transformCompleteExcelFile(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          console.log('🔄 [ExcelAPI] Starting complete Excel transformation:', {
            originalName: file.name,
            size: file.size
          })

          const data = e.target?.result as ArrayBuffer
          const XLSX = await import('xlsx')
          const workbook = XLSX.read(data, { type: 'array', cellDates: true })

          // Transform both sheets
          const newWorkbook = XLSX.utils.book_new()

          // Process applications sheet (总追踪表)
          const appSheetName = Object.keys(workbook.Sheets).find(name =>
            name.includes('总追踪表') || name.includes('总') || name.includes('追踪表')
          )

          if (appSheetName) {
            console.log('📋 [ExcelAPI] Processing applications sheet:', appSheetName)
            const appSheet = workbook.Sheets[appSheetName]
            const appData = XLSX.utils.sheet_to_json(appSheet, { header: 1 }) as any[][]

            if (appData.length > 0) {
              const headers = appData[0] as string[]
              const { APPLICATION_FIELD_MAPPING, transformApplicationRowToAPI } = await import('@/utils/excelFieldMapping')
              const transformedHeaders = headers.map((header: string) =>
                APPLICATION_FIELD_MAPPING[header] || header
              )

              const transformedData = [transformedHeaders]
              for (let i = 1; i < appData.length; i++) {
                const row = appData[i]
                const transformedRow = transformApplicationRowToAPI(
                  Object.fromEntries(headers.map((h, idx) => [h, row[idx]]))
                )
                transformedData.push(transformedHeaders.map(h => transformedRow[h]))
              }

              const newAppSheet = XLSX.utils.aoa_to_sheet(transformedData)
              XLSX.utils.book_append_sheet(newWorkbook, newAppSheet, 'applications')
              console.log('✅ [ExcelAPI] Applications sheet transformed:', transformedData.length - 1, 'rows')
            }
          }

          // Process subtasks sheet (子追踪表)
          const subSheetName = Object.keys(workbook.Sheets).find(name =>
            name.includes('子追踪表') || name.includes('子') || (name.includes('追踪表') && !name.includes('总'))
          )

          if (subSheetName) {
            console.log('📋 [ExcelAPI] Processing subtasks sheet:', subSheetName)
            const subSheet = workbook.Sheets[subSheetName]
            const subData = XLSX.utils.sheet_to_json(subSheet, { header: 1 }) as any[][]

            if (subData.length > 0) {
              const headers = subData[0] as string[]
              const { SUBTASK_FIELD_MAPPING, transformSubTaskRowToAPI } = await import('@/utils/excelFieldMapping')
              const transformedHeaders = headers.map((header: string) =>
                SUBTASK_FIELD_MAPPING[header] || header
              )

              const transformedData = [transformedHeaders]
              for (let i = 1; i < subData.length; i++) {
                const row = subData[i]
                const transformedRow = transformSubTaskRowToAPI(
                  Object.fromEntries(headers.map((h, idx) => [h, row[idx]]))
                )
                transformedData.push(transformedHeaders.map(h => transformedRow[h]))
              }

              const newSubSheet = XLSX.utils.aoa_to_sheet(transformedData)
              XLSX.utils.book_append_sheet(newWorkbook, newSubSheet, 'subtasks')
              console.log('✅ [ExcelAPI] Subtasks sheet transformed:', transformedData.length - 1, 'rows')
            }
          }

          // Convert workbook to blob and create file
          const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' })
          const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          const transformedFile = new File([blob], `complete_${file.name}`, { type: blob.type })

          console.log('✅ [ExcelAPI] Complete Excel transformation completed:', {
            originalSize: file.size,
            transformedSize: transformedFile.size,
            sheets: Object.keys(newWorkbook.Sheets)
          })

          resolve(transformedFile)
        } catch (error) {
          console.error('❌ [ExcelAPI] Complete Excel transformation failed:', error)
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  // Import complete Excel file with both applications and subtasks using backend dual-sheet support
  static async importCompleteExcel(params: ExcelImportParams): Promise<ExcelImportResponse> {
    console.log('🔍 [ExcelAPI] Starting complete import with direct file upload')

    // Try direct upload first - backend may handle Chinese column names
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.validate_only !== undefined) {
      formData.append('validate_only', params.validate_only.toString())
    }

    console.log('🔍 [ExcelAPI] Dual-sheet import request:', {
      endpoint: '/excel/import/subtasks',
      originalFile: params.file.name,
      originalSize: params.file.size,
      validate_only: params.validate_only,
      note: 'Using original file with Chinese column names'
    })

    const response = await api.post('/excel/import/subtasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 120 seconds timeout for large files
    })

    console.log('📊 [ExcelAPI] Dual-sheet import response:', response.data)
    console.log('🔍 [ExcelAPI] Complete - Applications breakdown:', response.data.applications)
    console.log('🔍 [ExcelAPI] Complete - Subtasks breakdown:', response.data.subtasks)
    console.log('🔍 [ExcelAPI] Complete - Errors array:', response.data.errors)

    // Log detailed error information for debugging
    if (!response.data.success) {
      console.error('❌ [ExcelAPI] Import validation failed:')
      console.error('❌ Success:', response.data.success)
      console.error('❌ Total rows:', response.data.total_rows)
      console.error('❌ Processed rows:', response.data.processed_rows)
      console.error('❌ Error count:', response.data.errors?.length || 0)
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('❌ First 5 errors:', response.data.errors.slice(0, 5))
      }
      if (response.data.applications) {
        console.error('❌ Applications result:', response.data.applications)
      }
      if (response.data.subtasks) {
        console.error('❌ Subtasks result:', response.data.subtasks)
      }
    }

    // Handle enhanced response format with dual-sheet statistics
    const enhancedResponse: ExcelImportResponse = {
      success: response.data.success || false,
      total_rows: response.data.total_rows || 0,
      processed_rows: response.data.processed_rows || 0,
      updated_rows: response.data.updated_rows || 0,
      skipped_rows: response.data.skipped_rows || 0,
      processing_time_ms: response.data.processing_time_ms || 0,
      applications: response.data.applications || {
        total_rows: 0,
        imported: 0,
        updated: 0,
        skipped: 0
      },
      subtasks: response.data.subtasks || {
        total_rows: 0,
        imported: 0,
        updated: 0,
        skipped: 0
      },
      errors: response.data.errors || [],
      skipped_items: response.data.skipped_items || [],
      // Legacy compatibility fields
      imported: (response.data.applications?.imported || 0) + (response.data.subtasks?.imported || 0),
      updated: (response.data.applications?.updated || 0) + (response.data.subtasks?.updated || 0),
      skipped: (response.data.applications?.skipped || 0) + (response.data.subtasks?.skipped || 0),
      status: response.data.success ? 'success' : 'error'
    }

    console.log('📊 [ExcelAPI] Enhanced dual-sheet summary:', {
      success: enhancedResponse.success,
      processing_time: enhancedResponse.processing_time_ms + 'ms',
      applications: enhancedResponse.applications,
      subtasks: enhancedResponse.subtasks,
      total_imported: enhancedResponse.imported,
      total_errors: enhancedResponse.errors.length
    })

    return enhancedResponse
  }

  // Import applications from Excel (Direct upload without transformation)
  static async importApplications(params: ExcelImportParams): Promise<ExcelImportResponse> {
    console.log('🔍 [ExcelAPI] Starting applications import with direct file upload')

    // Try direct upload first - backend may handle Chinese column names
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.update_existing !== undefined) {
      formData.append('update_existing', params.update_existing.toString())
    }
    if (params.validate_only !== undefined) {
      formData.append('validate_only', params.validate_only.toString())
    }

    console.log('🔍 [ExcelAPI] Import request:', {
      endpoint: '/excel/import/applications',
      originalFile: params.file.name,
      originalSize: params.file.size,
      update_existing: params.update_existing,
      validate_only: params.validate_only,
      note: 'Using original file with Chinese column names'
    })

    const response = await api.post('/excel/import/applications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 120 seconds timeout for large files
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

  // Import subtasks from Excel (Direct upload without transformation)
  static async importSubTasks(params: ExcelImportParams): Promise<ExcelImportResponse> {
    console.log('🔍 [ExcelAPI] Starting subtasks import with direct file upload')

    // Try direct upload first - backend may handle Chinese column names
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.validate_only !== undefined) {
      formData.append('validate_only', params.validate_only.toString())
    }

    console.log('🔍 [ExcelAPI] SubTasks import request:', {
      endpoint: '/excel/import/subtasks',
      originalFile: params.file.name,
      originalSize: params.file.size,
      validate_only: params.validate_only,
      note: 'Using original file with Chinese column names'
    })

    const response = await api.post('/excel/import/subtasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 120 seconds timeout for large files
    })

    console.log('📊 [ExcelAPI] SubTasks import response:', response.data)
    console.log('🔍 [ExcelAPI] Applications breakdown:', response.data.applications)
    console.log('🔍 [ExcelAPI] Subtasks breakdown:', response.data.subtasks)
    console.log('🔍 [ExcelAPI] Errors array:', response.data.errors)

    // Log detailed error information for debugging
    if (!response.data.success) {
      console.error('❌ [ExcelAPI] SubTasks import validation failed:')
      console.error('❌ Success:', response.data.success)
      console.error('❌ Total rows:', response.data.total_rows)
      console.error('❌ Processed rows:', response.data.processed_rows)
      console.error('❌ Error count:', response.data.errors?.length || 0)
      if (response.data.errors && response.data.errors.length > 0) {
        console.error('❌ First 5 errors:', response.data.errors.slice(0, 5))
        // Log detailed error information to understand validation failures
        console.error('❌ [ExcelAPI] Detailed validation errors:')
        response.data.errors.slice(0, 3).forEach((error: any, index: number) => {
          console.error(`❌ Error ${index + 1}:`)
          console.error('   Full error object:', error)
          if (error.data) {
            console.error('   Data that failed:', error.data)
          }
          if (error.error) {
            console.error('   Error message:', error.error)
          }
          if (error.row) {
            console.error('   Row number:', error.row)
          }
        })
      }
      if (response.data.applications) {
        console.error('❌ Applications result:', response.data.applications)
      }
      if (response.data.subtasks) {
        console.error('❌ Subtasks result:', response.data.subtasks)
      }
    }

    // Handle enhanced response format with dual-sheet statistics (same as complete import)
    const enhancedResponse: ExcelImportResponse = {
      success: response.data.success || false,
      total_rows: response.data.total_rows || 0,
      processed_rows: response.data.processed_rows || 0,
      updated_rows: response.data.updated_rows || 0,
      skipped_rows: response.data.skipped_rows || 0,
      processing_time_ms: response.data.processing_time_ms || 0,
      applications: response.data.applications || {
        total_rows: 0,
        imported: 0,
        updated: 0,
        skipped: 0
      },
      subtasks: response.data.subtasks || {
        total_rows: 0,
        imported: 0,
        updated: 0,
        skipped: 0
      },
      errors: response.data.errors || [],
      skipped_items: response.data.skipped_items || [],
      // Legacy compatibility fields
      imported: (response.data.applications?.imported || 0) + (response.data.subtasks?.imported || 0),
      updated: (response.data.applications?.updated || 0) + (response.data.subtasks?.updated || 0),
      skipped: (response.data.applications?.skipped || 0) + (response.data.subtasks?.skipped || 0),
      status: response.data.success ? 'success' : 'error'
    }

    console.log('📊 [ExcelAPI] Enhanced SubTasks summary:', {
      success: enhancedResponse.success,
      processing_time: enhancedResponse.processing_time_ms + 'ms',
      applications: enhancedResponse.applications,
      subtasks: enhancedResponse.subtasks,
      total_imported: enhancedResponse.imported,
      total_errors: enhancedResponse.errors.length
    })

    return enhancedResponse
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