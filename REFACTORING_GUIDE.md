# ApplicationsView.vue 重构指南

## 概述

ApplicationsView.vue 当前有超过5000行代码，严重影响可读性和可维护性。本文档提供了分步重构指南。

## 已完成的工作

### 1. Composables 提取 ✅

已创建以下composables来提取可复用的逻辑：

- **`src/composables/applications/useFormatters.ts`**
  - 日期格式化（formatDate, formatYearMonth, formatShortDate）
  - 字段值格式化（formatFieldValue）
  - 字段标签获取（getFieldLabel, getAdjustmentFieldLabel, getDelayPhaseLabel）

- **`src/composables/applications/useStatusHelpers.ts`**
  - 状态类型获取（getStatusType, getSubTaskStatusType）
  - 进度条颜色（getProgressColor, getSubTaskProgressColor）
  - 进度计算（calculateSubTaskProgress）
  - 审计操作相关（getOperationType, getOperationText）
  - 阶段状态相关（getPhaseStatusClass, getPhaseStatusText, getStatusTagType）
  - 详细阶段信息（getDetailedPhaseText, getPhaseColorClass）

- **`src/composables/applications/useDelayCalculations.ts`**
  - 日期差值计算（calculateDaysDiff, calculateMonthsDiff）
  - 延期类型判断（getDelayType）
  - 延期次数计算（getDelayCount）
  - 子任务延期信息（getSubTaskDelayInfo）
  - 日期对比样式（getDateComparisonClass）
  - 工作天数计算（getSubTaskWorkingDays）
  - 总延期天数（calculateTotalDelayDays）

### 2. 对话框组件提取 ✅

已创建以下对话框组件作为示例：

- **`src/components/applications/dialogs/SubTaskDetailDialog.vue`**
  - 子任务详情对话框
  - 包含6个标签页：基础信息、团队信息、时间进度、运营状态、延期分析、其他信息
  - 使用composables进行逻辑复用
  - 完全独立的组件，可直接在主视图中引用

## 待完成的重构任务

### 第一阶段：完成对话框组件提取

#### 1. ApplicationDetailDialog.vue（优先级：高）
```vue
// 文件路径：src/components/applications/dialogs/ApplicationDetailDialog.vue
// 功能：应用详情对话框
// 包含标签页：
//   - 基础信息
//   - 团队信息
//   - 时间进度
//   - 进度状态
//   - 其他信息
//   - 操作记录（包含审计日志和回滚功能）
```

#### 2. DelayDetailsDialog.vue（优先级：高）
```vue
// 文件路径：src/components/applications/dialogs/DelayDetailsDialog.vue
// 功能：延期详情对话框
// 包含：
//   - 延期统计汇总
//   - 延期历史时间线
//   - 各阶段延期统计表格
//   - 延期原因分析
```

#### 3. PlanHistoryDialog.vue（优先级：中）
```vue
// 文件路径：src/components/applications/dialogs/PlanHistoryDialog.vue
// 功能：计划调整历史对话框
// 包含：
//   - 调整统计汇总
//   - 时间线对比视图
//   - 调整明细表格
```

#### 4. ApplicationEditDialog.vue（优先级：中）
```vue
// 文件路径：src/components/applications/dialogs/ApplicationEditDialog.vue
// 功能：应用编辑对话框
// 包含标签页：
//   - 基础信息
//   - 团队信息
//   - 其他信息
```

#### 5. ApplicationCreateDialog.vue（优先级：低）
```vue
// 文件路径：src/components/applications/dialogs/ApplicationCreateDialog.vue
// 功能：应用创建对话框
// 包含表单字段：
//   - L2 ID
//   - 应用名称
//   - 所属L1/项目/指标
//   - 改造目标
//   - 监管验收年份
//   - 开发团队和负责人
```

### 第二阶段：提取表格组件

#### 1. ApplicationsTable.vue（优先级：高）
```vue
// 文件路径：src/components/applications/tables/ApplicationsTable.vue
// 功能：应用列表表格
// Props:
//   - applications: Application[]
//   - loading: boolean
//   - favoriteIds: Set<number>
// Emits:
//   - selection-change
//   - toggle-favorite
//   - show-detail
//   - show-delay-details
//   - edit
//   - view-subtasks
```

#### 2. SubTasksTable.vue（优先级：高）
```vue
// 文件路径：src/components/applications/tables/SubTasksTable.vue
// 功能：子任务列表表格
// Props:
//   - subtasks: SubTask[]
//   - loading: boolean
//   - favoriteIds: Set<number>
//   - allApplications: Application[]
// Emits:
//   - selection-change
//   - toggle-favorite
//   - show-detail
//   - show-delay-details
//   - edit
```

### 第三阶段：提取筛选区域组件

#### 1. ApplicationFilters.vue（优先级：中）
```vue
// 文件路径：src/components/applications/filters/ApplicationFilters.vue
// 功能：应用筛选区域
// 包含：
//   - 关键词搜索
//   - 改造目标筛选
//   - 改造进度筛选
//   - 监管验收年份筛选
//   - 高级筛选（可折叠）
//   - 重置按钮
// Props:
//   - searchForm: Object
//   - filterOptions: Object
// Emits:
//   - update:search-form
//   - reset
```

#### 2. SubTaskFilters.vue（优先级：中）
```vue
// 文件路径：src/components/applications/filters/SubTaskFilters.vue
// 功能：子任务筛选区域
// 包含：
//   - 关键词搜索
//   - 所属应用筛选
//   - 改造目标筛选
//   - 高级筛选（可折叠）
//   - 重置按钮
// Props:
//   - searchForm: Object
//   - filterOptions: Object
//   - allApplications: Application[]
// Emits:
//   - update:search-form
//   - reset
```

