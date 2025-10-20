<template>
  <div class="mcp-agent">
    <el-row :gutter="20">
      <!-- Left Panel: Tool Categories -->
      <el-col :xs="24" :sm="24" :md="6" :lg="6">
        <el-card class="tools-panel">
          <template #header>
            <h3>查询与分析工具</h3>
          </template>

          <el-collapse v-model="activeCategories">
            <el-collapse-item
              v-for="(category, key) in toolCategories"
              :key="key"
              :name="key"
            >
              <template #title>
                <div class="category-title">
                  <span>{{ category.name }}</span>
                  <el-tag size="small" type="info">{{ getCategoryToolCount(key) }}个工具</el-tag>
                </div>
              </template>

              <div class="category-description">
                {{ category.description }}
              </div>

              <!-- Tool List -->
              <div class="tool-list">
                <div
                  v-for="tool in getCategoryTools(key)"
                  :key="tool.name"
                  class="tool-item"
                >
                  <div class="tool-header">
                    <span class="tool-name">{{ tool.displayName }}</span>
                    <el-tag
                      v-if="tool.requiresEdit"
                      size="small"
                      :type="canUseEditTools ? 'success' : 'warning'"
                    >
                      {{ canUseEditTools ? '可用' : '需权限' }}
                    </el-tag>
                    <el-tag v-else size="small" type="success">可用</el-tag>
                  </div>

                  <div class="tool-description">{{ tool.description }}</div>

                  <div class="tool-example">
                    <el-text size="small" type="info">示例：</el-text>
                    <el-button
                      size="small"
                      text
                      type="primary"
                      @click="executeToolExample(tool)"
                      :disabled="tool.requiresEdit && !canUseEditTools"
                    >
                      {{ tool.example }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>

      <!-- Right Panel: Chat Interface -->
      <el-col :xs="24" :sm="24" :md="18" :lg="18">
        <el-card class="chat-panel">
          <template #header>
            <div class="chat-header">
              <h3>MCP 智能查询与分析助手</h3>
              <div class="header-actions">
                <el-tag :type="canUseEditTools ? 'success' : 'info'">
                  {{ userRole }}
                </el-tag>
                <el-button size="small" @click="clearChat">清空对话</el-button>
              </div>
            </div>
          </template>

          <!-- Chat Messages -->
          <div class="chat-messages" ref="chatMessagesRef">
            <div
              v-for="(message, index) in chatMessages"
              :key="index"
              :class="['message', message.type, { 'streaming': message.isStreaming }]"
            >
              <div class="message-header">
                <span class="message-sender">
                  {{ message.type === 'user' ? '我' : 'MCP助手' }}
                </span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-content">
                <!-- File attachment info (for user messages) -->
                <div v-if="message.file && message.type === 'user'" class="message-file">
                  <el-icon><document /></el-icon>
                  <span class="file-name">{{ message.file.name }}</span>
                  <span class="file-size">({{ formatFileSize(message.file.size) }})</span>
                </div>

                <!-- Template fill config (for user messages) -->
                <div v-if="message.templateFillConfig && message.type === 'user'" class="template-config">
                  <el-tag size="small" type="success">模板填充模式</el-tag>
                  <span v-if="message.templateFillConfig.context" class="config-item">
                    上下文: {{ message.templateFillConfig.context }}
                  </span>
                  <span class="config-item">
                    行数限制: {{ message.templateFillConfig.limit }}
                  </span>
                </div>

                <!-- Streaming status indicator -->
                <div v-if="message.isStreaming && message.statusMessage" class="streaming-status">
                  <el-icon class="is-loading"><loading /></el-icon>
                  <span>{{ message.statusMessage }}</span>
                </div>

                <!-- Message content with Markdown rendering -->
                <MarkdownRenderer
                  v-if="message.content && message.type === 'assistant'"
                  :content="message.content"
                  :class="{ 'typing-animation': message.isStreaming }"
                />
                <p v-else-if="message.content" :class="{ 'typing-animation': message.isStreaming }">
                  {{ message.content }}<span v-if="message.isStreaming" class="cursor">|</span>
                </p>

                <!-- Display result if available -->
                <div v-if="message.result && !message.isStreaming" style="margin-top: 10px">
                  <!-- Template fill result renderer -->
                  <TemplateFillResultRenderer
                    v-if="message.result.success && message.result.result?.filename"
                    :filename="message.result.result.filename"
                    :metadata="{
                      rowsFilled: message.result.result.rowsFilled,
                      dataSource: message.result.result.dataSource,
                      processingTimeMs: message.result.result.processingTimeMs,
                      templateTitle: message.result.result.templateTitle,
                      aiReasoning: message.result.result.aiReasoning
                    }"
                  />

                  <!-- Error display -->
                  <el-alert
                    v-else-if="!message.result.success"
                    type="error"
                    :closable="false"
                  >
                    <template #title>
                      <span>执行失败</span>
                    </template>
                    <p v-if="message.result.error" style="margin-top: 8px; color: #f56565;">
                      {{ message.result.error }}
                    </p>
                  </el-alert>

                  <!-- Smart MCP Result Renderer -->
                  <MCPResultRenderer
                    v-else-if="message.result.result"
                    :result="message.result.result"
                  />
                </div>
              </div>
            </div>

            <el-empty
              v-if="chatMessages.length === 0 && !isProcessing"
              description="MCP智能助手可以帮您执行复杂数据查询、生成SQL分析、导出定制化Excel报表"
            >
              <template #default>
                <div style="margin-top: 16px;">
                  <el-text type="info" size="small">
                    💡 点击左侧工具示例快速开始，或直接输入您的查询需求
                  </el-text>
                </div>
              </template>
            </el-empty>
          </div>

          <!-- Chat Input -->
          <div class="chat-input">
            <!-- File Upload Preview -->
            <div v-if="uploadedFile" class="file-preview">
              <div class="file-info">
                <el-icon><document /></el-icon>
                <span class="file-name">{{ uploadedFile.name }}</span>
                <span class="file-size">{{ formatFileSize(uploadedFile.size) }}</span>
              </div>
              <el-button
                size="small"
                text
                type="danger"
                @click="removeFile"
              >
                移除
              </el-button>
            </div>

            <!-- File Upload Mode Selection -->
            <div v-if="uploadedFile" class="upload-mode-selector">
              <el-radio-group v-model="uploadMode" size="small">
                <el-radio-button value="analysis">文件分析</el-radio-button>
                <el-radio-button value="template-fill">模板填充</el-radio-button>
              </el-radio-group>

              <!-- Template Fill Configuration -->
              <div v-if="uploadMode === 'template-fill'" class="template-fill-config">
                <el-input
                  v-model="templateFillContext"
                  placeholder="输入上下文信息（可选，如：项目进度报告）"
                  size="small"
                  clearable
                  style="flex: 1; max-width: 400px;"
                >
                  <template #prepend>上下文</template>
                </el-input>
                <el-input-number
                  v-model="templateFillLimit"
                  :min="1"
                  :max="10000"
                  :step="100"
                  size="small"
                  style="width: 150px;"
                >
                  <template #prepend>行数</template>
                </el-input-number>
              </div>
            </div>

            <el-input
              v-model="userInput"
              type="textarea"
              :rows="3"
              :placeholder="getInputPlaceholder()"
              @keydown.enter.ctrl="handleSendMessage"
              :disabled="isProcessing"
            />
            <div class="input-actions">
              <div class="input-hints">
                <el-text size="small" type="info">
                  Ctrl + Enter 发送 | 支持复杂SQL查询、数据分析、报表生成、Excel文件分析
                </el-text>
              </div>
              <div class="action-buttons">
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style="display: none"
                  @change="handleFileSelect"
                />
                <el-button
                  size="default"
                  @click="triggerFileUpload"
                  :disabled="isProcessing"
                >
                  <el-icon><upload-filled /></el-icon>
                  上传Excel
                </el-button>
                <el-button
                  type="primary"
                  @click="handleSendMessage"
                  :loading="isProcessing"
                  :disabled="uploadedFile && uploadMode === 'template-fill' ? false : (!userInput.trim() && !uploadedFile)"
                >
                  {{ uploadedFile && uploadMode === 'template-fill' ? '填充模板' : '发送' }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Document, UploadFilled } from '@element-plus/icons-vue'
