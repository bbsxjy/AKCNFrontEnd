<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="header">
          <h2>用户管理</h2>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><plus /></el-icon>
            添加用户
          </el-button>
        </div>
      </template>

      <!-- Search and Filter -->
      <div class="filter-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名、姓名或邮箱"
          clearable
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="filterRole"
          placeholder="角色"
          clearable
          style="width: 150px"
          @change="loadUsers"
        >
          <el-option label="全部角色" value="" />
          <el-option label="管理员" value="admin" />
          <el-option label="经理" value="manager" />
          <el-option label="编辑者" value="editor" />
          <el-option label="查看者" value="viewer" />
        </el-select>

        <el-select
          v-model="filterStatus"
          placeholder="状态"
          clearable
          style="width: 150px"
          @change="loadUsers"
        >
          <el-option label="全部状态" value="" />
          <el-option label="激活" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>

        <el-button @click="resetFilters">重置</el-button>
      </div>

      <!-- Batch Operations Bar -->
      <div v-if="selectedUsers.length > 0" class="batch-operations-bar">
        <span class="selected-count">已选择 {{ selectedUsers.length }} 个用户</span>
        <el-button-group>
          <el-button size="small" @click="showBatchRoleDialog">批量设置角色</el-button>
          <el-button size="small" @click="showBatchDepartmentDialog">批量设置部门</el-button>
          <el-button size="small" @click="showBatchTeamDialog">批量设置团队</el-button>
          <el-button size="small" type="success" @click="handleBatchActivate">批量激活</el-button>
          <el-button size="small" type="danger" @click="handleBatchDeactivate">批量停用</el-button>
        </el-button-group>
        <el-button size="small" type="info" @click="clearSelection">清空选择</el-button>
      </div>

      <!-- User Table -->
      <el-table
        ref="userTableRef"
        :data="users"
        v-loading="loading"
        stripe
        style="width: 100%; margin-top: 20px"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" :selectable="isSelectable" />
        <el-table-column prop="employee_id" label="工号" width="120" />
        <el-table-column prop="full_name" label="姓名" width="150" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="220" />
        <el-table-column prop="department" label="部门" width="150" />
        <el-table-column prop="team" label="团队" width="120" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ getRoleDisplayName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              @change="handleStatusChange(row)"
              :disabled="row.id === currentUserId"
            />
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.last_login) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="showEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              size="small"
              link
              @click="showRoleDialog(row)"
            >
              角色
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
              :disabled="row.id === currentUserId"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: center"
        @size-change="loadUsers"
        @current-change="loadUsers"
      />
    </el-card>

    <!-- Create/Edit User Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '添加用户' : '编辑用户'"
      width="600px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="工号" prop="employee_id">
          <el-input v-model="userForm.employee_id" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="userForm.full_name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="userForm.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="团队" prop="team">
          <el-input v-model="userForm.team" placeholder="请输入团队" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="经理" value="manager" />
            <el-option label="编辑者" value="editor" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Change Role Dialog -->
    <el-dialog v-model="roleDialogVisible" title="修改角色" width="400px">
      <el-form label-width="80px">
        <el-form-item label="用户">
          <span>{{ selectedUser?.full_name }} ({{ selectedUser?.username }})</span>
        </el-form-item>
        <el-form-item label="当前角色">
          <el-tag :type="getRoleTagType(selectedUser?.role || 'viewer')">
            {{ getRoleDisplayName(selectedUser?.role || 'viewer') }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新角色">
          <el-select v-model="newRole" placeholder="选择新角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="经理" value="manager" />
            <el-option label="编辑者" value="editor" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRoleChange" :loading="submitting">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- Batch Update Role Dialog -->
    <el-dialog
      v-model="batchRoleDialogVisible"
      title="批量设置角色"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="选择角色">
          <el-select v-model="batchRole" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="经理" value="manager" />
            <el-option label="编辑者" value="editor" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #title>
            <div>将为 <strong>{{ selectedUsers.length }}</strong> 个用户设置角色为：<strong>{{ getRoleDisplayName(batchRole) }}</strong></div>
            <div style="margin-top: 8px; font-size: 12px;">注意：不会修改您自己的角色</div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="batchRoleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchRoleUpdate" :loading="submitting">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- Batch Update Department Dialog -->
    <el-dialog
      v-model="batchDepartmentDialogVisible"
      title="批量设置部门"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="部门名称">
          <el-input v-model="batchDepartment" placeholder="请输入部门名称" />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #title>
            <div>将为 <strong>{{ selectedUsers.length }}</strong> 个用户设置部门为：<strong>{{ batchDepartment || '(未填写)' }}</strong></div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="batchDepartmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchDepartmentUpdate" :loading="submitting" :disabled="!batchDepartment">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- Batch Update Team Dialog -->
    <el-dialog
      v-model="batchTeamDialogVisible"
      title="批量设置团队"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="团队名称">
          <el-input v-model="batchTeam" placeholder="请输入团队名称" />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #title>
            <div>将为 <strong>{{ selectedUsers.length }}</strong> 个用户设置团队为：<strong>{{ batchTeam || '(未填写)' }}</strong></div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="batchTeamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchTeamUpdate" :loading="submitting" :disabled="!batchTeam">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { UsersAPI, type User, type CreateUserRequest, type UpdateUserRequest } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { getRoleDisplayName as getPermissionRoleDisplayName } from '@/utils/permissions'

const authStore = useAuthStore()

// Data
const users = ref<User[]>([])
const loading = ref(false)
const submitting = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Filters
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref<boolean | ''>('')

// Dialog
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const userFormRef = ref<FormInstance>()
const userForm = ref<CreateUserRequest & { id?: number }>({
  employee_id: '',
  username: '',
  full_name: '',
  email: '',
  department: '',
  team: '',
  role: 'viewer',
  is_active: true
})

// Role Dialog
const roleDialogVisible = ref(false)
const selectedUser = ref<User | null>(null)
const newRole = ref<'admin' | 'manager' | 'editor' | 'viewer'>('viewer')

// Batch Operations
const userTableRef = ref()
const selectedUsers = ref<User[]>([])
const batchRoleDialogVisible = ref(false)
const batchDepartmentDialogVisible = ref(false)
const batchTeamDialogVisible = ref(false)
const batchRole = ref<'admin' | 'manager' | 'editor' | 'viewer'>('viewer')
const batchDepartment = ref('')
const batchTeam = ref('')

// Current user ID (to prevent self-modification)
const currentUserId = computed(() => authStore.user?.id)

// Form validation rules
const userFormRules: FormRules = {
  employee_id: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  full_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  department: [{ required: true, message: '请输入部门', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

// Methods
const loadUsers = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      role: filterRole.value || undefined,
      is_active: filterStatus.value !== '' ? filterStatus.value : undefined,
      search: searchQuery.value || undefined
    }

    const response = await UsersAPI.getUsers(params)
    users.value = response.items || []
    total.value = response.total || 0
  } catch (error) {
    console.error('Failed to load users:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const resetFilters = () => {
  searchQuery.value = ''
  filterRole.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  loadUsers()
}

const showCreateDialog = () => {
  dialogMode.value = 'create'
  userForm.value = {
    employee_id: '',
    username: '',
    full_name: '',
    email: '',
    department: '',
    team: '',
    role: 'viewer',
    is_active: true
  }
  dialogVisible.value = true
}

const showEditDialog = (user: User) => {
  dialogMode.value = 'edit'
  userForm.value = {
    id: user.id,
    employee_id: user.employee_id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    department: user.department,
    team: user.team,
    role: user.role,
    is_active: user.is_active
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!userFormRef.value) return

  await userFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submitting.value = true

      if (dialogMode.value === 'create') {
        await UsersAPI.createUser(userForm.value)
        ElMessage.success('用户创建成功')
      } else {
        const { id, ...updateData } = userForm.value
        if (id) {
          await UsersAPI.updateUser(id, updateData as UpdateUserRequest)
          ElMessage.success('用户更新成功')
        }
      }

      dialogVisible.value = false
      loadUsers()
    } catch (error: any) {
      console.error('Failed to save user:', error)
      ElMessage.error(error.response?.data?.detail || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const showRoleDialog = (user: User) => {
  selectedUser.value = user
  newRole.value = user.role
  roleDialogVisible.value = true
}

const handleRoleChange = async () => {
  if (!selectedUser.value) return

  try {
    submitting.value = true
    await UsersAPI.updateUserRole(selectedUser.value.id, newRole.value)
    ElMessage.success('角色修改成功')
    roleDialogVisible.value = false
    loadUsers()
  } catch (error: any) {
    console.error('Failed to change role:', error)
    ElMessage.error(error.response?.data?.detail || '角色修改失败')
  } finally {
    submitting.value = false
  }
}

const handleStatusChange = async (user: User) => {
  try {
    await UsersAPI.toggleUserStatus(user.id, user.is_active)
    ElMessage.success(user.is_active ? '用户已激活' : '用户已停用')
    loadUsers()
  } catch (error: any) {
    console.error('Failed to toggle user status:', error)
    ElMessage.error('状态修改失败')
    // Revert the change
    user.is_active = !user.is_active
  }
}

const handleDelete = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.full_name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await UsersAPI.deleteUser(user.id)
    ElMessage.success('用户删除成功')
    loadUsers()
  } catch (error: any) {
    if (error === 'cancel') return
    console.error('Failed to delete user:', error)
    ElMessage.error(error.response?.data?.detail || '删除失败')
  }
}

const getRoleTagType = (role: string) => {
  const roleTypeMap: Record<string, string> = {
    admin: 'danger',
    manager: 'warning',
    editor: 'success',
    viewer: 'info'
  }
  return roleTypeMap[role] || 'info'
}

const getRoleDisplayName = (role: string) => {
  return getPermissionRoleDisplayName(role as 'admin' | 'manager' | 'editor' | 'viewer')
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN')
}

// Batch Operations Methods
const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

const isSelectable = (row: User) => {
  // 防止选择当前用户自己
  return row.id !== currentUserId.value
}

const clearSelection = () => {
  userTableRef.value?.clearSelection()
  selectedUsers.value = []
}

const showBatchRoleDialog = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  batchRole.value = 'viewer'
  batchRoleDialogVisible.value = true
}

const showBatchDepartmentDialog = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  batchDepartment.value = ''
  batchDepartmentDialogVisible.value = true
}

const showBatchTeamDialog = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  batchTeam.value = ''
  batchTeamDialogVisible.value = true
}

