<template>
  <el-dialog
    v-model="visible"
    title="分配任务"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="应用">
        <span>{{ application?.app_name }} ({{ application?.l2_id }})</span>
      </el-form-item>

      <el-form-item label="分配给" prop="assigned_to_user_id">
        <el-select
          v-model="formData.assigned_to_user_id"
          placeholder="选择用户"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="user in availableUsers"
            :key="user.id"
            :label="`${user.full_name} (${user.username})`"
            :value="user.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="任务类型" prop="task_type">
        <el-select v-model="formData.task_type" placeholder="选择任务类型" style="width: 100%">
          <el-option label="更新进度" value="update_progress" />
          <el-option label="解决阻塞" value="fix_blocking" />
          <el-option label="完成里程碑" value="complete_milestone" />
          <el-option label="其他" value="general" />
        </el-select>
      </el-form-item>

      <el-form-item label="任务标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入任务标题" />
      </el-form-item>

      <el-form-item label="任务描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入任务描述"
        />
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-select v-model="formData.priority" placeholder="选择优先级" style="width: 100%">
          <el-option label="低" value="low" />
          <el-option label="中" value="medium" />
          <el-option label="高" value="high" />
          <el-option label="紧急" value="urgent" />
        </el-select>
      </el-form-item>

      <el-form-item label="截止日期" prop="due_date">
        <el-date-picker
          v-model="formData.due_date"
          type="date"
          placeholder="选择截止日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        分配任务
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { TaskAssignmentsAPI, type CreateTaskAssignmentRequest } from '@/api/tasks'
import { UsersAPI, type User } from '@/api/users'

interface Props {
  modelValue: boolean
  application: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(false)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const availableUsers = ref<User[]>([])

const formData = ref<CreateTaskAssignmentRequest>({
  application_id: 0,
  assigned_to_user_id: 0,
  task_type: 'update_progress',
  title: '',
  description: '',
  priority: 'medium',
  due_date: undefined
})

const formRules: FormRules = {
  assigned_to_user_id: [
    { required: true, message: '请选择分配对象', trigger: 'change' }
  ],
  task_type: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal && props.application) {
    formData.value.application_id = props.application.id
    // Auto-generate title based on task type
    generateTaskTitle()
  }
})

watch(() => formData.value.task_type, () => {
  generateTaskTitle()
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

const generateTaskTitle = () => {
  if (!props.application) return

  const taskTypeTitles: Record<string, string> = {
    'update_progress': `请更新 ${props.application.app_name} 的改造进度`,
    'fix_blocking': `请解决 ${props.application.app_name} 的阻塞问题`,
    'complete_milestone': `请完成 ${props.application.app_name} 的里程碑任务`,
    'general': `${props.application.app_name} - 任务`
  }

  if (formData.value.task_type) {
    formData.value.title = taskTypeTitles[formData.value.task_type] || ''
  }
}

const loadUsers = async () => {
  try {
    const response = await UsersAPI.getUsers({ is_active: true, page_size: 100 })
    availableUsers.value = response.items || []
  } catch (error) {
    console.error('Failed to load users:', error)
    ElMessage.error('加载用户列表失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submitting.value = true
      await TaskAssignmentsAPI.createTaskAssignment(formData.value)
      ElMessage.success('任务分配成功，已发送通知')
      emit('success')
      handleClose()
    } catch (error: any) {
      console.error('Failed to assign task:', error)
      ElMessage.error(error.response?.data?.detail || '任务分配失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleClose = () => {
  formRef.value?.resetFields()
  visible.value = false
}

onMounted(() => {
  loadUsers()
})
</script>
