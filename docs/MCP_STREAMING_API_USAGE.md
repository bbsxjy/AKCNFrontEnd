# MCP Streaming API 使用指南

## 概述

MCP (Model Context Protocol) Streaming API 提供了实时 AI 查询和分析功能。本文档说明如何正确使用前端 API 调用后端 streaming 端点。

## API 端点

```
POST/GET /api/v1/mcp/query/applications/stream
```

## 认证

所有请求需要在 Header 中包含认证 Token：

```javascript
Authorization: Bearer <token>
```

开发环境使用固定测试 Token：
```
Bearer token_1_admin_full_access_test_2024
```

---

## 方法一：POST 请求（推荐）

### 优点
- 支持复杂的 context 对象
- 更好的安全性（参数在 body 中）
- 适合长查询字符串

### 使用方式

```typescript
import { MCPAPI } from '@/api/mcp'

const callbacks = {
  onStatus: (phase, message) => {
    console.log(`状态: ${phase} - ${message}`)
  },
  onData: (data) => {
    console.log('收到数据:', data)
  },
  onChunk: (chunk) => {
    console.log('AI 回复:', chunk)
  },
  onDone: (success, message) => {
    console.log('完成:', success, message)
  },
  onError: (error) => {
    console.error('错误:', error)
  }
}

// POST 请求（默认方式）
await MCPAPI.queryStream(
  '查询所有延期超过7天的应用',  // query - 必需
  callbacks,                      // callbacks - 必需
  { department: '技术部' },      // context - 可选
  'POST'                          // method - 可选，默认 'POST'
)
```

### 请求格式

```http
POST /api/v1/mcp/query/applications/stream HTTP/1.1
Host: localhost:8000
Authorization: Bearer token_1_admin_full_access_test_2024
Content-Type: application/json

{
  "query": "查询所有延期超过7天的应用",
  "context": {
    "department": "技术部"
  }
}
```

---

## 方法二：GET 请求（简单查询）

### 优点
- 更简单的 URL 调用
- 可直接在浏览器中测试
- 适合简单查询

### 使用方式

```typescript
import { MCPAPI } from '@/api/mcp'

// GET 请求
await MCPAPI.queryStream(
  '查询应用详情',  // query - 必需
  callbacks,       // callbacks - 必需
  undefined,       // context - 可选
  'GET'            // method - 使用 GET
)
```

### 请求格式

```http
GET /api/v1/mcp/query/applications/stream?query=查询应用详情 HTTP/1.1
Host: localhost:8000
Authorization: Bearer token_1_admin_full_access_test_2024
```

### 带 Context 的 GET 请求

```typescript
await MCPAPI.queryStream(
  '查询应用详情',
  callbacks,
  { id: '123', include_subtasks: true },
  'GET'
)
```

生成的 URL：
```
/api/v1/mcp/query/applications/stream?query=查询应用详情&context={"id":"123","include_subtasks":true}
```

---

## 文件上传 + 查询

用于分析上传的 Excel 文件。

### 使用方式

```typescript
import { MCPAPI } from '@/api/mcp'

const file = fileInput.files[0]  // File 对象

await MCPAPI.uploadFileWithQuery(
  file,                           // file - 必需
  '分析这个Excel文件的项目进度',  // query - 必需
  callbacks                       // callbacks - 必需
)
```

### 请求格式

```http
POST /api/v1/mcp/query/applications/stream HTTP/1.1
Host: localhost:8000
Authorization: Bearer token_1_admin_full_access_test_2024
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="file"; filename="data.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[Binary file data]
------WebKitFormBoundary...
Content-Disposition: form-data; name="query"

分析这个Excel文件的项目进度
------WebKitFormBoundary...--
```

---

## Streaming 事件处理

后端返回 Server-Sent Events (SSE) 格式的数据流，包含以下事件类型：

### 事件类型

#### 1. `status` - 状态更新
```
event: status
data: {"phase": "parsing", "message": "正在解析查询..."}
```

#### 2. `data` - 查询结果数据
```
event: data
data: {"result": {...}, "tools_used": ["app_list", "calc_delays"]}
```

#### 3. `ai_chunk` - AI 生成内容片段
```
event: ai_chunk
data: {"content": "根据查询结果，发现以下延期项目：\n"}
```

#### 4. `done` - 完成
```
event: done
data: {"success": true, "message": "查询完成"}
```

#### 5. `error` - 错误
```
event: error
data: {"error": "查询失败：数据库连接超时"}
```

### Callbacks 定义

```typescript
interface MCPStreamCallbacks {
  onStatus?: (phase: string, message: string) => void
  onData?: (data: any) => void
  onChunk?: (chunk: string) => void
  onDone?: (success: boolean, message?: string) => void
  onError?: (error: string) => void
}
```

---

## 错误处理

### 参数验证错误

```typescript
try {
  await MCPAPI.queryStream('', callbacks)
} catch (error) {
  console.error(error.message)  // "Query parameter is required"
}
```

### HTTP 错误

```typescript
const callbacks = {
  onError: (error) => {
    console.error('请求失败:', error)
    // 可能的错误信息：
    // - "HTTP 400: Bad Request"
    // - "HTTP 401: Unauthorized"
    // - "HTTP 500: Internal Server Error"
  }
}
```

### 网络错误

```typescript
try {
  await MCPAPI.queryStream('查询', callbacks)
} catch (error) {
  console.error('网络错误:', error.message)
}
```