import { MCPAPI, requiresEditPermission } from '@/api/mcp'
import { useAuthStore } from '@/stores/auth'
import { hasPermission, type UserRole, getRoleDisplayName } from '@/utils/permissions'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import ApplicationDataRenderer from '@/components/common/ApplicationDataRenderer.vue'
import TemplateFillResultRenderer from '@/components/common/TemplateFillResultRenderer.vue'
import MCPResultRenderer from '@/components/common/MCPResultRenderer.vue'

const authStore = useAuthStore()

// Constants
const CHAT_HISTORY_KEY = 'mcp_chat_history'
const MAX_HISTORY_SIZE = 50 // 最多保存50条对话记录

// Data
const activeCategories = ref<string[]>([])
const chatMessages = ref<any[]>([])
const chatMessagesRef = ref<HTMLElement>()
const userInput = ref('')
const isProcessing = ref(false)
const uploadedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const uploadMode = ref<'analysis' | 'template-fill'>('analysis')
const templateFillContext = ref('')
const templateFillLimit = ref(1000)

// Computed
const userRole = computed(() => {
  return getRoleDisplayName(authStore.userRole as UserRole)
})

const canUseEditTools = computed(() => {
  const role = authStore.userRole as UserRole
  return hasPermission(role, 'canUseMCPEdit')
})

