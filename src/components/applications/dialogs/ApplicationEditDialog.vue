<template>
  <el-dialog v-model="visible" title="编辑应用" width="800px" @close="handleClose">
    <el-form :model="formData" label-width="120px">
      <el-tabs v-model="activeTab" type="card">
        <!-- 基础信息 -->
        <el-tab-pane label="基础信息" name="basic">
          <el-form-item label="L2 ID">
            <el-input v-model="formData.l2_id" />
          </el-form-item>
          <el-form-item label="应用名称" required>
            <el-input v-model="formData.app_name" />
          </el-form-item>
          <el-form-item label="所属L1">
            <el-input v-model="formData.belonging_l1_name" placeholder="请输入所属L1名称" />
          </el-form-item>
          <el-form-item label="所属项目">
            <el-input v-model="formData.belonging_projects" placeholder="请输入所属项目" />
          </el-form-item>
          <el-form-item label="所属指标">
            <el-input v-model="formData.belonging_kpi" placeholder="请输入所属指标" />
          </el-form-item>
          <el-form-item label="监管验收年份">
            <el-select v-model="formData.ak_supervision_acceptance_year" placeholder="请选择年份">
              <el-option :value="2025" label="2025年" />
              <el-option :value="2026" label="2026年" />
              <el-option :value="2027" label="2027年" />
            </el-select>
          </el-form-item>
          <el-form-item label="改造目标">
            <el-radio-group v-model="formData.overall_transformation_target">
              <el-radio value="AK">AK</el-radio>
              <el-radio value="云原生">云原生</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="当前状态">
            <el-select v-model="formData.current_status" placeholder="请选择状态">
              <el-option value="待启动" label="待启动" />
              <el-option value="研发进行中" label="研发进行中" />
              <el-option value="业务上线中" label="业务上线中" />
              <el-option value="全部完成" label="全部完成" />
              <el-option value="存在阻塞" label="存在阻塞" />
            </el-select>
          </el-form-item>
          <el-form-item label="验收状态">
            <el-select v-model="formData.acceptance_status" placeholder="请选择验收状态" clearable>
              <el-option value="未验收" label="未验收" />
              <el-option value="验收中" label="验收中" />
              <el-option value="已验收" label="已验收" />
            </el-select>
          </el-form-item>
        </el-tab-pane>

        <!-- 团队信息 -->
        <el-tab-pane label="团队信息" name="team">
          <el-form-item label="应用档位">
            <el-input-number v-model="formData.app_tier" :min="1" :max="5" placeholder="请选择档位" />
          </el-form-item>
          <el-form-item label="开发模式">
            <el-input v-model="formData.dev_mode" placeholder="请输入开发模式" />
          </el-form-item>
          <el-form-item label="运维模式">
            <el-input v-model="formData.ops_mode" placeholder="请输入运维模式" />
          </el-form-item>
          <el-form-item label="开发负责人">
            <el-input v-model="formData.dev_owner" placeholder="请输入开发负责人" />
          </el-form-item>
          <el-form-item label="开发团队">
            <el-input v-model="formData.dev_team" placeholder="请输入开发团队" />
          </el-form-item>
          <el-form-item label="运维负责人">
            <el-input v-model="formData.ops_owner" placeholder="请输入运维负责人" />
          </el-form-item>
          <el-form-item label="运维团队">
            <el-input v-model="formData.ops_team" placeholder="请输入运维团队" />
          </el-form-item>
        </el-tab-pane>

        <!-- 其他信息 -->
        <el-tab-pane label="其他信息" name="other">
          <el-form-item label="域名化改造">
            <el-switch v-model="formData.is_domain_transformation_completed" active-text="完成" inactive-text="未完成" />
          </el-form-item>
          <el-form-item label="DBPM改造">
            <el-switch v-model="formData.is_dbpm_transformation_completed" active-text="完成" inactive-text="未完成" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="formData.notes"
              type="textarea"
              :rows="4"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    <template #footer>
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <el-button type="danger" @click="handleDelete">删除应用</el-button>
        <div>
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="loading">
            保存
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Application } from '@/api/applications'