---

## 调试日志

前端代码包含详细的控制台日志，便于调试：

### POST 请求日志
```
[MCP Stream] Initiating POST request to http://localhost:8000/api/v1/mcp/query/applications/stream
[MCP Stream] Query: 查询所有延期超过7天的应用
[MCP Stream] Response status: 200
[MCP Stream] Starting to read stream...
[MCP Stream] Stream completed
```

### GET 请求日志
```
[MCP Stream] Initiating GET request to http://localhost:8000/api/v1/mcp/query/applications/stream?query=查询应用详情
[MCP Stream] Query: 查询应用详情
[MCP Stream] Response status: 200
[MCP Stream] Starting to read stream...
[MCP Stream] Stream completed
```

### 文件上传日志
```
[MCP File Upload] Uploading file: report.xlsx (52341 bytes)
[MCP File Upload] Query: 分析这个Excel文件的项目进度
[MCP File Upload] Response status: 200
[MCP File Upload] Starting to read stream...
[MCP File Upload] Stream completed
```

---

## 最佳实践

### 1. 选择合适的方法

- **使用 POST**（默认）：
  - 复杂查询
  - 需要传递 context 对象
  - 查询字符串很长

- **使用 GET**：
  - 简单查询
  - 需要在浏览器中直接测试
  - 查询字符串较短

### 2. 处理所有回调

```typescript
const callbacks: MCPStreamCallbacks = {
  onStatus: (phase, message) => {
    updateUI('loading', message)
  },
  onData: (data) => {
    displayResults(data)
  },
  onChunk: (chunk) => {
    appendToTextArea(chunk)
  },
  onDone: (success) => {
    if (success) {
      updateUI('success', '查询完成')
    }
  },
  onError: (error) => {
    updateUI('error', error)
    showErrorNotification(error)
  }
}
```

### 3. 显示加载状态

```typescript
const [isLoading, setIsLoading] = useState(false)

async function handleQuery(query: string) {
  setIsLoading(true)

  try {
    await MCPAPI.queryStream(query, {
      onDone: () => setIsLoading(false),
      onError: () => setIsLoading(false),
      // ... other callbacks
    })
  } catch (error) {
    setIsLoading(false)
  }
}
```

### 4. 清理资源

```typescript
let abortController: AbortController | null = null

async function handleQuery(query: string) {
  // 取消之前的请求
  if (abortController) {
    abortController.abort()
  }

  abortController = new AbortController()

  try {
    await MCPAPI.queryStream(query, callbacks)
  } finally {
    abortController = null
  }
}
```

---

## 常见问题

### Q1: 为什么我的请求总是失败？

**A:** 检查以下几点：
1. `query` 参数是否为空
2. Authorization Token 是否正确
3. 后端服务是否正常运行
4. 查看浏览器控制台的 `[MCP Stream]` 日志

### Q2: 如何知道查询是否完成？

**A:** 监听 `onDone` 回调：
```typescript
const callbacks = {
  onDone: (success, message) => {
    if (success) {
      console.log('✅ 查询成功完成')
    }
  }
}
```

### Q3: Streaming 数据如何实时显示？

**A:** 使用 `onChunk` 回调逐步追加内容：
```typescript
let fullContent = ''

const callbacks = {
  onChunk: (chunk) => {
    fullContent += chunk
    document.getElementById('output').textContent = fullContent
  }
}
```

### Q4: 文件上传失败怎么办？

**A:** 检查：
1. 文件大小是否超过限制（前端 10MB）
2. 文件类型是否支持（`.xlsx`, `.xls`, `.csv`）
3. `query` 参数是否提供
4. 查看 `[MCP File Upload]` 日志

---

## 示例代码

完整的 Vue 3 组件示例：

```vue
<template>
  <div>
    <el-input v-model="query" placeholder="输入查询..." />
    <el-button @click="handleQuery" :loading="isLoading">
      查询
    </el-button>

    <div v-if="status" class="status">{{ status }}</div>
    <div class="results">{{ aiResponse }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MCPAPI, type MCPStreamCallbacks } from '@/api/mcp'
import { ElMessage } from 'element-plus'

const query = ref('')
const isLoading = ref(false)
const status = ref('')
const aiResponse = ref('')

async function handleQuery() {
  if (!query.value.trim()) {
    ElMessage.warning('请输入查询内容')
    return
  }

  isLoading.value = true
  status.value = ''
  aiResponse.value = ''

  const callbacks: MCPStreamCallbacks = {
    onStatus: (phase, message) => {
      status.value = message
    },
    onChunk: (chunk) => {
      aiResponse.value += chunk
    },
    onDone: (success) => {
      isLoading.value = false
      if (success) {
        ElMessage.success('查询完成')
      }
    },
    onError: (error) => {
      isLoading.value = false
      ElMessage.error(`查询失败: ${error}`)
    }
  }

  try {
    await MCPAPI.queryStream(query.value, callbacks)
  } catch (error: any) {
    isLoading.value = false
    ElMessage.error(`请求错误: ${error.message}`)
  }
}
</script>
```

---

## 更新日志

### 2025-01-17
- ✅ 增强错误处理，提供详细的错误信息
- ✅ 添加 GET 方法支持
- ✅ 添加参数验证（query 必填）
- ✅ 添加详细的调试日志
- ✅ 改进 TypeScript 类型定义
