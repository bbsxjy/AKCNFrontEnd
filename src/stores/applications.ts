import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { applicationApi, type ApplicationFilters } from '@/api/applications'
import type { Application, PaginatedResponse } from '@/types'

export const useApplicationStore = defineStore('applications', () => {
  const applications = ref<Application[]>([])
  const currentApplication = ref<Application | null>(null)
  const loading = ref(false)
  const total = ref(0)
  
  const filters = reactive<ApplicationFilters>({
    page: 1,
    page_size: 20,
    l2_id: '',
    app_name: '',
    status: '',
    department: '',
    year: undefined,
    target: '',
    sort_by: 'updated_at',
    order: 'desc'
  })

  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  const fetchApplications = async (newFilters?: Partial<ApplicationFilters>) => {
    try {
      loading.value = true
      
      if (newFilters) {
        Object.assign(filters, newFilters)
      }

      const response = await applicationApi.getApplications(filters)
      const data = response.data.data

      applications.value = data.items
      total.value = data.total
      
      pagination.page = data.page
      pagination.pageSize = data.page_size
      pagination.total = data.total
      pagination.totalPages = data.total_pages

      return data
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
      const response = await applicationApi.getApplication(id)
      currentApplication.value = response.data.data
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch application:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createApplication = async (data: Partial<Application>) => {
    try {
      loading.value = true
      const response = await applicationApi.createApplication(data)
      await fetchApplications()
      return response.data.data
    } catch (error) {
      console.error('Failed to create application:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateApplication = async (id: number, data: Partial<Application>) => {
    try {
      loading.value = true
      const response = await applicationApi.updateApplication(id, data)
      
      // Update local data
      const index = applications.value.findIndex(app => app.id === id)
      if (index !== -1) {
        applications.value[index] = { ...applications.value[index], ...data }
      }
      
      return response.data.data
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
      await applicationApi.deleteApplication(id)
      
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
      page: 1,
      page_size: 20,
      l2_id: '',
      app_name: '',
      status: '',
      department: '',
      year: undefined,
      target: '',
      sort_by: 'updated_at',
      order: 'desc'
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