// MCP Assistant Tool Categories (聚焦查询和分析)
const toolCategories = computed(() => ({
  database: {
    name: '数据库查询与分析',
    description: '执行复杂SQL查询，支持联表、聚合、统计分析',
    icon: 'data-analysis',
    color: '#667eea'
  },
  query: {
    name: '复杂数据查询',
    description: '多维度数据查询，支持高级筛选和组合条件',
    icon: 'search',
    color: '#48bb78'
  },
  analysis: {
    name: '统计分析与报表',
    description: '智能分析、趋势预测、自定义Excel报表生成',
    icon: 'data-board',
    color: '#f56c6c'
  },
  cmdb: {
    name: 'CMDB系统查询',
    description: 'L2/L1系统架构查询与层级结构分析',
    icon: 'collection',
    color: '#e6a23c'
  }
}))

// Detailed tool list with usage examples (查询和分析类工具)
const allTools = computed(() => [
  // Database Query & Analysis Tools (2)
  {
    name: 'db_query',
    displayName: 'SQL查询',
    category: 'database',
    description: '执行复杂的只读SQL查询，支持联表、聚合、分组等高级操作',
    requiresEdit: false,
    example: '统计每个部门2024年完成的AK改造项目数量，并计算完成率'
  },
  {
    name: 'db_get_schema',
    displayName: '查看表结构',
    category: 'database',
    description: '获取数据库表结构信息，便于构建复杂查询',
    requiresEdit: false,
    example: '显示applications和subtasks表的所有字段和关联关系'
  },

  // Complex Data Query Tools (4)
  {
    name: 'app_list',
    displayName: '应用列表查询',
    category: 'query',
    description: '支持多维度组合筛选的应用列表查询',
    requiresEdit: false,
    example: '查询技术部2024年所有AK目标且当前阻塞的应用，并显示阻塞原因'
  },
  {
    name: 'app_get',
    displayName: '应用详情查询',
    category: 'query',
    description: '获取应用的完整详细信息，包括子任务和历史记录',
    requiresEdit: false,
    example: '查询L2 ID为CI000088398的应用，包括所有子任务的进度详情'
  },
  {
    name: 'task_list',
    displayName: '子任务列表查询',
    category: 'query',
    description: '高级子任务查询，支持多字段组合筛选',
    requiresEdit: false,
    example: '查询张三负责的所有阻塞超过15天的子任务，按阻塞时长排序'
  },
  {
    name: 'audit_get_logs',
    displayName: '审计日志查询',
    category: 'query',
    description: '查询操作审计日志，追溯数据变更历史和操作人员',
    requiresEdit: false,
    example: '查看最近30天内状态从进行中改为阻塞的所有应用及修改人'
  },

  // Statistical Analysis & Reports Tools (3)
  {
    name: 'calc_delays',
    displayName: '延迟项目分析',
    category: 'analysis',
    description: '智能分析项目延期情况，识别风险项目，生成预警报告',
    requiresEdit: false,
    example: '分析所有延期超过30天的项目，按部门分组并分析延期原因'
  },
  {
    name: 'dashboard_stats',
    displayName: '统计分析',
    category: 'analysis',
    description: '多维度统计分析：进度汇总、部门对比、趋势分析、完成率计算',
    requiresEdit: false,
    example: '分析各部门AK和云原生项目的进度差异，生成对比图表'
  },
  {
    name: 'dashboard_export',
    displayName: 'Excel报表导出',
    category: 'analysis',
    description: '按需生成定制化Excel报表，支持自定义字段、排序、筛选',
    requiresEdit: false,
    example: '导出2024年所有项目的进度明细表，包含子任务分解和负责人信息'
  },

  // CMDB System Query Tools (5)
  {
    name: 'cmdb_search_l2',
    displayName: 'L2应用搜索',
    category: 'cmdb',
    description: '在CMDB中搜索L2级应用系统，支持多维度筛选',
    requiresEdit: false,
    example: '搜索所有集团级且生命周期为运行中的云原生L2应用'
  },
  {
    name: 'cmdb_get_l2',
    displayName: 'L2应用详情',
    category: 'cmdb',
    description: '获取L2应用在CMDB中的完整配置信息',
    requiresEdit: false,
    example: '查看L2应用的技术架构、部署环境和依赖关系'
  },
  {
    name: 'cmdb_search_156l1',
    displayName: '156L1系统搜索',
    category: 'cmdb',
    description: '搜索156L1系统（当前分类体系）',
    requiresEdit: false,
    example: '搜索所有核心业务系统的156L1分类'
  },
  {
    name: 'cmdb_get_156l1_with_l2s',
    displayName: 'L1系统层级查询',
    category: 'cmdb',
    description: '获取L1系统及其下所有L2应用的完整层级结构',
    requiresEdit: false,
    example: '查询风控系统L1下所有L2应用及其改造进度情况'
  },
  {
    name: 'cmdb_search_87l1',
    displayName: '87L1系统搜索',
    category: 'cmdb',
    description: '搜索87L1系统（未来分类体系）',
    requiresEdit: false,
    example: '搜索新架构体系下的87L1系统分类'
  }
])

