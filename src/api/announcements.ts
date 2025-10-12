import axios from './index'

export interface Announcement {
  id: number
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'draft' | 'published' | 'archived'
  created_by_user_id: number
  created_by_name?: string
  is_pinned: boolean
  publish_date?: string
  expire_date?: string
  created_at: string
  updated_at?: string
}

export interface CreateAnnouncementRequest {
  title: string
  content: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'draft' | 'published'
  is_pinned?: boolean
  publish_date?: string
  expire_date?: string
}

export interface UpdateAnnouncementRequest {
  title?: string
  content?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'draft' | 'published' | 'archived'
  is_pinned?: boolean
  publish_date?: string
  expire_date?: string
}

export interface AnnouncementListParams {
  page?: number
  page_size?: number
  status?: string
  priority?: string
  is_pinned?: boolean
}

export const AnnouncementsAPI = {
  /**
   * Get list of announcements
   */
  async getAnnouncements(params?: AnnouncementListParams) {
    const response = await axios.get('/announcements', { params })
    return response.data
  },

  /**
   * Get a single announcement
   */
  async getAnnouncement(announcementId: number) {
    const response = await axios.get(`/announcements/${announcementId}`)
    return response.data
  },

  /**
   * Create a new announcement
   */
  async createAnnouncement(announcementData: CreateAnnouncementRequest) {
    const response = await axios.post('/announcements', announcementData)
    return response.data
  },

  /**
   * Update an announcement
   */
  async updateAnnouncement(announcementId: number, announcementData: UpdateAnnouncementRequest) {
    const response = await axios.put(`/announcements/${announcementId}`, announcementData)
    return response.data
  },

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(announcementId: number) {
    const response = await axios.delete(`/announcements/${announcementId}`)
    return response.data
  },

  /**
   * Toggle pin status
   */
  async togglePin(announcementId: number, isPinned: boolean) {
    const response = await axios.patch(`/announcements/${announcementId}/pin`, { is_pinned: isPinned })
    return response.data
  },

  /**
   * Get active announcements (published and not expired)
   */
  async getActiveAnnouncements(params?: { limit?: number }) {
    const response = await axios.get('/announcements/active', { params })
    return response.data
  },

  /**
   * Get pinned announcements
   */
  async getPinnedAnnouncements() {
    const response = await axios.get('/announcements/pinned')
    return response.data
  }
}