const handleBatchRoleUpdate = async () => {
  try {
    submitting.value = true
    const user_ids = selectedUsers.value.map(u => u.id)

    const result = await UsersAPI.batchUpdateRole({
      user_ids,
      role: batchRole.value
    })

    ElMessage.success(result.message || `批量更新成功: ${result.success_count}个成功`)

    if (result.failed_count > 0) {
      ElMessage.warning(`有 ${result.failed_count} 个用户更新失败`)
    }

    batchRoleDialogVisible.value = false
    clearSelection()
    loadUsers()
  } catch (error: any) {
    console.error('Batch update role failed:', error)
    ElMessage.error(error.response?.data?.detail || '批量更新角色失败')
  } finally {
    submitting.value = false
  }
}

const handleBatchDepartmentUpdate = async () => {
  try {
    submitting.value = true
    const user_ids = selectedUsers.value.map(u => u.id)

    const result = await UsersAPI.batchUpdateDepartment({
      user_ids,
      department: batchDepartment.value
    })

    ElMessage.success(result.message || `批量更新成功: ${result.success_count}个成功`)

    if (result.failed_count > 0) {
      ElMessage.warning(`有 ${result.failed_count} 个用户更新失败`)
    }

    batchDepartmentDialogVisible.value = false
    clearSelection()
    loadUsers()
  } catch (error: any) {
    console.error('Batch update department failed:', error)
    ElMessage.error(error.response?.data?.detail || '批量更新部门失败')
  } finally {
    submitting.value = false
  }
}

