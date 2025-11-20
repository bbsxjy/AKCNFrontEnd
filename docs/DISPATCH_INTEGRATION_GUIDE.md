# 应用派发功能 - ApplicationsView.vue 修改指南

##  1. 在导入部分添加DispatchDialog（约第957行之后）

```typescript
import PlanHistoryDialog from '@/components/applications/dialogs/PlanHistoryDialog.vue'
import ApplicationsTable from '@/components/applications/ApplicationsTable.vue'
import DispatchDialog from '@/components/common/DispatchDialog.vue'  // 添加这一行
```

## 2. 在状态变量部分添加派发相关状态（约第1010行之后）

```typescript
const selectedApplications = ref<Application[]>([])
const showDispatchDialog = ref(false)  // 添加这一行
```

## 3. 在template的header actions部分添加批量派发按钮（约第8-19行）

```html
<div class="actions">
  <!-- 添加批量派发按钮 -->
  <el-button
    type="success"
    @click="showDispatchDialog = true"
    v-if="mainTab === 'applications' && selectedApplications.length > 0"
    :disabled="selectedApplications.length === 0"
  >
    <el-icon><upload /></el-icon>
    批量派发 ({{ selectedApplications.length }})
  </el-button>

  <el-button type="primary" @click="showCreateDialog = true" v-if="mainTab === 'applications'">
    <el-icon><plus /></el-icon>
    新增应用
  </el-button>
  <el-button type="success" @click="goToImport" v-if="mainTab === 'applications'">
    <el-icon><upload /></el-icon>
    批量导入
  </el-button>
  <el-button type="warning" @click="mainTab === 'applications' ? exportExcel() : exportSubTasksExcel()">
    <el-icon><download /></el-icon>
    导出Excel
  </el-button>
</div>
```

## 4. 在template末尾添加DispatchDialog组件（约第924行之前）

```html
    <!-- Dispatch Dialog -->
    <DispatchDialog
      v-model="showDispatchDialog"
      :application-ids="selectedApplications.map(app => app.id)"
      :applications="allApplications"
      @success="handleDispatchSuccess"
    />

  </div>
</template>
```

## 5. 在script setup中添加handleDispatchSuccess函数（约第2080行之后）

```typescript
const handleSelectionChange = (selection: Application[]) => {
  selectedApplications.value = selection
}

// 添加派发成功处理函数
const handleDispatchSuccess = async () => {
  // 清空选择
  selectedApplications.value = []
  // 刷新应用列表
  await loadApplications()
  ElMessage.success('派发成功！')
}
```

## 6. 完成后的效果

- ✅ 用户可以在应用列表中多选应用
- ✅ 选中后会显示"批量派发"按钮，显示选中数量
- ✅ 点击后弹出派发对话框
- ✅ 可以选择派发给开发负责人或运维负责人
- ✅ 派发后会发送系统通知
- ✅ 派发的任务会出现在对应人员的"我的任务"中

## 注意事项

1. 确保已经创建了 `DispatchDialog.vue` 组件文件
2. 确保已经创建了 `dispatch.ts` API文件
3. 后端需要实现 `/applications/dispatch` 接口
4. 后端需要支持根据派发更新应用的 dev_owner 或 ops_owner 字段
5. 后端需要更新相关子任务的 assigned_to 字段
