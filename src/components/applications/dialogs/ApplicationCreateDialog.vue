<template>
  <el-dialog v-model="visible" title="新增应用" width="700px" @close="handleClose">
    <el-form :model="formData" label-width="120px">
      <el-form-item label="L2 ID" required>
        <el-input v-model="formData.l2_id" placeholder="如：CI000001" />
      </el-form-item>
      <el-form-item label="应用名称" required>
        <el-input v-model="formData.app_name" placeholder="请输入应用名称" />
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
      <el-form-item label="改造目标" required>
        <el-radio-group v-model="formData.overall_transformation_target">
          <el-radio value="AK">AK</el-radio>
          <el-radio value="云原生">云原生</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="监管验收年份">
        <el-select v-model="formData.ak_supervision_acceptance_year" placeholder="请选择年份">
          <el-option :value="2025" label="2025年" />
          <el-option :value="2026" label="2026年" />
          <el-option :value="2027" label="2027年" />
        </el-select>
      </el-form-item>
      <el-form-item label="开发团队">
        <el-input v-model="formData.dev_team" placeholder="请输入开发团队" />
      </el-form-item>
      <el-form-item label="开发负责人">
        <el-input v-model="formData.dev_owner" placeholder="请输入开发负责人" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleCreate" :loading="loading">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface ApplicationCreateForm {
  l2_id: string
  app_name: string
  dev_owner: string
  dev_team: string
  current_status: string
  ak_supervision_acceptance_year: number
  overall_transformation_target: string
  belonging_l1_name: string
  belonging_projects: string
  belonging_kpi: string
}

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [formData: ApplicationCreateForm]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Initialize form data with defaults
const formData = ref<ApplicationCreateForm>({
  l2_id: '',
  app_name: '',
  dev_owner: '',
  dev_team: '',
  current_status: '待启动',
  ak_supervision_acceptance_year: 2025,
  overall_transformation_target: 'AK',
  belonging_l1_name: '',
  belonging_projects: '',
  belonging_kpi: ''
})

// Reset form when dialog closes
watch(visible, (newVal) => {
  if (!newVal) {
    // Reset form after dialog animation completes
    setTimeout(() => {
      formData.value = {
        l2_id: '',
        app_name: '',
        dev_owner: '',
        dev_team: '',
        current_status: '待启动',
        ak_supervision_acceptance_year: 2025,
        overall_transformation_target: 'AK',
        belonging_l1_name: '',
        belonging_projects: '',
        belonging_kpi: ''
      }
    }, 300)
  }
})

const handleCreate = () => {
  if (!formData.value.l2_id || !formData.value.app_name) {
    return
  }
  emit('create', formData.value)
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
/* No additional styles needed - inherit from parent */
</style>
