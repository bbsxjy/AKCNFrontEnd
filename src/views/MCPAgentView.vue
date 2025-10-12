<template>
  <div class="mcp-agent">
    <el-row :gutter="20">
      <!-- Left Panel: Tool Categories -->
      <el-col :xs="24" :sm="24" :md="6" :lg="6">
        <el-card class="tools-panel">
          <template #header>
            <h3>可用工具</h3>
          </template>

          <el-collapse v-model="activeCategories" accordion>
            <el-collapse-item
              v-for="(category, key) in toolCategories"
              :key="key"
              :name="key"
              :title="category.name"
            >
              <div class="category-description">
                {{ category.description }}
              </div>
              <el-tag
                v-if="canUseEditTools"
                type="success"
                size="small"
                style="margin-top: 8px"
              >
                ✓ 拥有编辑权限
              </el-tag>
              <el-tag
                v-else
                type="info"
                size="small"
                style="margin-top: 8px"
              >
                仅查询权限
              </el-tag>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <el-card class="quick-actions" style="margin-top: 20px">
          <template #header>
            <h3>快捷操作</h3>
          </template>

          <el-button
            v-for="action in quickActions"
            :key="action.name"
            :type="action.type"
            size="small"
            style="width: 100%; margin-bottom: 8px"
            @click="executeQuickAction(action)"
            :disabled="action.requiresEdit && !canUseEditTools"
          >
            {{ action.label }}
          </el-button>
        </el-card>
      </el-col>

      <!-- Right Panel: Chat Interface -->
      <el-col :xs="24" :sm="24" :md="18" :lg="18">
        <el-card class="chat-panel">
          <template #header>
            <div class="chat-header">
              <h3>MCP 助手</h3>
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
              :class="['message', message.type]"
            >
              <div class="message-header">
                <span class="message-sender">
                  {{ message.type === 'user' ? '我' : 'MCP助手' }}
                </span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-content">
                <pre v-if="message.isCode">{{ message.content }}</pre>
                <p v-else>{{ message.content }}</p>

                <!-- Display result if available -->
                <el-alert
                  v-if="message.result"
                  :type="message.result.success ? 'success' : 'error'"
                  :closable="false"
                  style="margin-top: 10px"
                >
                  <template #title>
                    <span v-if="message.result.success">执行成功</span>
                    <span v-else>执行失败</span>
                  </template>
                  <pre v-if="message.result.result" style="margin-top: 8px; white-space: pre-wrap;">{{
                    typeof message.result.result === 'object'
                      ? JSON.stringify(message.result.result, null, 2)
                      : message.result.result
                  }}</pre>
                  <p v-if="message.result.error" style="margin-top: 8px; color: #f56565;">
                    {{ message.result.error }}
                  </p>
                </el-alert>
              </div>
            </div>

            <div v-if="isProcessing" class="message assistant processing">
              <div class="message-header">
                <span class="message-sender">MCP助手</span>
              </div>
              <div class="message-content">
                <el-icon class="is-loading"><loading /></el-icon>
                正在处理...
              </div>
            </div>

            <el-empty
              v-if="chatMessages.length === 0 && !isProcessing"
              description="请输入查询或选择快捷操作开始使用MCP助手"
            />
          </div>

          <!-- Chat Input -->
          <div class="chat-input">
            <el-input
              v-model="userInput"
              type="textarea"
              :rows="3"
              placeholder="输入查询内容，例如：查询所有进行中的应用..."
              @keydown.enter.ctrl="handleSendMessage"
              :disabled="isProcessing"
            />
            <div class="input-actions">
              <div class="input-hints">
                <el-text size="small" type="info">
                  Ctrl + Enter 发送 | 支持自然语言查询
                </el-text>
              </div>
              <el-button
                type="primary"
                @click="handleSendMessage"
                :loading="isProcessing"
                :disabled="!userInput.trim()"
              >
                发送
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { MCPAPI, MCP_TOOL_CATEGORIES, requiresEditPermission } from '@/api/mcp'
import { useAuthStore } from '@/stores/auth'
import { hasPermission, type UserRole, getRoleDisplayName } from '@/utils/permissions'

