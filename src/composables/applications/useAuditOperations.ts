import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AuditAPI, type AuditLog } from '@/api/audit'
import { useAuthStore } from '@/stores/auth'

export function useAuditOperations() {
  const auditRecords = ref<AuditLog[]>([])
  const loading = ref(false)

  const authStore = useAuthStore()
  const isAdmin = computed(() => authStore.hasRole('ADMIN'))

  // Load audit records for a specific resource
  const loadAuditRecords = async (tableName: string, resourceId: number) => {
    try {
      loading.value = true
      const records = await AuditAPI.getRecordHistory(tableName, resourceId)

      // Ensure records is an array and filter out invalid entries
      if (Array.isArray(records)) {
        auditRecords.value = records.filter(record =>
          record && typeof record === 'object' && record.operation
        )
      } else {
        console.warn('Audit records API did not return an array:', records)
        auditRecords.value = []
      }
    } catch (error) {
      console.error('Failed to load audit records:', error)
      auditRecords.value = []
      throw error
    } finally {
      loading.value = false
    }
  }

  // Check if can rollback
  const canRollback = (record: AuditLog) => {
    if (!record || !record.id || !record.created_at || !isAdmin.value) return false

    // Only allow rollback of recent operations (within 7 days)
    const recordDate = new Date(record.created_at)
    const now = new Date()
    const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  }

  // Rollback audit operation
  const rollbackAudit = async (record: AuditLog, onSuccess?: () => void) => {
    if (!record || !record.id) {
      ElMessage.error('无法回滚：记录ID无效')
      return
    }

    try {
      await ElMessageBox.confirm(
        '确定要回滚此操作吗？这将恢复到操作前的状态。',
        '确认回滚',
        {
          confirmButtonText: '确定回滚',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      loading.value = true

      await AuditAPI.rollbackAuditLog(record.id, {
        confirm: true,
        reason: '管理员手动回滚'
      })

      ElMessage.success('操作已回滚')

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      if (error === 'cancel') return

      console.error('Failed to rollback:', error)
      ElMessage.error('回滚操作失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // Get plan adjustments from audit records
  const extractPlanAdjustments = (audits: AuditLog[]) => {
    const planFields = [
      'planned_requirement_date',
      'planned_release_date',
      'planned_tech_online_date',
      'planned_biz_online_date'
    ]

    return audits.filter(audit =>
      audit.changed_fields?.some(field => planFields.includes(field))
    ).map(audit => ({
      adjusted_at: audit.created_at,
      field: audit.changed_fields?.find(f => planFields.includes(f)),
      user: audit.user_full_name,
      old_values: audit.old_values,
      new_values: audit.new_values
    }))
  }

  // Process plan history from audit records
  const processPlanHistory = (audits: AuditLog[], currentState: any) => {
    const history: any[] = []

    // Add current state
    history.push({
      adjusted_at: new Date().toISOString(),
      adjusted_by: '当前状态',
      planned_requirement_date: currentState.planned_requirement_date,
      planned_release_date: currentState.planned_release_date,
      planned_tech_online_date: currentState.planned_tech_online_date,
      planned_biz_online_date: currentState.planned_biz_online_date,
      is_current: true
    })

    // Add historical states from audits
    audits.forEach(audit => {
      const planState = {
        adjusted_at: audit.created_at,
        adjusted_by: audit.user_full_name || '系统',
        planned_requirement_date: audit.old_values?.planned_requirement_date,
        planned_release_date: audit.old_values?.planned_release_date,
        planned_tech_online_date: audit.old_values?.planned_tech_online_date,
        planned_biz_online_date: audit.old_values?.planned_biz_online_date
      }

      // Only add if there are actual date values
      if (Object.values(planState).some(v => v && v !== audit.created_at && v !== audit.user_full_name)) {
        history.push(planState)
      }
    })

    return history
  }

  // Extract adjustment details for table view
  const extractAdjustmentDetails = (audits: AuditLog[], calculateMonthsDiff: (date1: string, date2: string) => number) => {
    const details: any[] = []
    const planFields = [
      'planned_requirement_date',
      'planned_release_date',
      'planned_tech_online_date',
      'planned_biz_online_date'
    ]

    audits.forEach(audit => {
      audit.changed_fields?.forEach(field => {
        if (planFields.includes(field)) {
          const oldDate = audit.old_values?.[field]
          const newDate = audit.new_values?.[field]

          if (oldDate && newDate) {
            const monthsDiff = calculateMonthsDiff(oldDate, newDate)

            details.push({
              adjusted_at: audit.created_at,
              adjusted_by: audit.user_full_name || '系统',
              field: field,
              old_date: oldDate,
              new_date: newDate,
              delay_days: monthsDiff,
              reason: audit.new_values?.adjustment_reason || '未说明'
            })
          }
        }
      })
    })

    return details.sort((a, b) => new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime())
  }

  // Clear audit records
  const clearAuditRecords = () => {
    auditRecords.value = []
  }

  return {
    auditRecords,
    loading,
    isAdmin,
    loadAuditRecords,
    canRollback,
    rollbackAudit,
    extractPlanAdjustments,
    processPlanHistory,
    extractAdjustmentDetails,
    clearAuditRecords
  }
}