// Get tools for a specific category
const getCategoryTools = (categoryKey: string) => {
  return allTools.value.filter(tool => tool.category === categoryKey)
}

// Get tool count for a category
const getCategoryToolCount = (categoryKey: string) => {
  return getCategoryTools(categoryKey).length
}

// Execute tool example - fill input but don't auto-send
const executeToolExample = (tool: any) => {
  userInput.value = tool.example
  ElMessage.success('示例已填入输入框，点击发送按钮或按 Ctrl+Enter 发送')
}

// Methods
const getInputPlaceholder = () => {
  if (!uploadedFile.value) {
    return '输入查询需求，例如：查询各部门进行中项目的延期情况并生成Excel报表...'
  }
  if (uploadMode.value === 'template-fill') {
    return '点击发送开始填充模板（输入框可留空）'
  }
  return '输入针对上传文件的分析需求...'
}

const handleSendMessage = async () => {
  if ((!userInput.value.trim() && !uploadedFile.value) || isProcessing.value) return

  const currentFile = uploadedFile.value
  const currentMode = uploadMode.value
  const query = userInput.value.trim() || (currentMode === 'template-fill' ? '填充Excel模板' : '请分析这个Excel文件')

  // Create user message
  const message: any = {
    type: 'user',
    content: query,
    timestamp: new Date(),
    isCode: false,
    mode: currentMode
  }

  // Add file info if present
  if (currentFile) {
    message.file = {
      name: currentFile.name,
      size: currentFile.size
    }
  }

  // Add template fill config if in template-fill mode
  if (currentMode === 'template-fill' && currentFile) {
    message.templateFillConfig = {
      context: templateFillContext.value,
      limit: templateFillLimit.value
    }
  }

  chatMessages.value.push(message)
  userInput.value = ''
  uploadedFile.value = null
  uploadMode.value = 'analysis' // Reset to default mode
  templateFillContext.value = ''
  templateFillLimit.value = 1000

  scrollToBottom()

  // Process the query
  if (currentMode === 'template-fill' && currentFile) {
    await processTemplateFill(currentFile, message.templateFillConfig)
  } else {
    await processQuery(query, currentFile)
  }
}

