# Excel导入字段映射规范

## 基于Sample.xlsx标准设计

系统基于用户现有的Sample.xlsx文件格式设计字段映射，支持两个工作表的数据导入：

### 1. 总追踪表（勿动）- 应用数据映射

| Excel列名（中文） | API字段名（英文） | 数据类型 | 说明 |
|------------------|-----------------|---------|------|
| L2ID | application_id | string | 应用唯一标识符 |
| 档位 | service_tier | string | 服务等级 |
| 所属项目 | business_subdomain | string | 业务子域 |
| 开发负责人 | responsible_person | string | 开发负责人 |
| 开发团队 | responsible_team | string | 开发团队 |
| 监管验收年份 | supervision_year | number | 监管验收年份 |
| 改造目标 | transformation_target | string | 改造目标(AK/云原生) |
| 当前改造阶段 | current_stage | string | 当前改造阶段 |
| 硬件资源保障\n优先级 | priority | string | 优先级(P0/P1/P2) |
| 延误状态 | delay_status | string | 延误状态 |
| 改造状态 | status | string | 改造状态 |

### 2. 子追踪表 - 子任务数据映射

| Excel列名（中文） | API字段名（英文） | 数据类型 | 说明 |
|------------------|-----------------|---------|------|
| L2ID | application_id | string | 关联应用ID |
| L2应用名 | application_name | string | 应用名称 |
| 子目标 | subtask_target | string | 子任务目标 |
| 版本名 | subtask_name | string | 版本名称 |
| 改造状态 | status | string | 改造状态 |
| 【计划】\n需求完成时间 | planned_start_date | date | 计划开始日期 |
| 【实际】\n需求到达时间 | actual_start_date | date | 实际开始日期 |
| 【计划】\n发版时间 | planned_release_date | date | 计划发版日期 |
| 【实际】\n发版时间 | actual_release_date | date | 实际发版日期 |
| 【计划】\n技术上线时间 | planned_tech_date | date | 计划技术上线日期 |
| 【实际】\n技术上线时间 | actual_tech_date | date | 实际技术上线日期 |
| 【计划】\n业务上线时间 | planned_end_date | date | 计划结束日期 |
| 【实际】\n业务上线时间 | actual_end_date | date | 实际结束日期 |
| 验收年份 | supervision_year | number | 验收年份 |
| 所属指标 | kpi_classification | string | KPI分类 |
| 主表同步备注 | notes | string | 备注信息 |

## 数据转换规则

### 状态值映射
```typescript
// 应用状态映射
APPLICATION_STATUS_MAPPING = {
  '研发进行中': 'in_progress',
  '待启动': 'pending',
  '业务上线中': 'deploying',
  '全部完成': 'completed',
  '存在阻塞': 'blocked'
}

// 子任务状态映射
SUBTASK_STATUS_MAPPING = {
  '研发进行中': 'in_progress',
  '子任务完成': 'completed',
  '阻塞': 'blocked',
  '待启动': 'pending',
  '业务上线中': 'deploying'
}
```

### 优先级映射
```typescript
PRIORITY_VALUE_MAPPING = {
  'P0': 'high',
  'P1': 'medium',
  'P2': 'low'
}
```

### 改造目标映射
```typescript
TARGET_VALUE_MAPPING = {
  'AK': 'AK',
  '云原生': 'cloud_native'
}
```

## 客户端转换流程

1. **文件读取**: 使用xlsx库读取.xlsx文件
2. **工作表选择**:
   - 总追踪表：查找包含"总追踪表"的工作表
   - 子追踪表：查找包含"子追踪表"的工作表
3. **字段映射**: 根据表类型应用对应的字段映射规则
4. **数据转换**:
   - 中文状态值转换为英文枚举值
   - Excel日期序列号转换为ISO日期格式
   - 年份格式处理（"2026年" → 2026）
5. **文件重构**: 生成新的Excel文件供API处理
6. **验证导入**: 上传转换后的文件到API进行验证和导入

## 实现文件

- `/src/utils/excelFieldMapping.ts` - 字段映射配置和转换函数
- `/src/api/reports.ts` - Excel文件转换和API调用逻辑
- `/src/views/ImportView.vue` - 导入界面和用户交互

## 设计原则

1. **用户数据优先**: 适配现有Excel格式，不要求用户改变数据结构
2. **精确映射**: 只映射业务实际需要的字段，避免冗余
3. **双表支持**: 同时支持应用数据和子任务数据的导入
4. **客户端转换**: 在前端完成字段映射，减少后端改动
5. **向后兼容**: 保持与现有API接口的兼容性

## 更新日志

**2025-09-17**:
- ✅ 基于Sample.xlsx重新设计字段映射
- ✅ 移除不必要字段（business_domain, vendor, traffic等）
- ✅ 实现双表处理：总追踪表和子追踪表
- ✅ 优化客户端文件转换流程
- ✅ 完善日期处理和状态值映射