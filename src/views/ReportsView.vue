<template>
  <div class="reports-view">
    <!-- Header with title and actions -->
    <div class="report-header">
      <div class="title-section">
        <h1>报表中心</h1>
        <p class="subtitle">截至{{ reportDate }}</p>
      </div>
      <div class="action-buttons">
        <el-button type="success" @click="exportAsImage" :loading="exportingImage">
          <el-icon><Camera /></el-icon>
          导出图片
        </el-button>
        <el-dropdown @command="handleExportExcel" trigger="click">
          <el-button type="warning" :loading="exportingExcel">
            <el-icon><Download /></el-icon>
            导出Excel
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="sample1">
                <div style="padding: 4px 0;">
                  <div style="font-weight: bold;">双追踪表格式 (Sample1)</div>
                  <div style="font-size: 12px; color: #909399;">包含AK和云原生两个Sheet</div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="sample2">
                <div style="padding: 4px 0;">
                  <div style="font-weight: bold;">详细追踪表格式 (Sample2)</div>
                  <div style="font-size: 12px; color: #909399;">包含月度进展跟踪</div>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" @click="generateAIReport" :loading="generatingAI">
          <el-icon><MagicStick /></el-icon>
          AI报告
        </el-button>
        <el-button type="primary" @click="showConfig">
          <el-icon><Setting /></el-icon>
          配置
        </el-button>
      </div>
    </div>

    <!-- Main content cards -->
    <el-row :gutter="20" class="main-cards">
      <!-- Left: Application Transformation Overview -->
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="overview-card">
          <template #header>
            <h3>应用改造总体情况</h3>
          </template>

          <el-tabs v-model="activeOverviewTab" @tab-change="handleOverviewTabChange">
            <el-tab-pane label="总体" name="all">
              <!-- Center Pie Chart with Completion Percentage -->
              <div class="pie-chart-container">
                <div ref="overviewPieRef" class="pie-chart"></div>
              </div>

              <!-- Status Statistics -->
              <div class="status-grid">
                <div class="status-item" v-for="stat in statusStats" :key="stat.label">
                  <div class="status-count" :class="`status-${stat.type}`">
                    {{ stat.count }}
                  </div>
                  <div class="status-label">{{ stat.label }}</div>
                  <div v-if="stat.detail" class="status-detail">{{ stat.detail }}</div>
                </div>
              </div>

              <!-- Total Applications -->
              <div class="total-apps">
                总计：{{ totalApplications }}个应用
              </div>
            </el-tab-pane>

            <el-tab-pane label="AK" name="ak">
              <!-- AK Pie Chart -->
              <div class="pie-chart-container">
                <div ref="akPieRef" class="pie-chart"></div>
              </div>

              <!-- AK Status Statistics -->
              <div class="status-grid">
                <div class="status-item" v-for="stat in akStatusStats" :key="stat.label">
                  <div class="status-count" :class="`status-${stat.type}`">
                    {{ stat.count }}
                  </div>
                  <div class="status-label">{{ stat.label }}</div>
                  <div v-if="stat.detail" class="status-detail">{{ stat.detail }}</div>
                </div>
              </div>

              <!-- Total AK Applications -->
              <div class="total-apps">
                总计：{{ akTotalApplications }}个AK应用
              </div>
            </el-tab-pane>

            <el-tab-pane label="云原生" name="cloud-native">
              <!-- Cloud Native Pie Chart -->
              <div class="pie-chart-container">
                <div ref="cloudNativePieRef" class="pie-chart"></div>
              </div>

              <!-- Cloud Native Status Statistics -->
              <div class="status-grid">
                <div class="status-item" v-for="stat in cloudNativeStatusStats" :key="stat.label">
                  <div class="status-count" :class="`status-${stat.type}`">
                    {{ stat.count }}
                  </div>
                  <div class="status-label">{{ stat.label }}</div>
                  <div v-if="stat.detail" class="status-detail">{{ stat.detail }}</div>
                </div>
              </div>

              <!-- Total Cloud Native Applications -->
              <div class="total-apps">
                总计：{{ cloudNativeTotalApplications }}个云原生应用
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <!-- Right: Key Project Indicators -->
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="indicators-card">
          <template #header>
            <h3>项目关键指标完成情况</h3>
          </template>

          <div v-if="keyIndicators.length === 0" class="empty-indicators">
            <el-empty description="">
              <template #description>
                <div style="text-align: center;">
                  <p style="font-size: 13px; color: #718096; margin-bottom: 8px;">
                    暂无关键指标
                  </p>
                  <p style="font-size: 11px; color: #a0aec0; margin-bottom: 14px;">
                    点击右上角"配置"按钮，可以自定义添加关键指标
                  </p>
                  <el-button type="primary" size="small" @click="showConfig">
                    <el-icon><Setting /></el-icon>
                    立即配置
                  </el-button>
                </div>
              </template>
            </el-empty>
          </div>

          <div v-else class="indicators-list">
            <div v-for="indicator in keyIndicators" :key="indicator.name" class="indicator-item">
              <div class="indicator-name">{{ indicator.name }}</div>
              <div class="indicator-progress">
                <el-progress
                  :percentage="indicator.percentage"
                  :color="indicator.color"
                  :stroke-width="14"
                  :show-text="false"
                />
                <div class="indicator-stats">
                  <span class="percentage">{{ indicator.percentage }}%</span>
                  <span class="fraction">{{ indicator.completed }}/{{ indicator.total }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Risk Section -->
    <el-row :gutter="20" class="risk-section">
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3>当前风险</h3>
          </template>

          <!-- No Risk Notice -->
          <div v-if="!hasAnyRisks" class="no-risk">
            <el-icon><SuccessFilled /></el-icon>
            <span>暂无风险</span>
          </div>

          <!-- Delayed Applications -->
          <div class="risk-category">
            <div class="risk-category-header delayed">
              <span class="risk-title">有延迟的应用</span>
              <span class="risk-count">
                {{ delayedApps.length }}个
                <el-icon v-if="delayedApps.length > 0" class="trend-up"><CaretTop /></el-icon>
              </span>
            </div>

            <div v-if="delayedApps.length === 0" class="no-risk-message">
              当前没有延迟的应用
            </div>

            <div v-else class="risk-items">
              <div v-for="app in delayedApps" :key="app.id" class="risk-item delayed-item">
                <div class="app-name">{{ app.appName }}</div>
                <div class="app-details">
                  <div class="detail-row">
                    <span class="label">负责团队：</span>
                    <span class="value">{{ app.team || '未填写' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">原计划完成：</span>
                    <span class="value">{{ app.plannedDate }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">当前延迟：</span>
                    <span class="value highlight">{{ app.delayMonths }}个月</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">延迟原因：</span>
                    <span class="value">{{ app.delayReason || '未填写' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">预计完成：</span>
                    <span class="value">{{ app.expectedDate }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Potential Risk Applications -->
          <div class="risk-category" style="margin-top: 20px;">
            <div class="risk-category-header potential">
              <span class="risk-title">潜在延迟风险的应用</span>
              <span class="risk-count">
                {{ potentialRiskApps.length }}个
                <el-icon v-if="potentialRiskApps.length > 0" class="trend-up"><CaretTop /></el-icon>
              </span>
            </div>

            <div v-if="potentialRiskApps.length === 0" class="no-risk-message">
              当前没有潜在延迟风险的应用
            </div>

            <div v-else class="risk-items">
              <div v-for="app in potentialRiskApps" :key="app.id" class="risk-item potential-item">
                <div class="app-name">{{ app.appName }}</div>
                <div class="app-details">
                  <div class="detail-row">
                    <span class="label">负责团队：</span>
                    <span class="value">{{ app.team }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">计划完成：</span>
                    <span class="value">{{ app.plannedDate }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">风险原因：</span>
                    <span class="value">{{ app.riskReason }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Manual Risk Items -->
          <div v-if="manualRiskItems.length > 0" class="risk-category" style="margin-top: 20px;">
            <div class="risk-category-header custom">
              <span class="risk-title">手动配置的风险项</span>
              <span class="risk-count">
                {{ manualRiskItems.length }}个
              </span>
            </div>

            <div class="risk-items">
              <div v-for="risk in manualRiskItems" :key="risk.id" :class="['risk-item', `${risk.riskType}-item`, `severity-${risk.severity}`]">
                <div class="app-name">
                  {{ risk.appName }}
                  <el-tag :type="risk.severity === 'high' ? 'danger' : risk.severity === 'medium' ? 'warning' : 'info'" size="small" style="margin-left: 8px;">
                    {{ risk.riskType === 'delayed' ? '延迟' : risk.riskType === 'potential' ? '潜在风险' : '自定义' }}
                  </el-tag>
                  <el-tag :type="risk.severity === 'high' ? 'danger' : risk.severity === 'medium' ? 'warning' : 'success'" size="small" style="margin-left: 4px;">
                    {{ risk.severity === 'high' ? '高' : risk.severity === 'medium' ? '中' : '低' }}
                  </el-tag>
                </div>
                <div class="app-details">
                  <div class="detail-row">
                    <span class="label">风险描述：</span>
                    <span class="value">{{ risk.description || '未填写' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- AI Report Dialog -->
    <el-dialog
      v-model="aiReportDialogVisible"
      title="🤖 AI智能报告"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        AI已根据当前报表数据生成以下分析报告，包含关键洞察和建议。
      </el-alert>

      <div class="ai-report-content">
        <div v-if="aiReportContent" v-html="formatAIReport(aiReportContent)"></div>
        <el-empty v-else description="暂无AI报告内容" />
      </div>

      <template #footer>
        <div style="display: flex; justify-content: space-between;">
          <el-button @click="copyAIReport" type="info">
            <el-icon><DocumentCopy /></el-icon>
            复制报告
          </el-button>
          <el-button type="primary" @click="aiReportDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Configuration Dialog -->
    <el-dialog
      v-model="configDialogVisible"
      title="报表配置"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeConfigTab">
        <!-- Key Indicators Configuration -->
        <el-tab-pane label="关键指标配置" name="indicators">
          <div class="config-section">
            <el-alert
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              <template #title>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>您可以自定义关键指标，或使用自动计算选项</span>
                </div>
              </template>
            </el-alert>

            <div v-for="(indicator, index) in configIndicators" :key="index" class="indicator-config-item">
              <el-card>
                <template #header>
                  <div style="display: flex; justify-content: between; align-items: center;">
                    <span>指标 {{ index + 1 }}</span>
                    <el-button
                      v-if="configIndicators.length > 1"
                      type="danger"
                      link
                      size="small"
                      @click="removeIndicator(index)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>

                <el-form label-width="140px">
                  <el-form-item label="指标名称">
                    <el-input v-model="indicator.name" placeholder="例如：2025年AK验收目标" />
                  </el-form-item>

                  <el-form-item label="自动计算">
                    <el-select
                      v-model="indicator.autoCalcType"
                      placeholder="选择自动计算类型"
                      @change="handleAutoCalcChange(index)"
                      clearable
                    >
                      <el-option label="手动输入" value="" />
                      <el-option label="2025年云原生完成数" value="cloud_native_2025" />
                      <el-option label="2025年AK完成数" value="ak_2025" />
                      <el-option label="2025年所有应用完成数" value="all_2025" />
                      <el-option label="2024&2025年完成数" value="all_2024_2025" />
                      <el-option label="云原生总完成数" value="cloud_native_total" />
                      <el-option label="AK总完成数" value="ak_total" />
                      <el-option label="所有应用总完成数" value="all_total" />
                    </el-select>
                  </el-form-item>

                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="已完成（分子）">
                        <el-input-number
                          v-model="indicator.completed"
                          :min="0"
                          :disabled="!!indicator.autoCalcType"
                          style="width: 100%;"
                        />
                        <div v-if="indicator.autoCalcType" style="font-size: 12px; color: #909399; margin-top: 4px;">
                          自动计算
                        </div>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="总数（分母）">
                        <el-input-number
                          v-model="indicator.total"
                          :min="1"
                          style="width: 100%;"
                        />
                        <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                          手动填写目标值
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-form-item label="完成百分比">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <el-progress
                        :percentage="indicator.percentage"
                        :color="indicator.color"
                        style="flex: 1;"
                      />
                      <span style="min-width: 50px; text-align: right;">{{ indicator.percentage }}%</span>
                    </div>
                  </el-form-item>

                  <el-form-item label="进度条颜色">
                    <el-color-picker v-model="indicator.color" />
                  </el-form-item>
                </el-form>
              </el-card>
            </div>

            <el-button
              type="primary"
              plain
              style="width: 100%; margin-top: 20px;"
              @click="addIndicator"
            >
              <el-icon><Plus /></el-icon>
              添加指标
            </el-button>
          </div>
        </el-tab-pane>

        <!-- Auto Calculation Preview -->
        <el-tab-pane label="自动计算预览" name="preview">
          <div class="config-section">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="总应用数">
                {{ autoCalcData.total }}
              </el-descriptions-item>
              <el-descriptions-item label="已完成应用数">
                {{ autoCalcData.completed }}
              </el-descriptions-item>
              <el-descriptions-item label="云原生应用数">
                {{ autoCalcData.cloudNative }}
              </el-descriptions-item>
              <el-descriptions-item label="云原生已完成">
                {{ autoCalcData.cloudNativeCompleted }}
              </el-descriptions-item>
              <el-descriptions-item label="AK应用数">
                {{ autoCalcData.ak }}
              </el-descriptions-item>
              <el-descriptions-item label="AK已完成">
                {{ autoCalcData.akCompleted }}
              </el-descriptions-item>
              <el-descriptions-item label="2025年应用数">
                {{ autoCalcData.year2025 }}
              </el-descriptions-item>
              <el-descriptions-item label="2025年已完成">
                {{ autoCalcData.year2025Completed }}
              </el-descriptions-item>
              <el-descriptions-item label="2025年云原生数">
                {{ autoCalcData.cloudNative2025 }}
              </el-descriptions-item>
              <el-descriptions-item label="2025年云原生已完成">
                {{ autoCalcData.cloudNative2025Completed }}
              </el-descriptions-item>
              <el-descriptions-item label="2025年AK数">
                {{ autoCalcData.ak2025 }}
              </el-descriptions-item>
              <el-descriptions-item label="2025年AK已完成">
                {{ autoCalcData.ak2025Completed }}
              </el-descriptions-item>
              <el-descriptions-item label="2024&2025年应用数">
                {{ autoCalcData.year20242025 }}
              </el-descriptions-item>
              <el-descriptions-item label="2024&2025年已完成">
                {{ autoCalcData.year20242025Completed }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- Risk Configuration -->
        <el-tab-pane label="风险内容配置" name="risk">
          <div class="config-section">
            <el-alert
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              <template #title>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>配置风险检测的阈值和条件</span>
                </div>
              </template>
            </el-alert>

            <el-form label-width="180px">
              <el-form-item label="延迟阈值（天）">
                <el-input-number
                  v-model="configRiskSettings.delayThresholdDays"
                  :min="0"
                  :max="365"
                  style="width: 100%;"
                />
                <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                  超过计划完成日期多少天后标记为延迟（0表示任何延迟都标记）
                </div>
              </el-form-item>

              <el-form-item label="潜在风险预警期（天）">
                <el-input-number
                  v-model="configRiskSettings.potentialRiskWarningDays"
                  :min="1"
                  :max="180"
                  style="width: 100%;"
                />
                <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                  距离计划完成日期多少天内且进度不足时标记为潜在风险
                </div>
              </el-form-item>

              <el-form-item label="潜在风险进度阈值（%）">
                <el-input-number
                  v-model="configRiskSettings.potentialRiskProgressThreshold"
                  :min="0"
                  :max="100"
                  style="width: 100%;"
                />
                <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                  进度低于此百分比且接近截止日期时标记为潜在风险
                </div>
              </el-form-item>

              <el-divider />

              <el-form-item label="当前风险统计">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="自动检测延迟应用数" label-class-name="risk-label">
                    <span style="color: #f56565; font-weight: bold;">{{ delayedApps.length }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="自动检测潜在风险数" label-class-name="risk-label">
                    <span style="color: #ed8936; font-weight: bold;">{{ potentialRiskApps.length }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="手动配置风险数" label-class-name="risk-label">
                    <span style="color: #667eea; font-weight: bold;">{{ configManualRisks.length }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="总风险数" label-class-name="risk-label">
                    <span style="color: #f56565; font-weight: bold;">{{ delayedApps.length + potentialRiskApps.length + configManualRisks.length }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </el-form-item>

              <el-divider>手动风险配置</el-divider>

              <div style="margin-bottom: 20px;">
                <el-alert type="warning" :closable="false" style="margin-bottom: 12px;">
                  手动添加的风险项将显示在"当前风险"部分，支持自定义风险描述
                </el-alert>

                <div v-for="(risk, index) in configManualRisks" :key="risk.id" style="margin-bottom: 12px;">
                  <el-card shadow="hover">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                      <div style="flex: 1;">
                        <el-form :inline="true" size="small">
                          <el-form-item label="应用名称">
                            <el-input v-model="risk.appName" placeholder="请输入应用名称" style="width: 200px;" />
                          </el-form-item>
                          <el-form-item label="风险类型">
                            <el-select v-model="risk.riskType" style="width: 120px;">
                              <el-option label="延迟" value="delayed" />
                              <el-option label="潜在风险" value="potential" />
                              <el-option label="自定义" value="custom" />
                            </el-select>
                          </el-form-item>
                          <el-form-item label="严重程度">
                            <el-select v-model="risk.severity" style="width: 100px;">
                              <el-option label="高" value="high" />
                              <el-option label="中" value="medium" />
                              <el-option label="低" value="low" />
                            </el-select>
                          </el-form-item>
                        </el-form>
                        <el-form-item label="风险描述" style="margin-top: 8px;">
                          <el-input
                            v-model="risk.description"
                            type="textarea"
                            :rows="2"
                            placeholder="请详细描述风险内容..."
                            style="width: 100%;"
                          />
                        </el-form-item>
                      </div>
                      <el-button
                        type="danger"
                        size="small"
                        @click="removeManualRisk(index)"
                        style="flex-shrink: 0;"
                      >
                        删除
                      </el-button>
                    </div>
                  </el-card>
                </div>

                <el-button
                  type="primary"
                  plain
                  style="width: 100%;"
                  @click="addManualRisk"
                >
                  <el-icon><Plus /></el-icon>
                  添加手动风险项
                </el-button>
              </div>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div style="display: flex; justify-content: space-between;">
          <el-button @click="resetConfig">重置为默认</el-button>
          <div>
            <el-button @click="configDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveConfig">保存配置</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Camera, Setting, SuccessFilled, CaretTop, Download, ArrowDown, Plus, MagicStick, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import { ApplicationsAPI } from '@/api/applications'
import { SubTasksAPI } from '@/api/subtasks'
import { ExcelAPI } from '@/api/reports'
import { useMCPStore } from '@/stores/mcp'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'

// Initialize MCP store for AI features
const mcpStore = useMCPStore()

// State
const reportDate = ref('')
const exportingImage = ref(false)
const exportingExcel = ref(false)
const generatingAI = ref(false)
const aiReportDialogVisible = ref(false)
const aiReportContent = ref('')
const totalApplications = ref(0)
const akTotalApplications = ref(0)
const cloudNativeTotalApplications = ref(0)

// Overview tabs
const activeOverviewTab = ref('all')

// Configuration Dialog
const configDialogVisible = ref(false)
const activeConfigTab = ref('indicators')

// Store raw data for auto calculation
const rawApplications = ref<any[]>([])
const rawSubtasks = ref<any[]>([])

// Chart refs
const overviewPieRef = ref<HTMLElement | null>(null)
const akPieRef = ref<HTMLElement | null>(null)
const cloudNativePieRef = ref<HTMLElement | null>(null)
let overviewPieChart: echarts.ECharts | null = null
let akPieChart: echarts.ECharts | null = null
let cloudNativePieChart: echarts.ECharts | null = null

// Status statistics
interface StatusStat {
  label: string
  count: number
  type: string
  detail?: string
}

const statusStats = ref<StatusStat[]>([
  { label: '需求阶段', count: 0, type: 'requirement' },
  { label: '研发阶段', count: 0, type: 'development' },
  { label: '已完成', count: 0, type: 'completed' },
  { label: '上线阶段', count: 0, type: 'online' },
  { label: '业务下线', count: 0, type: 'offline' },
  { label: '未启动', count: 0, type: 'not-started' },
  { label: '阻塞', count: 0, type: 'blocked', detail: '' }
])

const akStatusStats = ref<StatusStat[]>([
  { label: '需求阶段', count: 0, type: 'requirement' },
  { label: '研发阶段', count: 0, type: 'development' },
  { label: '已完成', count: 0, type: 'completed' },
  { label: '上线阶段', count: 0, type: 'online' },
  { label: '业务下线', count: 0, type: 'offline' },
  { label: '未启动', count: 0, type: 'not-started' },
  { label: '阻塞', count: 0, type: 'blocked', detail: '' }
])

const cloudNativeStatusStats = ref<StatusStat[]>([
  { label: '需求阶段', count: 0, type: 'requirement' },
  { label: '研发阶段', count: 0, type: 'development' },
  { label: '已完成', count: 0, type: 'completed' },
  { label: '上线阶段', count: 0, type: 'online' },
  { label: '业务下线', count: 0, type: 'offline' },
  { label: '未启动', count: 0, type: 'not-started' },
  { label: '阻塞', count: 0, type: 'blocked', detail: '' }
])

// Key indicators
interface KeyIndicator {
  name: string
  percentage: number
  completed: number
  total: number
  color: string
}

interface KeyIndicatorConfig extends KeyIndicator {
  autoCalcType?: string
}

// Risk configuration
interface RiskConfig {
  delayThresholdDays: number
  potentialRiskWarningDays: number
  potentialRiskProgressThreshold: number
}

// Manual risk item
interface ManualRiskItem {
  id: string
  appName: string
  riskType: 'delayed' | 'potential' | 'custom'
  description: string
  severity: 'high' | 'medium' | 'low'
}

const keyIndicators = ref<KeyIndicator[]>([])

const configIndicators = ref<KeyIndicatorConfig[]>([])

// Risk configuration
const riskConfig = ref<RiskConfig>({
  delayThresholdDays: 0, // 0 means any delay is flagged
  potentialRiskWarningDays: 30, // Warn if within 30 days of deadline
  potentialRiskProgressThreshold: 80 // Warn if progress < 80%
})

const configRiskSettings = ref<RiskConfig>({
  delayThresholdDays: 0,
  potentialRiskWarningDays: 30,
  potentialRiskProgressThreshold: 80
})

// Manual risk items
const manualRiskItems = ref<ManualRiskItem[]>([])
const configManualRisks = ref<ManualRiskItem[]>([])

// Auto calculation data
const autoCalcData = computed(() => {
  const apps = rawApplications.value

  return {
    total: apps.length,
    completed: apps.filter(app =>
      app.is_ak_completed === true || app.is_cloud_native_completed === true
    ).length,
    cloudNative: apps.filter(app =>
      app.overall_transformation_target === '云原生'
    ).length,
    cloudNativeCompleted: apps.filter(app =>
      app.overall_transformation_target === '云原生' &&
      app.is_cloud_native_completed === true
    ).length,
    ak: apps.filter(app =>
      app.overall_transformation_target === 'AK'
    ).length,
    akCompleted: apps.filter(app =>
      app.overall_transformation_target === 'AK' &&
      app.is_ak_completed === true
    ).length,
    year2025: apps.filter(app =>
      app.ak_supervision_acceptance_year === '2025'
    ).length,
    year2025Completed: apps.filter(app =>
      app.ak_supervision_acceptance_year === '2025' &&
      (app.is_ak_completed === true || app.is_cloud_native_completed === true)
    ).length,
    cloudNative2025: apps.filter(app =>
      app.overall_transformation_target === '云原生' &&
      app.ak_supervision_acceptance_year === '2025'
    ).length,
    cloudNative2025Completed: apps.filter(app =>
      app.overall_transformation_target === '云原生' &&
      app.ak_supervision_acceptance_year === '2025' &&
      app.is_cloud_native_completed === true
    ).length,
    ak2025: apps.filter(app =>
      app.overall_transformation_target === 'AK' &&
      app.ak_supervision_acceptance_year === '2025'
    ).length,
    ak2025Completed: apps.filter(app =>
      app.overall_transformation_target === 'AK' &&
      app.ak_supervision_acceptance_year === '2025' &&
      app.is_ak_completed === true
    ).length,
    year20242025: apps.filter(app =>
      app.ak_supervision_acceptance_year === '2024' ||
      app.ak_supervision_acceptance_year === '2025'
    ).length,
    year20242025Completed: apps.filter(app =>
      (app.ak_supervision_acceptance_year === '2024' ||
       app.ak_supervision_acceptance_year === '2025') &&
      (app.is_ak_completed === true || app.is_cloud_native_completed === true)
    ).length
  }
})

// Risk applications
interface RiskApp {
  id: string
  appName: string
  team: string
  plannedDate: string
  delayMonths?: number
  delayReason?: string
  expectedDate?: string
  riskReason?: string
}

const delayedApps = ref<RiskApp[]>([])
const potentialRiskApps = ref<RiskApp[]>([])

const hasAnyRisks = computed(() => {
  return delayedApps.value.length > 0 || potentialRiskApps.value.length > 0
})

// Methods
const loadReportData = async () => {
  try {
    // Fetch applications and subtasks
    const [appsResponse, subtasksResponse] = await Promise.all([
      ApplicationsAPI.getApplications({ limit: 1000 }),
      SubTasksAPI.getSubTasks({ limit: 1000 })
    ])

    const applications = appsResponse.items || []
    const subtasks = subtasksResponse.items || []

    // Store raw data for auto calculation
    rawApplications.value = applications
    rawSubtasks.value = subtasks

    // Set total applications
    totalApplications.value = applications.length

    // Calculate status statistics
    calculateStatusStats(applications, subtasks)

    // Calculate key indicators
    calculateKeyIndicators(applications, subtasks)

    // Calculate risk applications
    calculateRiskApplications(applications, subtasks)

    // Render pie chart
    renderOverviewPieChart()
  } catch (error) {
    console.error('Failed to load report data:', error)
    ElMessage.error('加载报表数据失败')
  }
}

const calculateStatusStats = (applications: any[], subtasks: any[]) => {
  // Helper function to count status for a given set of applications
  // targetType: 'all' | 'ak' | 'cloud_native'
  const countStatus = (apps: any[], statsArray: StatusStat[], targetType: 'all' | 'ak' | 'cloud_native') => {
    // Reset counts
    statsArray.forEach(stat => {
      stat.count = 0
      stat.detail = ''
    })

    // Count by status
    apps.forEach(app => {
      // For completion status, use is_ak_completed or is_cloud_native_completed
      // Based on the target type
      let isCompleted = false
      if (targetType === 'ak') {
        isCompleted = app.is_ak_completed === true
      } else if (targetType === 'cloud_native') {
        isCompleted = app.is_cloud_native_completed === true
      } else {
        // For 'all' type, either one is completed counts as completed
        isCompleted = app.is_ak_completed === true || app.is_cloud_native_completed === true
      }

      // If marked as completed by the is_*_completed fields, count as completed
      if (isCompleted) {
        statsArray[2].count++ // 已完成
        return
      }

      // Otherwise, use current_status for other statuses
      const status = app.current_status || app.status

      switch (status) {
        case '待启动':
        case 'not_started':
          statsArray[5].count++ // 未启动
          break
        case '需求分析中':
        case 'requirement_analysis':
          statsArray[0].count++ // 需求阶段
          break
        case '研发进行中':
        case 'in_development':
        case 'in_progress':
          statsArray[1].count++ // 研发阶段
          break
        case '业务上线中':
        case 'business_online':
        case '技术上线中':
        case 'tech_online':
          statsArray[3].count++ // 上线阶段
          break
        case '全部完成':
        case 'completed':
          // This case is now handled by is_*_completed above
          // But keep it for backward compatibility
          statsArray[2].count++ // 已完成
          break
        case '业务下线':
        case 'offline':
          statsArray[4].count++ // 业务下线
          break
        case '存在阻塞':
        case 'blocked':
          statsArray[6].count++ // 阻塞
          break
        default:
          // Default to not started
          statsArray[5].count++
      }
    })

    // Find blocking reasons for blocked applications
    if (statsArray[6].count > 0) {
      const blockedApp = apps.find(app =>
        app.current_status === '存在阻塞' || app.current_status === 'blocked'
      )
      if (blockedApp) {
        const blockedTask = subtasks.find(task => task.l2_id === blockedApp.id && task.block_reason)
        if (blockedTask) {
          statsArray[6].detail = `（${blockedTask.block_reason}）`
        }
      }
    }
  }

  // Calculate for all applications
  countStatus(applications, statusStats.value, 'all')

  // Calculate for AK applications
  const akApps = applications.filter(app => app.overall_transformation_target === 'AK')
  akTotalApplications.value = akApps.length
  countStatus(akApps, akStatusStats.value, 'ak')

  // Calculate for Cloud Native applications
  const cloudNativeApps = applications.filter(app => app.overall_transformation_target === '云原生')
  cloudNativeTotalApplications.value = cloudNativeApps.length
  countStatus(cloudNativeApps, cloudNativeStatusStats.value, 'cloud_native')
}

const calculateKeyIndicators = (applications: any[], subtasks: any[]) => {
  // Only update indicators if they don't exist or are not manually configured
  // Skip this auto-update if user has saved custom config
  const hasSavedConfig = localStorage.getItem('report_indicators_config')
  if (hasSavedConfig || keyIndicators.value.length === 0) {
    // Don't auto-update if user has custom config
    return
  }

  // 2025年AK验收目标（仅含云原生）
  const cloudNativeApps = applications.filter(app =>
    app.overall_transformation_target === '云原生' &&
    app.ak_supervision_acceptance_year === '2025'
  )
  const completedCloudNative = cloudNativeApps.filter(app =>
    app.is_cloud_native_completed === true
  )
  keyIndicators.value[0].total = cloudNativeApps.length
  keyIndicators.value[0].completed = completedCloudNative.length
  keyIndicators.value[0].percentage = cloudNativeApps.length > 0
    ? Math.round((completedCloudNative.length / cloudNativeApps.length) * 100)
    : 0

  // 2025年技术条线OKR - 所有2025年的应用
  const okrApps = applications.filter(app =>
    app.ak_supervision_acceptance_year === '2025'
  )
  const completedOKR = okrApps.filter(app =>
    app.is_ak_completed === true || app.is_cloud_native_completed === true
  )
  keyIndicators.value[1].total = okrApps.length
  keyIndicators.value[1].completed = completedOKR.length
  keyIndicators.value[1].percentage = okrApps.length > 0
    ? Math.round((completedOKR.length / okrApps.length) * 100)
    : 0

  // 2024&2025年项目目标进度
  const projectApps = applications.filter(app =>
    app.ak_supervision_acceptance_year === '2024' ||
    app.ak_supervision_acceptance_year === '2025'
  )
  const completedProject = projectApps.filter(app =>
    app.is_ak_completed === true || app.is_cloud_native_completed === true
  )
  keyIndicators.value[2].total = projectApps.length
  keyIndicators.value[2].completed = completedProject.length
  keyIndicators.value[2].percentage = projectApps.length > 0
    ? Math.round((completedProject.length / projectApps.length) * 100)
    : 0
}

const calculateRiskApplications = (applications: any[], subtasks: any[]) => {
  const today = new Date()
  const delayed: RiskApp[] = []
  const potential: RiskApp[] = []

  // Use configured thresholds
  const delayThreshold = riskConfig.value.delayThresholdDays
  const warningDays = riskConfig.value.potentialRiskWarningDays
  const progressThreshold = riskConfig.value.potentialRiskProgressThreshold

  applications.forEach(app => {
    const appSubtasks = subtasks.filter(task => task.l2_id === app.id)

    // Find delayed tasks
    const delayedTasks = appSubtasks.filter(task => {
      if (task.planned_biz_online_date && !task.actual_biz_online_date) {
        const plannedDate = new Date(task.planned_biz_online_date)
        const daysDiff = Math.ceil((today.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff > delayThreshold
      }
      return false
    })

    if (delayedTasks.length > 0) {
      // Calculate max delay
      const maxDelayTask = delayedTasks.reduce((max, task) => {
        const plannedDate = new Date(task.planned_biz_online_date)
        const yearDiff = today.getFullYear() - plannedDate.getFullYear()
        const monthDiff = today.getMonth() - plannedDate.getMonth()
        const delayMonths = yearDiff * 12 + monthDiff
        return delayMonths > max.months ? { task, months: delayMonths } : max
      }, { task: delayedTasks[0], months: 0 })

      delayed.push({
        id: app.id,
        appName: app.app_name,
        team: app.responsible_team || '',
        plannedDate: formatDate(maxDelayTask.task.planned_biz_online_date),
        delayMonths: maxDelayTask.months,
        delayReason: maxDelayTask.task.block_reason || '',
        expectedDate: maxDelayTask.task.expected_completion_date
          ? formatDate(maxDelayTask.task.expected_completion_date)
          : '待定'
      })
    }

    // Find potential risks (tasks approaching deadline)
    const potentialTasks = appSubtasks.filter(task => {
      if (task.planned_biz_online_date && !task.actual_biz_online_date) {
        const plannedDate = new Date(task.planned_biz_online_date)
        const daysUntilDeadline = Math.ceil((plannedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilDeadline > 0 && daysUntilDeadline <= warningDays && task.progress_percentage < progressThreshold
      }
      return false
    })

    if (potentialTasks.length > 0 && delayedTasks.length === 0) {
      potential.push({
        id: app.id,
        appName: app.app_name,
        team: app.responsible_team || '',
        plannedDate: formatDate(potentialTasks[0].planned_biz_online_date),
        riskReason: '进度缓慢，可能无法按时完成'
      })
    }
  })

  delayedApps.value = delayed
  potentialRiskApps.value = potential
}

const renderPieChart = (
  chartRef: HTMLElement | null,
  chart: echarts.ECharts | null,
  statsArray: StatusStat[],
  total: number
): echarts.ECharts | null => {
  if (!chartRef) return null

  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(chartRef)

  // Calculate completion percentage
  const completed = statsArray[2].count
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const option: echarts.EChartsOption = {
    title: {
      text: `${completionPercentage}%`,
      subtext: '完成比例',
      left: 'center',
      top: 'center',
      textStyle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#2d3748'
      },
      subtextStyle: {
        fontSize: 12,
        color: '#718096'
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: false
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: completed,
            name: '已完成',
            itemStyle: { color: '#48bb78' }
          },
          {
            value: statsArray[1].count,
            name: '研发阶段',
            itemStyle: { color: '#ed8936' }
          },
          {
            value: statsArray[3].count,
            name: '上线阶段',
            itemStyle: { color: '#3182ce' }
          },
          {
            value: statsArray[5].count,
            name: '未启动',
            itemStyle: { color: '#cbd5e0' }
          },
          {
            value: statsArray[6].count,
            name: '阻塞',
            itemStyle: { color: '#f56565' }
          }
        ]
      }
    ]
  }

  chart.setOption(option)

  // Handle resize
  window.addEventListener('resize', () => {
    chart?.resize()
  })

  return chart
}

const renderOverviewPieChart = () => {
  overviewPieChart = renderPieChart(overviewPieRef.value, overviewPieChart, statusStats.value, totalApplications.value)
}

const renderAkPieChart = () => {
  akPieChart = renderPieChart(akPieRef.value, akPieChart, akStatusStats.value, akTotalApplications.value)
}

const renderCloudNativePieChart = () => {
  cloudNativePieChart = renderPieChart(cloudNativePieRef.value, cloudNativePieChart, cloudNativeStatusStats.value, cloudNativeTotalApplications.value)
}

const handleOverviewTabChange = (tabName: string) => {
  // Render the appropriate chart when tab changes
  setTimeout(() => {
    if (tabName === 'all') {
      renderOverviewPieChart()
    } else if (tabName === 'ak') {
      renderAkPieChart()
    } else if (tabName === 'cloud-native') {
      renderCloudNativePieChart()
    }
  }, 100)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const exportAsImage = async () => {
  exportingImage.value = true
  try {
    const element = document.querySelector('.reports-view') as HTMLElement
    if (!element) {
      throw new Error('报表元素未找到')
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    })

    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `报表中心_${new Date().toISOString().split('T')[0]}.png`
    link.href = dataURL
    link.click()

    ElMessage.success('图片导出成功')
  } catch (error) {
    console.error('Failed to export image:', error)
    ElMessage.error('图片导出失败')
  } finally {
    exportingImage.value = false
  }
}

const handleExportExcel = async (command: string) => {
  exportingExcel.value = true
  try {
    const templateType = command as 'sample1' | 'sample2'

    // Prepare report data for export
    const reportData = {
      report_date: reportDate.value,
      total_applications: totalApplications.value,
      status_stats: statusStats.value,
      key_indicators: keyIndicators.value,
      delayed_apps: delayedApps.value,
      potential_risk_apps: potentialRiskApps.value
    }

    await ExcelAPI.exportBiWeeklyReport(templateType, reportData)

    ElMessage.success(`Excel导出成功 (${templateType === 'sample1' ? '双追踪表格式' : '详细追踪表格式'})`)
  } catch (error) {
    console.error('Failed to export Excel:', error)
    ElMessage.error('Excel导出失败，请确保后端API已实现')
  } finally {
    exportingExcel.value = false
  }
}

/**
 * Generate AI Report using MCP
 */
const generateAIReport = async () => {
  generatingAI.value = true

  try {
    const loadingInstance = ElLoading.service({
      text: '🤖 AI正在分析报表数据并生成报告...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
      // Prepare comprehensive report data for AI analysis
      const reportData = {
        report_date: reportDate.value,
        overview: {
          total_applications: totalApplications.value,
          ak_applications: akTotalApplications.value,
          cloud_native_applications: cloudNativeTotalApplications.value
        },
        status_statistics: {
          overall: statusStats.value.map(s => ({ label: s.label, count: s.count })),
          ak: akStatusStats.value.map(s => ({ label: s.label, count: s.count })),
          cloud_native: cloudNativeStatusStats.value.map(s => ({ label: s.label, count: s.count }))
        },
        key_indicators: keyIndicators.value.map(ki => ({
          name: ki.name,
          percentage: ki.percentage,
          completed: ki.completed,
          total: ki.total
        })),
        risks: {
          delayed_count: delayedApps.value.length,
          potential_risk_count: potentialRiskApps.value.length,
          manual_risk_count: manualRiskItems.value.length,
          delayed_apps: delayedApps.value.map(app => ({
            name: app.appName,
            team: app.team,
            delay_months: app.delayMonths,
            reason: app.delayReason
          })),
          potential_risks: potentialRiskApps.value.map(app => ({
            name: app.appName,
            team: app.team,
            reason: app.riskReason
          }))
        }
      }

      // Use MCP natural language query to generate report
      const query = `
请基于以下报表数据生成一份专业的项目进展分析报告，要求：

1. **总体概况**：总结应用总数、AK应用数、云原生应用数
2. **完成情况分析**：分析各阶段应用数量和完成比例
3. **关键指标评估**：评价关键指标的完成情况
4. **风险识别**：分析当前风险和潜在风险，给出优先级建议
5. **改进建议**：提供3-5条具体的改进措施

报表数据：
${JSON.stringify(reportData, null, 2)}
      `.trim()

      const response = await mcpStore.query(query, {
        report_type: 'summary',
        language: 'zh-CN'
      })

      if (response && response.success) {
        aiReportContent.value = response.answer || '未生成报告内容'
        aiReportDialogVisible.value = true
        ElMessage.success('✅ AI报告生成成功！')
      } else {
        ElMessage.error('AI报告生成失败，请重试')
      }
    } finally {
      loadingInstance.close()
    }
  } catch (error: any) {
    console.error('Failed to generate AI report:', error)
    ElMessage.error('生成AI报告时出错：' + (error.message || '未知错误'))
  } finally {
    generatingAI.value = false
  }
}

/**
 * Format AI report content to HTML
 */
const formatAIReport = (content: string): string => {
  if (!content) return ''

  // Convert markdown-like formatting to HTML
  let formatted = content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^(\d+)\.\s/gm, '<li>')
    .replace(/^- /gm, '<li>')
    .replace(/<li>/g, '</li><li>')
    .replace(/^<\/li>/, '')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  return `<div class="formatted-content"><p>${formatted}</p></div>`
}

/**
 * Copy AI report to clipboard
 */
const copyAIReport = async () => {
  try {
    await navigator.clipboard.writeText(aiReportContent.value)
    ElMessage.success('📋 报告已复制到剪贴板')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

const showConfig = () => {
  // Load saved config or use current indicators
  loadConfig()
  configDialogVisible.value = true
}

const loadConfig = () => {
  // Load indicators config
  const savedConfig = localStorage.getItem('report_indicators_config')
  if (savedConfig) {
    try {
      configIndicators.value = JSON.parse(savedConfig)
    } catch (error) {
      console.error('Failed to load config:', error)
      configIndicators.value = JSON.parse(JSON.stringify(keyIndicators.value))
    }
  } else {
    configIndicators.value = JSON.parse(JSON.stringify(keyIndicators.value))
  }

  // Load risk config
  const savedRiskConfig = localStorage.getItem('report_risk_config')
  if (savedRiskConfig) {
    try {
      configRiskSettings.value = JSON.parse(savedRiskConfig)
    } catch (error) {
      console.error('Failed to load risk config:', error)
      configRiskSettings.value = { ...riskConfig.value }
    }
  } else {
    configRiskSettings.value = { ...riskConfig.value }
  }

  // Load manual risks
  const savedManualRisks = localStorage.getItem('report_manual_risks')
  if (savedManualRisks) {
    try {
      configManualRisks.value = JSON.parse(savedManualRisks)
    } catch (error) {
      console.error('Failed to load manual risks:', error)
      configManualRisks.value = []
    }
  } else {
    configManualRisks.value = [...manualRiskItems.value]
  }
}

const saveConfig = () => {
  // Update key indicators from config
  keyIndicators.value = configIndicators.value.map(indicator => {
    // Calculate percentage
    const percentage = indicator.total > 0
      ? Math.round((indicator.completed / indicator.total) * 100)
      : 0

    return {
      name: indicator.name,
      completed: indicator.completed,
      total: indicator.total,
      percentage,
      color: indicator.color
    }
  })

  // Update risk configuration
  riskConfig.value = { ...configRiskSettings.value }

  // Update manual risks
  manualRiskItems.value = [...configManualRisks.value]

  // Save to localStorage
  localStorage.setItem('report_indicators_config', JSON.stringify(configIndicators.value))
  localStorage.setItem('report_risk_config', JSON.stringify(configRiskSettings.value))
  localStorage.setItem('report_manual_risks', JSON.stringify(configManualRisks.value))

  ElMessage.success('配置已保存')
  configDialogVisible.value = false

  // Re-calculate risks and re-render charts
  calculateRiskApplications(rawApplications.value, rawSubtasks.value)
  setTimeout(() => {
    renderOverviewPieChart()
  }, 100)
}

const resetConfig = () => {
  // Reset indicators
  configIndicators.value = [
    {
      name: '2025年AK验收目标（仅含云原生）',
      percentage: 31,
      completed: 19,
      total: 61,
      color: '#667eea',
      autoCalcType: 'cloud_native_2025'
    },
    {
      name: '2025年技术条线OKR',
      percentage: 91,
      completed: 32,
      total: 35,
      color: '#667eea',
      autoCalcType: 'all_2025'
    },
    {
      name: '2024&2025年项目目标进度',
      percentage: 61,
      completed: 69,
      total: 114,
      color: '#667eea',
      autoCalcType: 'all_2024_2025'
    }
  ]

  // Apply auto calculations
  configIndicators.value.forEach((_, index) => {
    handleAutoCalcChange(index)
  })

  // Reset risk settings
  configRiskSettings.value = {
    delayThresholdDays: 0,
    potentialRiskWarningDays: 30,
    potentialRiskProgressThreshold: 80
  }

  // Reset manual risks
  configManualRisks.value = []

  ElMessage.success('已重置为默认配置')
}

const addIndicator = () => {
  configIndicators.value.push({
    name: '新指标',
    percentage: 0,
    completed: 0,
    total: 1,
    color: '#667eea',
    autoCalcType: ''
  })
}

const removeIndicator = (index: number) => {
  configIndicators.value.splice(index, 1)
}

const addManualRisk = () => {
  configManualRisks.value.push({
    id: `manual_${Date.now()}`,
    appName: '',
    riskType: 'custom',
    description: '',
    severity: 'medium'
  })
}

const removeManualRisk = (index: number) => {
  configManualRisks.value.splice(index, 1)
}

const handleAutoCalcChange = (index: number) => {
  const indicator = configIndicators.value[index]
  const calcType = indicator.autoCalcType

  if (!calcType) {
    return
  }

  const data = autoCalcData.value

  // Only auto-fill the numerator (completed), user sets the denominator (total)
  switch (calcType) {
    case 'cloud_native_2025':
      indicator.completed = data.cloudNative2025Completed
      break
    case 'ak_2025':
      indicator.completed = data.ak2025Completed
      break
    case 'all_2025':
      indicator.completed = data.year2025Completed
      break
    case 'all_2024_2025':
      indicator.completed = data.year20242025Completed
      break
    case 'cloud_native_total':
      indicator.completed = data.cloudNativeCompleted
      break
    case 'ak_total':
      indicator.completed = data.akCompleted
      break
    case 'all_total':
      indicator.completed = data.completed
      break
  }

  // Calculate percentage based on user-provided total
  indicator.percentage = indicator.total > 0
    ? Math.round((indicator.completed / indicator.total) * 100)
    : 0
}

// Watch for changes in config indicators to update percentage
watch(
  () => configIndicators.value,
  (newIndicators) => {
    newIndicators.forEach(indicator => {
      // Always recalculate percentage when completed or total changes
      indicator.percentage = indicator.total > 0
        ? Math.round((indicator.completed / indicator.total) * 100)
        : 0
    })
  },
  { deep: true }
)

// Initialize
onMounted(() => {
  // Set report date (current date or last day of previous bi-week period)
  const today = new Date()
  reportDate.value = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

  // Load saved indicators configuration FIRST
  const savedIndicatorsConfig = localStorage.getItem('report_indicators_config')
  if (savedIndicatorsConfig) {
    try {
      const parsedConfig = JSON.parse(savedIndicatorsConfig)
      keyIndicators.value = parsedConfig.map((indicator: KeyIndicatorConfig) => {
        // Calculate percentage
        const percentage = indicator.total > 0
          ? Math.round((indicator.completed / indicator.total) * 100)
          : 0

        return {
          name: indicator.name,
          completed: indicator.completed,
          total: indicator.total,
          percentage,
          color: indicator.color
        }
      })
    } catch (error) {
      console.error('Failed to load indicators config:', error)
      keyIndicators.value = []
    }
  }

  // Load saved risk configuration
  const savedRiskConfig = localStorage.getItem('report_risk_config')
  if (savedRiskConfig) {
    try {
      riskConfig.value = JSON.parse(savedRiskConfig)
    } catch (error) {
      console.error('Failed to load risk config:', error)
    }
  }

  // Load saved manual risks
  const savedManualRisks = localStorage.getItem('report_manual_risks')
  if (savedManualRisks) {
    try {
      manualRiskItems.value = JSON.parse(savedManualRisks)
    } catch (error) {
      console.error('Failed to load manual risks:', error)
    }
  }

  // Load data
  loadReportData()
})
</script>

<style scoped>
.reports-view {
  padding: 16px;
  background: #f7fafc;
  min-height: 100vh;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background: white;
  padding: 14px 16px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.title-section h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
}

.subtitle {
  margin: 3px 0 0 0;
  font-size: 12px;
  color: #718096;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.main-cards {
  margin-bottom: 14px;
}

/* Overview Card */
.overview-card {
  height: 100%;
}

.pie-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 0;
}

.pie-chart {
  width: 100%;
  height: 210px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  gap: 11px;
  margin-top: 16px;
  padding: 0 8px;
}

.status-item {
  text-align: center;
}

.status-count {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
}

.status-count.status-requirement { color: #a0aec0; }
.status-count.status-development { color: #ed8936; }
.status-count.status-completed { color: #48bb78; }
.status-count.status-online { color: #3182ce; }
.status-count.status-offline { color: #805ad5; }
.status-count.status-not-started { color: #cbd5e0; }
.status-count.status-blocked { color: #f56565; }

.status-label {
  font-size: 11px;
  color: #718096;
}

.status-detail {
  font-size: 10px;
  color: #a0aec0;
  margin-top: 3px;
}

.total-apps {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #2d3748;
  font-weight: 600;
  padding: 8px;
  background: #f7fafc;
  border-radius: 4px;
}

/* Indicators Card */
.indicators-card {
  height: 100%;
}

.empty-indicators {
  padding: 28px 14px;
  min-height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicators-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 8px 0;
}

.indicator-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.indicator-name {
  font-size: 12px;
  font-weight: 600;
  color: #2d3748;
}

.indicator-progress {
  position: relative;
}

.indicator-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.indicator-stats .percentage {
  font-size: 17px;
  font-weight: 700;
  color: #667eea;
}

.indicator-stats .fraction {
  font-size: 12px;
  color: #718096;
}

/* Risk Section */
.risk-section {
  margin-top: 14px;
}

.no-risk {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 22px;
  color: #48bb78;
  font-size: 13px;
}

.no-risk .el-icon {
  font-size: 17px;
}

.risk-category {
  margin-bottom: 16px;
}

.risk-category:last-child {
  margin-bottom: 0;
}

.risk-category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 11px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.risk-category-header.delayed {
  background: #fff5f5;
  border-left: 4px solid #f56565;
}

.risk-category-header.potential {
  background: #fffaf0;
  border-left: 4px solid #ed8936;
}

.risk-category-header.custom {
  background: #f0f4ff;
  border-left: 4px solid #667eea;
}

.risk-title {
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
}

.risk-count {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 3px;
}

.risk-category-header.delayed .risk-count {
  color: #f56565;
}

.risk-category-header.potential .risk-count {
  color: #ed8936;
}

.trend-up {
  font-size: 11px;
}

.no-risk-message {
  text-align: center;
  padding: 22px;
  color: #a0aec0;
  font-size: 12px;
}

.risk-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
  gap: 11px;
}

.risk-item {
  padding: 11px;
  border-radius: 4px;
  border-left: 3px solid;
}

.risk-item.delayed-item {
  background: #fff5f5;
  border-left-color: #f56565;
}

.risk-item.potential-item {
  background: #fffaf0;
  border-left-color: #ed8936;
}

.risk-item.custom-item {
  background: #f0f4ff;
  border-left-color: #667eea;
}

.risk-item.severity-high {
  border-left-width: 4px;
}

.risk-item.severity-medium {
  border-left-width: 3px;
}

.risk-item.severity-low {
  border-left-width: 2px;
}

.risk-item .app-name {
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  font-size: 11px;
}

.detail-row .label {
  color: #718096;
  min-width: 56px;
}

.detail-row .value {
  color: #2d3748;
  flex: 1;
}

.detail-row .value.highlight {
  color: #f56565;
  font-weight: 600;
}

/* AI Report Dialog Styles */
.ai-report-content {
  max-height: 420px;
  overflow-y: auto;
  padding: 14px;
  background: #f7fafc;
  border-radius: 6px;
  line-height: 1.6;
}

.ai-report-content :deep(.formatted-content) {
  color: #2d3748;
  font-size: 12px;
}

.ai-report-content :deep(p) {
  margin-bottom: 11px;
}

.ai-report-content :deep(strong) {
  color: #1a202c;
  font-weight: 600;
}

.ai-report-content :deep(em) {
  color: #667eea;
  font-style: normal;
}

.ai-report-content :deep(ul) {
  margin: 8px 0;
  padding-left: 17px;
}

.ai-report-content :deep(li) {
  margin: 6px 0;
  list-style-type: disc;
}

.ai-report-content :deep(br) {
  line-height: 1.6;
}

@media (max-width: 768px) {
  .reports-view {
    padding: 8px;
  }

  .report-header {
    flex-direction: column;
    gap: 11px;
    align-items: flex-start;
  }

  .action-buttons {
    width: 100%;
    flex-wrap: wrap;
  }

  .action-buttons button {
    flex: 1;
    min-width: 84px;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .risk-items {
    grid-template-columns: 1fr;
  }

  .ai-report-content {
    max-height: 280px;
  }
}
</style>