const processTemplateFill = async (file: File, config: { context: string; limit: number }) => {
  try {
    isProcessing.value = true

    // Create assistant message placeholder
    const assistantMessageIndex = chatMessages.value.length
    chatMessages.value.push({
      type: 'assistant',
      content: '正在填充模板...',
      timestamp: new Date(),
      isCode: false,
      isStreaming: true,
      statusMessage: '正在上传模板并填充数据...',
      result: null
    })

    scrollToBottom()

    // Call template fill API
    const result = await MCPAPI.fillExcelTemplate(file, config.context, config.limit)

    // Finalize the message
    const msg = chatMessages.value[assistantMessageIndex]
    if (msg) {
      msg.isStreaming = false
      msg.statusMessage = undefined

      // Build success message
      const metadata = result.metadata
      let successMessage = `✅ **模板填充成功**\n\n`
      successMessage += `- **填充行数**: ${metadata.rowsFilled} 行\n`
      successMessage += `- **数据源**: ${metadata.dataSource}\n`
      successMessage += `- **处理时间**: ${metadata.processingTimeMs}ms\n`
      if (metadata.templateTitle) {
        successMessage += `- **模板标题**: ${metadata.templateTitle}\n`
      }
      if (metadata.aiReasoning) {
        successMessage += `\n**AI 分析**：${metadata.aiReasoning}\n`
      }
      successMessage += `\n文件已自动下载为：**${result.filename}**`

      msg.content = successMessage
      msg.result = {
        success: true,
        result: {
          filename: result.filename,
          ...metadata
        }
      }
    }

    // Auto-download the file
    const url = window.URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    ElMessage.success(`成功填充 ${result.metadata.rowsFilled} 行数据！文件已下载。`)
    scrollToBottom()
  } catch (error: any) {
    console.error('Template fill error:', error)

    chatMessages.value.push({
      type: 'assistant',
      content: '模板填充失败',
      timestamp: new Date(),
      isCode: false,
      result: {
        success: false,
        error: error.message || '未知错误'
      }
    })

    ElMessage.error(`模板填充失败：${error.message || '未知错误'}`)
  } finally {
    isProcessing.value = false
    scrollToBottom()
  }
}

