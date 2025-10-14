<template>
  <el-dialog v-model="visible" title="子任务详情" width="900px" @update:model-value="handleClose">
    <el-tabs v-model="activeTab" type="card">
      <!-- 基础信息 -->
      <el-tab-pane label="基础信息" name="basic">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="所属应用" label-align="right">
            <strong>{{ getApplicationL2IdDisplay(data.l2_id || '') }}</strong>
            <div style="font-size: 12px; color: #718096; margin-top: 4px;">
              {{ getApplicationNameByL2Id(data.l2_id || '') }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="版本名称" label-align="right">
            <strong>{{ data.version_name || '-' }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="改造目标" label-align="right">
            <el-tag :type="data.sub_target === 'AK' ? 'primary' : 'success'" size="small">
              {{ data.sub_target || 'AK' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前状态" label-align="right">
            <el-tag :type="getSubTaskStatusType(data.task_status || '')" size="small">
              {{ data.task_status || '待启动' }}
            </el-tag>
            <el-tag v-if="data.is_blocked" type="danger" size="small" style="margin-left: 8px;">
              阻塞中
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="整体进度" label-align="right" :span="2">
            <el-progress
              :percentage="calculateSubTaskProgress(data as SubTask)"
              :stroke-width="20"
              :color="getSubTaskProgressColor(data as SubTask)"
              style="width: 300px;"
            >
              <template #default="{ percentage }">
                <span style="font-size: 14px; font-weight: 600;">{{ percentage }}%</span>
              </template>
            </el-progress>
          </el-descriptions-item>
          <el-descriptions-item label="阻塞原因" label-align="right" :span="2" v-if="data.is_blocked">
            <span style="color: #f56565;">{{ data.blocking_reason || '未说明' }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 团队信息 -->
      <el-tab-pane label="团队信息" name="team">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="开发负责人" label-align="right">
            {{ data.dev_owner || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="运维负责人" label-align="right">
            {{ data.ops_owner || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 时间进度 -->
      <el-tab-pane label="时间进度" name="timeline">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="【计划】需求完成" label-align="right">
            {{ formatYearMonth(data.planned_requirement_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="【实际】需求到达" label-align="right">
            <span :class="getDateComparisonClass(data.planned_requirement_date, data.actual_requirement_date)">
              {{ formatYearMonth(data.actual_requirement_date) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="【计划】发版时间" label-align="right">
            {{ formatYearMonth(data.planned_release_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="【实际】发版时间" label-align="right">
            <span :class="getDateComparisonClass(data.planned_release_date, data.actual_release_date)">
              {{ formatYearMonth(data.actual_release_date) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="【计划】技术上线" label-align="right">
            {{ formatYearMonth(data.planned_tech_online_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="【实际】技术上线" label-align="right">
            <span :class="getDateComparisonClass(data.planned_tech_online_date, data.actual_tech_online_date)">
              {{ formatYearMonth(data.actual_tech_online_date) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="【计划】业务上线" label-align="right">
            {{ formatYearMonth(data.planned_biz_online_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="【实际】业务上线" label-align="right">
            <span :class="getDateComparisonClass(data.planned_biz_online_date, data.actual_biz_online_date)">
              {{ formatYearMonth(data.actual_biz_online_date) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 运营状态 -->
      <el-tab-pane label="运营状态" name="operational">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="资源申请" label-align="right">
            <el-tag :type="data.resource_applied ? 'success' : 'info'" size="small">
              {{ data.resource_applied ? '已申请' : '未申请' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="运营需求提交" label-align="right">
            <el-tag :type="data.ops_requirement_submitted ? 'success' : 'info'" size="small">
              {{ data.ops_requirement_submitted ? '已提交' : '未提交' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="运营测试" label-align="right">
            <el-tag
              v-if="data.ops_testing_status"
              :type="data.ops_testing_status === '已完成' ? 'success' : data.ops_testing_status === '测试失败' ? 'danger' : 'warning'"
              size="small"
            >
              {{ data.ops_testing_status }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="上线检查" label-align="right">
            <el-tag
              v-if="data.launch_check_status"
              :type="data.launch_check_status === '已通过' ? 'success' : data.launch_check_status === '未通过' ? 'danger' : 'warning'"
              size="small"
            >
              {{ data.launch_check_status }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 延期分析 -->
      <el-tab-pane label="延期分析" name="delay" v-if="getSubTaskDelayInfo(data as SubTask).hasDelay">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="延期状态" label-align="right">
            <el-tag :type="getSubTaskDelayInfo(data as SubTask).severity" size="small">
              {{ getSubTaskDelayInfo(data as SubTask).text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="延期天数" label-align="right">
            <span style="color: #f56565; font-weight: 600;">
              {{ getSubTaskDelayInfo(data as SubTask).days }} 月
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="延期类型" label-align="right" :span="2">
            {{ getSubTaskDelayInfo(data as SubTask).type }}
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 其他信息 -->
      <el-tab-pane label="其他信息" name="other">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="创建时间" label-align="right">
            {{ formatDate(data.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" label-align="right">
            {{ formatDate(data.updated_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" label-align="right" :span="2">
            {{ data.notes || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <el-button type="primary" @click="handleEdit">编辑子任务</el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SubTask } from '@/types'
import { useFormatters } from '@/composables/applications/useFormatters'
import { useStatusHelpers } from '@/composables/applications/useStatusHelpers'
import { useDelayCalculations } from '@/composables/applications/useDelayCalculations'

interface Props {
  modelValue: boolean
  data: Partial<SubTask>
  allApplications: any[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', task: SubTask): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(props.modelValue)
const activeTab = ref('basic')

// 使用 composables
const { formatDate, formatYearMonth } = useFormatters()
const { getSubTaskStatusType, calculateSubTaskProgress, getSubTaskProgressColor } = useStatusHelpers()
const { getSubTaskDelayInfo, getDateComparisonClass } = useDelayCalculations()

// 监听外部变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    activeTab.value = 'basic'
  }
})

// 监听内部变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 获取应用信息的辅助函数
const getApplicationL2IdDisplay = (l2Id: string): string => {
  return l2Id || '-'
}

const getApplicationNameByL2Id = (l2Id: string): string => {
  const app = props.allApplications.find(app => app.l2_id === l2Id)
  return app ? app.app_name : '-'
}

// 处理关闭
const handleClose = () => {
  visible.value = false
}

// 处理编辑
const handleEdit = () => {
  emit('edit', props.data as SubTask)
  handleClose()
}
</script>

<style scoped>
.date-cell {
  padding: 4px;
  border-radius: 4px;
  font-size: 13px;
}

.date-cell.on-time {
  color: #22543d;
  background-color: #c6f6d5;
  font-weight: 600;
}

.date-cell.delayed {
  color: #7c2d12;
  background-color: #fed7aa;
  font-weight: 600;
}

.date-cell.delayed-serious {
  color: #7c2d12;
  background-color: #feb2b2;
  font-weight: 600;
}

.date-cell.pending {
  color: #a0aec0;
  background-color: #f7fafc;
}

.date-cell.completed {
  color: #22543d;
  background-color: #c6f6d5;
  font-weight: 600;
}
</style>
