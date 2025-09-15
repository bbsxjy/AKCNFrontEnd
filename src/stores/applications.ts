import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ApplicationsAPI } from '@/api/applications'
import type { ApplicationListParams } from '@/api/applications'
import type { Application } from '@/types'

export const useApplicationStore = defineStore('applications', () => {
  const applications = ref<Application[]>([])
  const currentApplication = ref<Application | null>(null)
  const loading = ref(false)
  const total = ref(0)
  
  const filters = reactive<ApplicationListParams>({
    skip: 0,
    limit: 20,
    search: '',
    status: '',
    team: ''
  })

  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  const fetchApplications = async (newFilters?: Partial<ApplicationListParams>) => {
    try {
      loading.value = true
      
      if (newFilters) {
        Object.assign(filters, newFilters)
      }

      const response = await ApplicationsAPI.getApplications(filters)
      
      applications.value = response.items
      total.value = response.total
      
      pagination.page = Math.floor((filters.skip || 0) / (filters.limit || 20)) + 1
      pagination.pageSize = filters.limit || 20
      pagination.total = response.total
      pagination.totalPages = Math.ceil(response.total / (filters.limit || 20))

      return response
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchApplication = async (id: number) => {
    try {
      loading.value = true
      const response = await ApplicationsAPI.getApplication(id)
      currentApplication.value = response
      return response
    } catch (error) {
      console.error('Failed to fetch application:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createApplication = async (data: any) => {
    try {
      loading.value = true
      const response = await ApplicationsAPI.createApplication(data)
      await fetchApplications()
      return response
    } catch (error) {
      console.error('Failed to create application:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateApplication = async (id: number, data: any) => {
    try {
      loading.value = true
      const response = await ApplicationsAPI.updateApplication(id, data)
      
      // Update local data
      const index = applications.value.findIndex(app => app.id === id)
      if (index !== -1) {
        applications.value[index] = { ...applications.value[index], ...data }
      }
      
      return response
    } catch (error) {
      console.error('Failed to update application:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteApplication = async (id: number) => {
    try {
      loading.value = true
      await ApplicationsAPI.deleteApplication(id)
      
      // Remove from local data
      applications.value = applications.value.filter(app => app.id !== id)
      total.value -= 1
      
    } catch (error) {
      console.error('Failed to delete application:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const resetFilters = () => {
    Object.assign(filters, {
      skip: 0,
      limit: 20,
      search: '',
      status: '',
      team: ''
    })
  }

  return {
    applications,
    currentApplication,
    loading,
    total,
    filters,
    pagination,
    fetchApplications,
    fetchApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    resetFilters
  }
})