const authStore = useAuthStore()

// Data
const activeCategories = ref<string[]>([])
const chatMessages = ref<any[]>([])
const chatMessagesRef = ref<HTMLElement>()
const userInput = ref('')
const isProcessing = ref(false)

// Computed
const userRole = computed(() => {
  return getRoleDisplayName(authStore.userRole as UserRole)
})

const canUseEditTools = computed(() => {
  const role = authStore.userRole as UserRole
  return hasPermission(role, 'canUseMCPEdit')
})

const toolCategories = computed(() => MCP_TOOL_CATEGORIES)

const quickActions = computed(() => [
  {
    name: 'list_apps',
    label: '查看应用列表',
    type: 'primary',
    requiresEdit: false,
    query: '查询前10个应用'
  },
  {
    name: 'progress_summary',
    label: '进度汇总',
    type: 'success',
    requiresEdit: false,
    query: '获取所有应用的进度汇总统计'
  },
  {
    name: 'delayed_projects',
    label: '延迟项目',
    type: 'warning',
    requiresEdit: false,
    query: '查询所有延迟的项目'
  },
  {
    name: 'schema_info',
    label: '数据库架构',
    type: 'info',
    requiresEdit: false,
    query: '显示数据库架构信息'
  }
])

// Methods
const handleSendMessage = async () => {
  if (!userInput.value.trim() || isProcessing.value) return

  const message = {
    type: 'user',
    content: userInput.value,
    timestamp: new Date(),
    isCode: false
  }

  chatMessages.value.push(message)
  const query = userInput.value
  userInput.value = ''

  scrollToBottom()

  // Process the query
  await processQuery(query)
}

const processQuery = async (query: string) => {
  try {
    isProcessing.value = true

    // For now, we'll handle specific queries
    // In a real implementation, you'd use NLP or pattern matching
    let result

    if (query.includes('应用列表') || query.includes('查询') && query.includes('应用')) {
      result = await MCPAPI.executeTool({
        tool_name: 'app_list',
        arguments: { limit: 10 }
      })
    } else if (query.includes('进度汇总') || query.includes('统计')) {
      result = await MCPAPI.executeTool({
        tool_name: 'dashboard_stats',
        arguments: { stat_type: 'summary' }
      })
    } else if (query.includes('延迟') || query.includes('逾期')) {
      result = await MCPAPI.executeTool({
        tool_name: 'calc_delays',
        arguments: { include_details: true }
      })
    } else if (query.includes('数据库') || query.includes('架构') || query.includes('schema')) {
      result = await MCPAPI.getDatabaseSchema()
    } else {
      // Default: try to query applications
      result = await MCPAPI.queryApplications(query)
    }

    // Add assistant response
    chatMessages.value.push({
      type: 'assistant',
      content: '查询结果：',
      timestamp: new Date(),
      isCode: false,
      result: result
    })

  } catch (error: any) {
    console.error('MCP query error:', error)

    chatMessages.value.push({
      type: 'assistant',
      content: '抱歉，查询失败',
      timestamp: new Date(),
      isCode: false,
      result: {
        success: false,
        error: error.response?.data?.detail || error.message || '未知错误'
      }
    })
  } finally {
    isProcessing.value = false
    scrollToBottom()
  }
}

const executeQuickAction = async (action: any) => {
  if (action.requiresEdit && !canUseEditTools.value) {
    ElMessage.warning('您没有权限执行此操作')
    return
  }

  userInput.value = action.query
  await handleSendMessage()
}

const clearChat = () => {
  chatMessages.value = []
  ElMessage.success('对话已清空')
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.mcp-agent {
  padding: 20px;

  .tools-panel {
    height: fit-content;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .category-description {
      font-size: 13px;
      color: #718096;
      margin-bottom: 8px;
    }
  }

  .quick-actions {
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
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
        max-width: 80%;

        &.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;

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

          .message-sender {
            color: #667eea;
            font-weight: 600;
          }
        }

        &.processing {
          opacity: 0.8;
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
        }
      }
    }
  }

  // 确保滚动条样式美观
  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;

    &:hover {
      background: #a0aec0;
    }
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
