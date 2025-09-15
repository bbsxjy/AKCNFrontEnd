import api from './index'

export interface CalculationRequest {
  application_ids?: number[]
  calculation_type?: 'all' | 'resource' | 'service' | 'traffic'
}

export interface CalculationResult {
  application_id: number
  progress_percentage: number
  resource_progress: number
  service_progress: number
  traffic_progress: number
}

export interface CalculationResponse {
  status: string
  calculated_count: number
  results: CalculationResult[]
  execution_time_ms: number
}

export class CalculationAPI {
  // Trigger calculation for applications
  static async calculate(data: CalculationRequest = {}): Promise<CalculationResponse> {
    const requestData = {
      calculation_type: 'all',
      ...data
    }

    const response = await api.post('/calculation/calculate', requestData)
    return response.data
  }

  // Calculate for specific applications
  static async calculateApplications(applicationIds: number[]): Promise<CalculationResponse> {
    return this.calculate({
      application_ids: applicationIds,
      calculation_type: 'all'
    })
  }

  // Calculate specific type for all applications
  static async calculateByType(type: 'resource' | 'service' | 'traffic'): Promise<CalculationResponse> {
    return this.calculate({
      calculation_type: type
    })
  }

  // Calculate all progress for all applications
  static async calculateAll(): Promise<CalculationResponse> {
    return this.calculate({
      calculation_type: 'all'
    })
  }
}