const processQuery = async (query: string, file?: File | null) => {
  try {
    isProcessing.value = true

    // Create assistant message placeholder
    const assistantMessageIndex = chatMessages.value.length
    chatMessages.value.push({
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isCode: false,
      isStreaming: true,
      streamingPhase: 'parsing',
      statusMessage: file ? '正在上传和分析文件...' : '正在解析查询...',
      result: null
    })

    let fullContent = ''
    let queryResult: any = null

    const callbacks = {
      onStatus: (phase: string, message: string) => {
        // Update status message
        const msg = chatMessages.value[assistantMessageIndex]
        if (msg) {
          msg.streamingPhase = phase
          msg.statusMessage = message
        }
        scrollToBottom()
      },
      onData: (data: any) => {
        // Store query result data
        queryResult = data
        scrollToBottom()
      },
      onChunk: (chunk: string) => {
        // Append AI-generated text chunk
        fullContent += chunk
        const msg = chatMessages.value[assistantMessageIndex]
        if (msg) {
          msg.content = fullContent
          msg.streamingPhase = 'generating'
        }
        scrollToBottom()
      },
      onDone: (success: boolean, message?: string) => {
        // Finalize the message
        const msg = chatMessages.value[assistantMessageIndex]
        if (msg) {
          msg.isStreaming = false
          msg.streamingPhase = undefined
          msg.statusMessage = undefined
          msg.result = queryResult
            ? {
                success: true,
                result: queryResult
              }
            : undefined

          // If no AI content was generated, show default message
          if (!msg.content) {
            msg.content = message || '查询完成'
          }
        }
        scrollToBottom()
      },
      onError: (error: string) => {
        // Update message with error
        const msg = chatMessages.value[assistantMessageIndex]
        if (msg) {
          msg.isStreaming = false
          msg.streamingPhase = undefined
          msg.statusMessage = undefined
          msg.content = '抱歉，查询失败'
          msg.result = {
            success: false,
            error: error
          }
        }
        scrollToBottom()
      }
    }

    // Use appropriate API based on whether file is present
    if (file) {
      await MCPAPI.uploadFileWithQuery(file, query, callbacks)
    } else {
      await MCPAPI.queryStream(query, callbacks)
    }
  } catch (error: any) {
    console.error('MCP query error:', error)

    chatMessages.value.push({
      type: 'assistant',
      content: '抱歉，查询失败',
      timestamp: new Date(),
      isCode: false,
      result: {
        success: false,
        error: error.message || '未知错误'
      }
    })
  } finally {
    isProcessing.value = false
    scrollToBottom()
  }
}

const clearChat = () => {
  chatMessages.value = []
  saveChatHistory() // 保存空的历史记录
  ElMessage.success('对话已清空')
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

// 持久化相关函数
const saveChatHistory = () => {
  try {
    // 只保存最近的MAX_HISTORY_SIZE条记录
    const historyToSave = chatMessages.value.slice(-MAX_HISTORY_SIZE)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(historyToSave))
  } catch (error) {
    console.error('保存聊天历史失败:', error)
  }
}

const loadChatHistory = () => {
  try {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY)
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory)
      // 恢复Date对象
      chatMessages.value = parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        isStreaming: false // 重新加载时不显示流式效果
      }))
      nextTick(() => scrollToBottom())
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
    chatMessages.value = []
  }
}

// 监听chatMessages变化，自动保存（使用debounce避免频繁保存）
let saveTimeout: ReturnType<typeof setTimeout> | null = null
watch(chatMessages, () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveChatHistory()
  }, 1000) // 1秒后保存
}, { deep: true })

// 组件挂载时加载历史记录
onMounted(() => {
  loadChatHistory()
})

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// File upload handlers
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ]

  if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
    ElMessage.error('仅支持 Excel (.xlsx, .xls) 和 CSV (.csv) 文件')
    return
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }

  uploadedFile.value = file
  ElMessage.success(`已选择文件：${file.name}`)

  // Clear the input so the same file can be selected again
  if (target) {
    target.value = ''
  }
}

