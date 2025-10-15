import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { Application } from '@/api/applications'
import type { SubTask } from '@/api/subtasks'

const APPLICATIONS_FAVORITES_KEY = 'application_favorites'
const SUBTASKS_FAVORITES_KEY = 'subtask_favorites'

export function useFavorites() {
  // Application favorites
  const applicationFavoriteIds = ref<Set<number>>(new Set())

  // SubTask favorites
  const subTaskFavoriteIds = ref<Set<number>>(new Set())

  // Load favorites from localStorage
  const loadApplicationFavorites = () => {
    try {
      const stored = localStorage.getItem(APPLICATIONS_FAVORITES_KEY)
      if (stored) {
        const ids = JSON.parse(stored) as number[]
        applicationFavoriteIds.value = new Set(ids)
      }
    } catch (error) {
      console.error('Failed to load application favorites from localStorage:', error)
      applicationFavoriteIds.value = new Set()
    }
  }

  const loadSubTaskFavorites = () => {
    try {
      const stored = localStorage.getItem(SUBTASKS_FAVORITES_KEY)
      if (stored) {
        const ids = JSON.parse(stored) as number[]
        subTaskFavoriteIds.value = new Set(ids)
      }
    } catch (error) {
      console.error('Failed to load subtask favorites from localStorage:', error)
      subTaskFavoriteIds.value = new Set()
    }
  }

  // Save favorites to localStorage
  const saveApplicationFavorites = () => {
    try {
      const ids = Array.from(applicationFavoriteIds.value)
      localStorage.setItem(APPLICATIONS_FAVORITES_KEY, JSON.stringify(ids))
    } catch (error) {
      console.error('Failed to save application favorites to localStorage:', error)
    }
  }

  const saveSubTaskFavorites = () => {
    try {
      const ids = Array.from(subTaskFavoriteIds.value)
      localStorage.setItem(SUBTASKS_FAVORITES_KEY, JSON.stringify(ids))
    } catch (error) {
      console.error('Failed to save subtask favorites to localStorage:', error)
    }
  }

  // Toggle favorite status for application
  const toggleApplicationFavorite = (app: Application) => {
    if (applicationFavoriteIds.value.has(app.id)) {
      applicationFavoriteIds.value.delete(app.id)
      app.is_favorite = false
      ElMessage.success('已取消关注')
    } else {
      applicationFavoriteIds.value.add(app.id)
      app.is_favorite = true
      ElMessage.success('已添加到关注')
    }

    // Save to localStorage
    saveApplicationFavorites()
  }

  // Toggle favorite status for subtask
  const toggleSubTaskFavorite = (task: SubTask) => {
    if (subTaskFavoriteIds.value.has(task.id)) {
      subTaskFavoriteIds.value.delete(task.id)
      ;(task as any).is_favorite = false
      ElMessage.success('已取消关注')
    } else {
      subTaskFavoriteIds.value.add(task.id)
      ;(task as any).is_favorite = true
      ElMessage.success('已添加到关注')
    }

    // Save to localStorage
    saveSubTaskFavorites()
  }

  // Sync is_favorite field with application data
  const syncApplicationsFavorites = (applications: Application[]) => {
    applications.forEach(app => {
      app.is_favorite = applicationFavoriteIds.value.has(app.id)
    })
  }

  // Sync is_favorite field with subtask data
  const syncSubTasksFavorites = (subTasks: SubTask[]) => {
    subTasks.forEach(task => {
      // Note: SubTask might not have is_favorite field in type, but we set it for consistency
      ;(task as any).is_favorite = subTaskFavoriteIds.value.has(task.id)
    })
  }

  // Get favorite applications from a list
  const getFavoriteApplications = (applications: Application[]) => {
    return applications.filter(app => applicationFavoriteIds.value.has(app.id))
  }

  // Get favorite subtasks from a list
  const getFavoriteSubTasks = (subTasks: SubTask[]) => {
    return subTasks.filter(task => subTaskFavoriteIds.value.has(task.id))
  }

  // Check if application is favorite
  const isApplicationFavorite = (id: number) => {
    return applicationFavoriteIds.value.has(id)
  }

  // Check if subtask is favorite
  const isSubTaskFavorite = (id: number) => {
    return subTaskFavoriteIds.value.has(id)
  }

  // Computed properties for favorite counts
  const applicationFavoritesCount = computed(() => applicationFavoriteIds.value.size)
  const subTaskFavoritesCount = computed(() => subTaskFavoriteIds.value.size)

  // Clear all favorites
  const clearApplicationFavorites = () => {
    applicationFavoriteIds.value.clear()
    saveApplicationFavorites()
    ElMessage.success('已清空所有应用收藏')
  }

  const clearSubTaskFavorites = () => {
    subTaskFavoriteIds.value.clear()
    saveSubTaskFavorites()
    ElMessage.success('已清空所有子任务收藏')
  }

  return {
    // Application favorites
    applicationFavoriteIds,
    applicationFavoritesCount,
    loadApplicationFavorites,
    toggleApplicationFavorite,
    syncApplicationsFavorites,
    getFavoriteApplications,
    isApplicationFavorite,
    clearApplicationFavorites,

    // SubTask favorites
    subTaskFavoriteIds,
    subTaskFavoritesCount,
    loadSubTaskFavorites,
    toggleSubTaskFavorite,
    syncSubTasksFavorites,
    getFavoriteSubTasks,
    isSubTaskFavorite,
    clearSubTaskFavorites
  }
}
