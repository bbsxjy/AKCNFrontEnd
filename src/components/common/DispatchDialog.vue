<template>
  <el-dialog
    v-model="visible"
    title="派发应用任务"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="120px" ref="formRef" :rules="rules">
      <el-form-item label="派发方式" prop="assignee_type">
        <el-radio-group v-model="form.assignee_type">
          <el-radio value="dev">开发负责人</el-radio>
          <el-radio value="ops">运维负责人</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="派发给" prop="assignee_name">
        <el-select
          v-model="form.assignee_name"
          placeholder="请选择或输入人员姓名"
          filterable
          allow-create
          default-first-option
          style="width: 100%"
        >
          <el-option
            v-for="person in assigneeOptions"
            :key="person"
            :label="person"
            :value="person"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="派发说明">
        <el-input
          v-model="form.message"
          type="textarea"
          :rows="4"
          placeholder="请输入派发说明（选填）"
        />
      </el-form-item>

      <el-form-item label="派发应用">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>
            <div class="dispatch-summary">
              <span>将派发 <strong>{{ applicationIds.length }}</strong> 个应用</span>
            </div>
          </template>
          <ul class="application-list">
            <li v-for="app in previewApplications" :key="app.id">
              {{ app.l2_id }} - {{ app.app_name }}
            </li>
          </ul>
        </el-alert>
      </el-form-item>

      <el-form-item label="派发后操作">
        <el-checkbox v-model="form.notify">发送系统通知</el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading">
        确认派发
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { DispatchAPI } from '@/api/dispatch'
import type { Application } from '@/api/applications'

interface Props {
  modelValue: boolean
  applicationIds: number[]
  applications: Application[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref({
  assignee_type: 'dev' as 'dev' | 'ops',
  assignee_name: '测试管理员',  // 默认值
  message: '',
  notify: true
})

const rules: FormRules = {
  assignee_type: [
    { required: true, message: '请选择派发方式', trigger: 'change' }
  ],
  assignee_name: [
    { required: true, message: '请选择或输入派发人员', trigger: 'change' }
  ]
}

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 根据已选应用获取可派发的人员列表
const assigneeOptions = computed(() => {
  const type = form.value.assignee_type
  const options = new Set<string>()

  // 添加默认测试管理员
  options.add('测试管理员')

  props.applications.forEach(app => {
    if (props.applicationIds.includes(app.id)) {
      const person = type === 'dev' ? app.dev_owner : app.ops_owner
      if (person && person !== '待分配') {
        options.add(person)
      }
    }
  })

  return Array.from(options).sort()
})

// 预览将要派发的应用
const previewApplications = computed(() => {
  return props.applications
    .filter(app => props.applicationIds.includes(app.id))
    .slice(0, 5) // 最多显示5个
})

// 当派发方式改变时，重置为默认值
watch(() => form.value.assignee_type, () => {
  form.value.assignee_name = '测试管理员'
})

const handleClose = () => {
  visible.value = false
  formRef.value?.resetFields()
  form.value.assignee_name = '测试管理员'
  form.value.message = ''
}

const handleConfirm = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    loading.value = true

    const response = await DispatchAPI.dispatchApplications({
      application_ids: props.applicationIds,
      assignee_name: form.value.assignee_name,
      assignee_type: form.value.assignee_type,
      message: form.value.message || undefined
    })

    // 显示详细的成功信息
    const assigneeType = form.value.assignee_type === 'dev' ? '开发' : '运维'
    const successMsg = [
      `✅ 成功派发 ${response.success} 个应用`,
      `👤 ${assigneeType}负责人: ${form.value.assignee_name}`,
      response.notification_sent ? '📧 已发送系统通知' : ''
    ].filter(Boolean).join(' | ')

    ElMessage({
      type: 'success',
      message: successMsg,
      duration: 6000,
      showClose: true,
      customClass: 'dispatch-success-message'
    })

    // 如果是派发给当前登录用户，额外提示
    console.log(`💡 提示: ${form.value.assignee_name} 可在"我的任务"页面查看新分配的任务`)

    handleClose()
    emit('success')
  } catch (error: any) {
    console.error('Failed to dispatch applications:', error)
    ElMessage.error(error.message || '派发失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dispatch-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dispatch-summary strong {
  color: #667eea;
  font-size: 16px;
}

.application-list {
  margin: 10px 0 0 20px;
  color: #4a5568;
  max-height: 150px;
  overflow-y: auto;
}

.application-list li {
  margin-bottom: 5px;
  font-size: 14px;
}
</style>