const removeFile = () => {
  uploadedFile.value = null
  ElMessage.info('已移除文件')
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped lang="scss">
.mcp-agent {
  padding: 20px;

  .tools-panel {
    height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;

    :deep(.el-card__header) {
      flex-shrink: 0;
    }

    :deep(.el-card__body) {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .category-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding-right: 10px;
    }

    .category-description {
      font-size: 13px;
      color: #718096;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #f7fafc;
      border-radius: 4px;
    }

    .tool-list {
      margin-top: 12px;
    }

    .tool-item {
      padding: 12px;
      margin-bottom: 10px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      transition: all 0.2s;

      &:hover {
        border-color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .tool-name {
        font-weight: 600;
        font-size: 14px;
        color: #2d3748;
      }
    }

    .tool-description {
      font-size: 12px;
      color: #718096;
      margin-bottom: 8px;
    }

    .tool-example {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #f7fafc;

      .el-text {
        flex-shrink: 0;
        margin-top: 2px;
      }

      .el-button {
        padding: 4px 8px;
        font-size: 12px;
        height: auto;
        white-space: normal;
        word-break: break-all;
        text-align: left;
        line-height: 1.5;
      }
    }
  }

  .chat-panel {
    height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;

    :deep(.el-card__header) {
      flex-shrink: 0;
    }

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
      min-height: 0;
      overflow: hidden;
    }

    .upload-mode-selector {
      padding: 12px 16px;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 12px;

      .template-fill-config {
        display: flex;
        gap: 12px;
        margin-top: 12px;
        flex-wrap: wrap;
        align-items: center;
      }
    }

    .file-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: #f0f9ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;

      .file-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        .el-icon {
          font-size: 20px;
          color: #3b82f6;
        }

        .file-name {
          font-size: 14px;
          color: #1e40af;
          font-weight: 500;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }
    }

    .chat-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 20px;
      background: #f7fafc;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .message {
        padding: 12px 16px;
        border-radius: 8px;

        &.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          max-width: 80%;

          .message-sender {
            color: rgba(255, 255, 255, 0.9);
          }

          .message-time {
            color: rgba(255, 255, 255, 0.7);
          }
        }

        &.assistant {
          align-self: flex-start;
          background: white;
          border: 1px solid #e2e8f0;
          max-width: 95%;

          .message-sender {
            color: #667eea;
            font-weight: 600;
          }
        }

        &.streaming {
          .message-content {
            .streaming-status {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              background: #f0f9ff;
              border-left: 3px solid #667eea;
              border-radius: 4px;
              margin-bottom: 12px;
              font-size: 13px;
              color: #667eea;

              .el-icon {
                font-size: 16px;
              }
            }

            .typing-animation {
              position: relative;

              .cursor {
                display: inline-block;
                margin-left: 2px;
                animation: blink 1s infinite;
                color: #667eea;
                font-weight: bold;
              }
            }
          }
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;

          .message-sender {
            font-weight: 600;
          }

          .message-time {
            color: #a0aec0;
          }
        }

        .message-content {
          font-size: 14px;
          line-height: 1.6;

          .result-json {
            margin-top: 8px;
            padding: 12px;
            background: #2d3748;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.5;
            color: #e2e8f0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
          }

          .message-file {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            font-size: 13px;

            .el-icon {
              font-size: 16px;
            }

            .file-name {
              font-weight: 500;
            }

            .file-size {
              opacity: 0.8;
              font-size: 12px;
            }
          }

          .template-config {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            margin-top: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            font-size: 12px;
            flex-wrap: wrap;

            .config-item {
              opacity: 0.9;
            }
          }

          p {
            margin: 0;
            white-space: pre-wrap;
          }

          pre {
            margin: 0;
            padding: 8px;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
            font-size: 13px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        }
      }
    }

    .chat-input {
      flex-shrink: 0;
      padding: 16px 20px;
      border-top: 1px solid #e2e8f0;
      background: white;

      .input-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;

        .input-hints {
          font-size: 12px;
          color: #a0aec0;
          flex: 1;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  // 确保滚动条样式美观
  .chat-messages::-webkit-scrollbar,
  .tools-panel :deep(.el-card__body)::-webkit-scrollbar {
    width: 6px;
  }

  .chat-messages::-webkit-scrollbar-track,
  .tools-panel :deep(.el-card__body)::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .chat-messages::-webkit-scrollbar-thumb,
  .tools-panel :deep(.el-card__body)::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;

    &:hover {
      background: #a0aec0;
    }
  }
}

// Keyframe animations
@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .mcp-agent {
    padding: 10px;

    .chat-panel {
      height: calc(100vh - 180px);

      :deep(.el-card__body) {
        min-height: 0;
        overflow: hidden;
      }

      .chat-messages {
        padding: 10px;
        min-height: 0;

        .message {
          max-width: 90%;
        }
      }

      .chat-input {
        padding: 12px 15px;
      }
    }
  }
}
</style>
