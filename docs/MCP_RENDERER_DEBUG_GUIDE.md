# MCP渲染器调试指南

## 🐛 问题：查询结果显示为"详细信息"或"查询失败"

### 原因分析

MCP API返回的数据结构是：
```typescript
{
  success: boolean
  result: any        // ⚠️ 注意是 result，不是 data
  error?: string
  metadata?: any
}
```

而不是常见的 `{ success, data, metadata }` 格式。

### 解决方案

已在 `MCPResultRenderer.vue` 中修复数据提取逻辑：

```typescript
// 正确提取数据
const actualData = current.result?.data || current.result || current.data
const actualMetadata = current.metadata || current.result?.metadata
```

### 🔍 调试工具

#### 1. 开发环境调试面板

在开发模式下，MCPResultRenderer会自动显示调试面板，展示：

- ✅ 检测到的renderType
- ✅ 数据类型（数组/对象）
- ✅ 数据字段列表
- ✅ 是否有后端metadata
- ✅ 一键查看完整数据

**如何使用：**
1. 在MCP Agent中执行查询
2. 查看结果上方的蓝色调试面板
3. 点击"在Console查看完整数据"查看原始响应

#### 2. 浏览器Console日志

开发环境下会自动输出：
```
[MCPResultRenderer] Debug info: Initial type: object | Has success: true | ...
[MCPResultRenderer] Actual data: [...]
[MCPResultRenderer] Metadata: {...}
```

#### 3. 检查数据流

```bash
# 1. 检查API响应
打开浏览器DevTools > Network > XHR/Fetch
查找 /mcp/execute 或 /mcp/query 请求
查看 Response 数据结构

# 2. 检查渲染器输入
在MCPAgentView.vue中查看传递给MCPResultRenderer的props

# 3. 检查类型检测
查看Console输出的 "Detected renderType"
```

## 📊 常见问题排查

### 问题1: 显示"详细信息"而不是应用列表

**症状：**
```
检测到的renderType: generic_detail
数据类型: 对象
```

**原因：**
数据不是数组格式，或数组被嵌套在对象中

**排查：**
1. 查看调试面板中的"对象字段"
2. 检查是否有 `data`、`result`、`applications` 等字段
3. 后端可能返回了 `{ applications: [...] }` 而不是直接返回数组

**解决：**
```typescript
// 方案1: 后端直接返回数组
{ success: true, result: [...] }

// 方案2: 后端提供metadata
{
  success: true,
  result: { applications: [...] },
  metadata: { renderType: 'application_list' }
}

// 方案3: 前端增强检测逻辑
// 在 mcpRenderTypeDetector.ts 中添加特殊字段检测
```

### 问题2: 显示"查询失败"

**症状：**
```
success: false
error: "..."
```

**原因：**
后端执行失败

**排查：**
1. 查看error字段内容
2. 检查Network请求的Response
3. 查看后端日志

### 问题3: 显示"未知数据类型"

**症状：**
```
检测到的renderType: unknown
```

**原因：**
数据格式不符合任何已知的renderType模式

**排查：**
1. 查看调试面板中的完整数据结构
2. 检查第一项的字段是否包含预期的标识字段（如 `l2_id`, `app_name`）
3. 可能需要更新检测逻辑

**解决：**
在 `mcpRenderTypeDetector.ts` 中添加新的检测规则

## 🎯 renderType检测规则

### application_list
```typescript
// 必须字段
data[0].l2_id && data[0].app_name && data[0].current_status
```

### subtask_list
```typescript
// 必须字段
data[0].sub_target && data[0].task_status
```

### cmdb_l2_list
```typescript
// 必须字段
data[0].config_id && data[0].short_name && data[0].management_level
```

### integrated_detail
```typescript
// 必须字段
data.l2_id && data.cmdb_info && data.transformation_info
```

### statistics
```typescript
// 对象格式：包含 total/count/by_xxx 等统计字段
// 数组格式：字段名包含 count/total/avg/percentage
```

## 🔧 临时解决方案

如果后端暂时无法修改，可以临时修改前端：

### 1. 添加数据转换中间层

在 `MCPAgentView.vue` 中：
```typescript
const transformResponse = (response: any) => {
  // 如果是特殊格式，转换为标准格式
  if (response.result?.applications) {
    return {
      success: true,
      result: response.result.applications,
      metadata: {
        renderType: 'application_list',
        title: `查询到 ${response.result.applications.length} 个应用`
      }
    }
  }
  return response
}

// 使用
const transformedResult = transformResponse(result)
```

### 2. 扩展类型检测逻辑

在 `mcpRenderTypeDetector.ts` 中添加：
```typescript
// 检测应用列表（包装在对象中）
if (data.applications && Array.isArray(data.applications)) {
  return {
    renderType: 'application_list',
    title: `查询到 ${data.applications.length} 个应用`,
    count: data.applications.length
  }
}
```

## 📝 最佳实践

### 后端返回标准格式（推荐）

```python
# Python后端示例
from app.mcp.response_utils import application_list_response

apps = [...]
return application_list_response(apps, total=100)

# 返回格式
{
  "success": True,
  "result": [...],  # 直接是数组
  "metadata": {
    "renderType": "application_list",
    "title": "查询到 10 个转型应用",
    "count": 10,
    "total": 100,
    "primaryKey": "l2_id"
  }
}
```

### 前端自动fallback

即使后端未提供metadata，前端也能自动检测：

```typescript
// ✅ 这种格式也能正确渲染
{
  success: true,
  result: [
    { l2_id: "CI001", app_name: "应用A", current_status: "进行中" }
  ]
}
// → 自动检测为 application_list
```

## 🚀 快速测试

### 测试1: 直接查询应用列表

```
查询所有进行中的应用
```

**预期：**
- renderType: `application_list`
- 显示ApplicationsTable组件

### 测试2: 查询统计数据

```
统计各状态的应用数量
```

**预期：**
- renderType: `statistics`
- 显示统计卡片

### 测试3: SQL查询

使用 `db_query` 工具：
```sql
SELECT l2_id, app_name, current_status FROM applications LIMIT 10
```

**预期：**
- renderType: `sql_result`
- 显示SQL表格，支持导出CSV

## 📞 联系支持

如果问题仍未解决：

1. 导出调试面板的截图
2. 在Console中运行 `console.log('Full data:', result)` 并截图
3. 提供查询的具体内容
4. 附上Network请求的Response数据

---

**最后更新**: 2025-10-21
**版本**: v2.0 (重构后)