interface ApplicationEditForm {
  l2_id: string
  app_name: string
  overall_transformation_target: string
  dev_owner: string
  dev_team: string
  ops_owner: string
  ops_team: string
  current_status: string
  ak_supervision_acceptance_year: number
  app_tier?: number
  belonging_l1_name: string
  belonging_projects: string
  belonging_kpi: string
  acceptance_status: string
  dev_mode: string
  ops_mode: string
  is_domain_transformation_completed: boolean
  is_dbpm_transformation_completed: boolean
  notes: string
  // Plan dates
  planned_requirement_date?: string
  planned_release_date?: string
  planned_tech_online_date?: string
  planned_biz_online_date?: string
  // Actual dates
  actual_requirement_date?: string
  actual_release_date?: string
  actual_tech_online_date?: string
  actual_biz_online_date?: string
}

const props = defineProps<{
  modelValue: boolean
  data: Partial<Application>
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [formData: ApplicationEditForm]
  'delete': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('basic')

// Initialize form data
const formData = ref<ApplicationEditForm>({
  l2_id: '',
  app_name: '',
  overall_transformation_target: 'AK',
  dev_owner: '',
  dev_team: '',
  ops_owner: '',
  ops_team: '',
  current_status: '待启动',
  ak_supervision_acceptance_year: 2025,
  app_tier: undefined,
  belonging_l1_name: '',
  belonging_projects: '',
  belonging_kpi: '',
  acceptance_status: '',
  dev_mode: '',
  ops_mode: '',
  is_domain_transformation_completed: false,
  is_dbpm_transformation_completed: false,
  notes: ''
})

// Watch for data prop changes and update form
watch(() => props.data, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    formData.value = {
      l2_id: newData.l2_id || '',
      app_name: newData.app_name || '',
      overall_transformation_target: newData.overall_transformation_target || 'AK',
      dev_owner: newData.dev_owner || '',
      dev_team: newData.dev_team || '',
      ops_owner: newData.ops_owner || '',
      ops_team: newData.ops_team || '',
      current_status: newData.current_status || '待启动',
      ak_supervision_acceptance_year: newData.ak_supervision_acceptance_year || 2025,
      app_tier: newData.app_tier,
      belonging_l1_name: newData.belonging_l1_name || '',
      belonging_projects: newData.belonging_projects || '',
      belonging_kpi: newData.belonging_kpi || '',
      acceptance_status: newData.acceptance_status || '',
      dev_mode: newData.dev_mode || '',
      ops_mode: newData.ops_mode || '',
      is_domain_transformation_completed: newData.is_domain_transformation_completed || false,
      is_dbpm_transformation_completed: newData.is_dbpm_transformation_completed || false,
      notes: newData.notes || '',
      // Plan dates
      planned_requirement_date: newData.planned_requirement_date || '',
      planned_release_date: newData.planned_release_date || '',
      planned_tech_online_date: newData.planned_tech_online_date || '',
      planned_biz_online_date: newData.planned_biz_online_date || '',
      // Actual dates
      actual_requirement_date: newData.actual_requirement_date || '',
      actual_release_date: newData.actual_release_date || '',
      actual_tech_online_date: newData.actual_tech_online_date || '',
      actual_biz_online_date: newData.actual_biz_online_date || ''
    }
  }
}, { immediate: true })

const handleSave = () => {
  if (!formData.value.app_name) {
    return
  }
  emit('save', formData.value)
}

const handleDelete = () => {
  emit('delete')
}

const handleClose = () => {
  visible.value = false
  activeTab.value = 'basic'
}
</script>

<style scoped>
/* No additional styles needed - inherit from parent */
</style>