### 第四阶段：创建额外的Composables

#### 1. useApplicationData.ts
```typescript
// 文件路径：src/composables/applications/useApplicationData.ts
// 功能：应用数据管理相关逻辑
// 包含：
//   - 加载应用数据
//   - 创建/更新/删除应用
//   - 导出应用数据
//   - 月度计划导出
```

#### 2. useSubTaskData.ts
```typescript
// 文件路径：src/composables/applications/useSubTaskData.ts
// 功能：子任务数据管理相关逻辑
// 包含：
//   - 加载子任务数据
//   - 创建/更新/删除子任务
//   - 导出子任务数据
```

#### 3. useFavorites.ts
```typescript
// 文件路径：src/composables/applications/useFavorites.ts
// 功能：收藏管理相关逻辑
// 包含：
//   - 加载收藏列表
//   - 切换收藏状态
//   - 保存收藏到localStorage
```

#### 4. useAuditOperations.ts
```typescript
// 文件路径：src/composables/applications/useAuditOperations.ts
// 功能：审计操作相关逻辑
// 包含：
//   - 加载审计记录
//   - 回滚操作
//   - 检查回滚权限
```

## 重构步骤建议

### 第一步：集成现有Composables

在 `ApplicationsView.vue` 顶部引入已创建的composables：

```typescript
import { useFormatters } from '@/composables/applications/useFormatters'
import { useStatusHelpers } from '@/composables/applications/useStatusHelpers'
import { useDelayCalculations } from '@/composables/applications/useDelayCalculations'

const {
  formatDate,
  formatYearMonth,
  formatShortDate,
  formatFieldValue,
  getFieldLabel,
  getAdjustmentFieldLabel,
  getDelayPhaseLabel
} = useFormatters()

const {
  getStatusType,
  getSubTaskStatusType,
  getProgressColor,
  getSubTaskProgressColor,
  calculateSubTaskProgress,
  getOperationType,
  getOperationText,
  getPhaseStatusClass,
  getPhaseStatusText,
  getStatusTagType,
  getDetailedPhaseText,
  getPhaseColorClass
} = useStatusHelpers()

const {
  calculateDaysDiff,
  calculateMonthsDiff,
  getDelayType,
  getDelayCount,
  getSubTaskDelayInfo,
  getDateComparisonClass,
  getSubTaskWorkingDays,
  calculateTotalDelayDays
} = useDelayCalculations()
```

然后删除 `<script setup>` 中对应的函数定义。

### 第二步：集成SubTaskDetailDialog组件

1. 在 `ApplicationsView.vue` 中引入组件：

```typescript
import SubTaskDetailDialog from '@/components/applications/dialogs/SubTaskDetailDialog.vue'
```

2. 在模板中替换原有的dialog：

```vue
<!-- 将原有的SubTask Detail Dialog替换为 -->
<SubTaskDetailDialog
  v-model="showSubTaskDetailDialog"
  :data="subTaskDetailData"
  :all-applications="allApplications"
  @edit="editSubTask"
/>
```

3. 删除原有的dialog模板代码（约150行）

### 第三步：继续提取其他对话框组件

按照上述模式，逐个提取并替换对话框组件。每完成一个组件：
1. 创建独立的Vue文件
2. 使用composables复用逻辑
3. 在主视图中引入并替换
4. 删除原有代码
5. 测试功能是否正常

### 第四步：提取表格组件

表格组件较为复杂，建议：
1. 先完成所有对话框组件的提取
2. 确保主视图代码量已显著减少
3. 再考虑是否需要进一步拆分表格

### 第五步：提取筛选组件（可选）

如果代码量仍然较大，可以继续提取筛选组件。

## 注意事项

### 1. 保持功能完整性
- 每次重构后必须测试所有功能
- 确保事件传递正确
- 确保状态同步正常

### 2. 渐进式重构
- 不要一次性重构所有内容
- 每完成一个组件就commit
- 出现问题可以快速回滚

### 3. 类型安全
- 所有组件都应该有明确的类型定义
- Props和Emits都应该使用TypeScript定义
- 避免使用any类型

### 4. 样式处理
- Scoped样式应该放在组件内部
- 全局样式保留在ApplicationsView.vue
- 共用样式可以提取到单独的样式文件

## 预期成果

完成重构后：
- ApplicationsView.vue 应该减少到约1500-2000行
- 代码结构更清晰，职责分明
- 组件可以在其他地方复用
- 测试更容易编写
- 新功能更容易添加

## 测试清单

每次重构后需要测试：

### 应用管理
- [ ] 应用列表加载
- [ ] 应用搜索和筛选
- [ ] 应用创建
- [ ] 应用编辑
- [ ] 应用删除
- [ ] 应用详情查看
- [ ] 收藏功能
- [ ] 延期详情查看
- [ ] 计划历史查看
- [ ] Excel导出

### 子任务管理
- [ ] 子任务列表加载
- [ ] 子任务搜索和筛选
- [ ] 子任务详情查看
- [ ] 子任务编辑
- [ ] 收藏功能
- [ ] 延期详情查看
- [ ] Excel导出

### 审计功能
- [ ] 审计日志查看
- [ ] 操作回滚

## 时间估算

- 集成现有composables: 1-2小时
- 提取所有对话框组件: 4-6小时
- 提取表格组件: 2-3小时
- 提取筛选组件: 2-3小时
- 测试和修复: 2-3小时
- **总计: 约11-17小时**

建议分多次完成，每次提交都应该是可工作的状态。