const handleBatchTeamUpdate = async () => {
  try {
    submitting.value = true
    const user_ids = selectedUsers.value.map(u => u.id)

    const result = await UsersAPI.batchUpdateTeam({
      user_ids,
      team: batchTeam.value
    })

    ElMessage.success(result.message || `批量更新成功: ${result.success_count}个成功`)

    if (result.failed_count > 0) {
      ElMessage.warning(`有 ${result.failed_count} 个用户更新失败`)
    }

    batchTeamDialogVisible.value = false
    clearSelection()
    loadUsers()
  } catch (error: any) {
    console.error('Batch update team failed:', error)
    ElMessage.error(error.response?.data?.detail || '批量更新团队失败')
  } finally {
    submitting.value = false
  }
}

const handleBatchActivate = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要激活选中的 ${selectedUsers.value.length} 个用户吗？`,
      '批量激活',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    )

    submitting.value = true
    const user_ids = selectedUsers.value.map(u => u.id)

    const result = await UsersAPI.batchUpdateStatus({
      user_ids,
      is_active: true
    })

    ElMessage.success(result.message || `批量激活成功: ${result.success_count}个成功`)

    if (result.failed_count > 0) {
      ElMessage.warning(`有 ${result.failed_count} 个用户激活失败`)
    }

    clearSelection()
    loadUsers()
  } catch (error: any) {
    if (error === 'cancel') return
    console.error('Batch activate failed:', error)
    ElMessage.error(error.response?.data?.detail || '批量激活失败')
  } finally {
    submitting.value = false
  }
}

const handleBatchDeactivate = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要停用选中的 ${selectedUsers.value.length} 个用户吗？停用后用户将无法登录系统。`,
      '批量停用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    submitting.value = true
    const user_ids = selectedUsers.value.map(u => u.id)

    const result = await UsersAPI.batchUpdateStatus({
      user_ids,
      is_active: false
    })

    ElMessage.success(result.message || `批量停用成功: ${result.success_count}个成功`)

    if (result.failed_count > 0) {
      ElMessage.warning(`有 ${result.failed_count} 个用户停用失败`)
    }

    clearSelection()
    loadUsers()
  } catch (error: any) {
    if (error === 'cancel') return
    console.error('Batch deactivate failed:', error)
    ElMessage.error(error.response?.data?.detail || '批量停用失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
.user-management {
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .filter-bar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .batch-operations-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .selected-count {
      font-size: 14px;
      color: #2d3748;
      font-weight: 600;
      margin-right: 16px;
    }

    .el-button-group {
      flex: 1;
      display: flex;
      gap: 8px;
      justify-content: center;
    }
  }
}
</style>
