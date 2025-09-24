<template>
  <div class="import-view">
    <el-card>
      <template #header>
        <div class="header">
          <h2>Excel批量导入</h2>
          <el-button @click="downloadTemplate" :loading="loading">下载模板</el-button>
        </div>
      </template>

      <!-- Import Steps -->
      <div class="steps">
        <el-steps :active="currentStep" align-center>
          <el-step title="选择文件" />
          <el-step title="数据预览" />
          <el-step title="确认导入" />
          <el-step title="导入结果" />
        </el-steps>
      </div>

      <!-- File Upload -->
      <div v-if="currentStep === 0" class="upload-section">
        <el-upload
          class="upload-dragger"
          drag
          accept=".xlsx,.xls"
          :auto-upload="false"
          :on-change="handleFileChange"
        >
          <div class="upload-content">
            <div class="upload-icon">📁</div>
            <div class="upload-text">
              <strong>拖拽文件到此处或点击选择</strong>
            </div>
            <div class="upload-hint">
              支持 .xlsx, .xls 格式，文件大小不超过 10MB
            </div>
          </div>
        </el-upload>

        <el-row :gutter="20" class="import-options">
          <el-col :span="12">
            <el-form-item label="导入模式">
              <el-select v-model="importOptions.mode" placeholder="请选择导入模式">
                <el-option value="append" label="追加（保留现有数据）" />
                <el-option value="replace" label="覆盖（替换现有数据）" />
                <el-option value="update" label="更新（根据L2 ID匹配更新）" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="导入类型">
              <el-select v-model="importOptions.importType" placeholder="请选择导入类型">
                <el-option value="complete" label="完整导入（应用+子任务）" />
                <el-option value="applications" label="仅导入应用表" />
                <el-option value="subtasks" label="仅导入子任务表" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-checkbox v-model="importOptions.validateOnly" class="validate-checkbox">
          <div class="checkbox-hint">
            <strong>先验证数据（推荐）</strong>
            勾选后将先进行数据验证，显示错误和警告，确认无误后再导入
          </div>
        </el-checkbox>

        <div class="step-actions">
          <el-button type="primary" @click="nextStep" :disabled="!selectedFile || loading" :loading="loading">
            开始验证
          </el-button>
        </div>
      </div>

      <!-- Validation Results -->
      <div v-if="currentStep === 1" class="preview-section">
        <h3>验证结果</h3>

        <el-alert
          :type="importResult.failed > 0 ? 'warning' : 'success'"
          :closable="false"
          class="validation-summary"
        >
          <template #title>
            📊 验证摘要：
            总记录 <strong>{{ importResult.total }}</strong> 条 |
            有效记录 <strong>{{ importResult.success }}</strong> 条 |
            错误记录 <strong>{{ importResult.failed }}</strong> 条
            <span v-if="importResult.updated > 0"> | 更新记录 <strong>{{ importResult.updated }}</strong> 条</span>
            <span v-if="importResult.skipped > 0"> | 跳过记录 <strong>{{ importResult.skipped }}</strong> 条</span>
          </template>
        </el-alert>

        <!-- Enhanced dual-sheet statistics for complete import -->
        <div v-if="importOptions.importType === 'complete' && (importResult.applications || importResult.subtasks)" class="dual-sheet-summary">
          <el-row :gutter="20">
            <el-col :span="12" v-if="importResult.applications">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>📋 总追踪表（应用数据）</span>
                  </div>
                </template>
                <div class="stats-content">
                  <div class="stat-item">
                    <span class="stat-label">总行数：</span>
                    <span class="stat-value">{{ importResult.applications.total_rows }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">导入成功：</span>
                    <span class="stat-value success">{{ importResult.applications.imported }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">更新记录：</span>
                    <span class="stat-value info">{{ importResult.applications.updated }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">跳过记录：</span>
                    <span class="stat-value warning">{{ importResult.applications.skipped }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12" v-if="importResult.subtasks">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>📝 子追踪表（子任务数据）</span>
                  </div>
                </template>
                <div class="stats-content">
                  <div class="stat-item">
                    <span class="stat-label">总行数：</span>
                    <span class="stat-value">{{ importResult.subtasks.total_rows }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">导入成功：</span>
                    <span class="stat-value success">{{ importResult.subtasks.imported }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">更新记录：</span>
                    <span class="stat-value info">{{ importResult.subtasks.updated }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">跳过记录：</span>
                    <span class="stat-value warning">{{ importResult.subtasks.skipped }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div v-if="importResult.errors.length > 0" class="error-preview">
          <h4>错误详情（前10条）</h4>
          <el-table :data="importResult.errors.slice(0, 10)" style="width: 100%" max-height="300">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="column" label="字段" width="150" />
            <el-table-column prop="message" label="错误信息" />
            <el-table-column label="数据" width="200">
              <template #default="{ row }">
                <el-tooltip :content="String(row.value || 'No data')" placement="top">
                  <span>{{ row.value || 'No data' }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="importResult.skippedItems.length > 0" class="skipped-preview">
          <h4>跳过的记录（前10条）</h4>
          <el-table :data="importResult.skippedItems.slice(0, 10)" style="width: 100%" max-height="300">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="reason" label="跳过原因" />
            <el-table-column label="数据" width="300">
              <template #default="{ row }">
                <el-tooltip v-if="row.data" :content="JSON.stringify(row.data, null, 2)" placement="top">
                  <span style="font-family: monospace; font-size: 12px;">
                    {{ Object.keys(row.data).slice(0, 3).map(k => `${k}: ${row.data[k]}`).join(', ') }}{{ Object.keys(row.data).length > 3 ? '...' : '' }}
                  </span>
                </el-tooltip>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button
            type="primary"
            @click="nextStep"
            :disabled="loading"
            :loading="loading"
          >
            {{ importResult.failed > 0 ? '忽略错误并导入' : '确认导入' }}
          </el-button>
        </div>
      </div>

      <!-- Import Result -->
      <div v-if="currentStep === 3" class="result-section">
        <el-result
          icon="success"
          title="导入完成"
          :sub-title="`成功导入 ${importResult.imported} 条记录，更新 ${importResult.updated} 条，跳过 ${importResult.skipped} 条，失败 ${importResult.failed} 条`"
        >
          <template #extra>
            <el-button type="primary" @click="resetImport">重新导入</el-button>
            <el-button @click="downloadErrorReport" v-if="importResult.failed > 0 || importResult.skippedItems.length > 0">
              下载导入报告
            </el-button>
          </template>
        </el-result>

        <div v-if="importResult.errors.length > 0" class="error-list">
          <h4>错误详情</h4>
          <el-table :data="importResult.errors" style="width: 100%" max-height="400">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="column" label="字段" width="150" />
            <el-table-column prop="message" label="错误信息" />
            <el-table-column label="数据" width="300">
              <template #default="{ row }">
                <el-tooltip :content="String(row.value || 'No data')" placement="top">
                  <span style="font-family: monospace; font-size: 12px;">
                    {{ row.value ? String(row.value).substring(0, 50) + (String(row.value).length > 50 ? '...' : '') : 'No data' }}
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="importResult.skippedItems.length > 0" class="skipped-list">
          <h4>跳过的记录</h4>
          <el-table :data="importResult.skippedItems" style="width: 100%" max-height="400">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="reason" label="跳过原因" />
            <el-table-column label="数据" width="400">
              <template #default="{ row }">
                <el-tooltip v-if="row.data" :content="JSON.stringify(row.data, null, 2)" placement="top">
                  <span style="font-family: monospace; font-size: 12px;">
                    {{ Object.keys(row.data).slice(0, 3).map(k => `${k}: ${row.data[k]}`).join(', ') }}{{ Object.keys(row.data).length > 3 ? '...' : '' }}
                  </span>
                </el-tooltip>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { ExcelAPI } from '@/api/reports'
import { APPLICATION_FIELD_MAPPING, SUBTASK_FIELD_MAPPING } from '@/utils/excelFieldMapping'

const currentStep = ref(0)
const selectedFile = ref<UploadFile | null>(null)
const loading = ref(false)

const importOptions = reactive({
  mode: 'append',
  importType: 'complete' as 'complete' | 'applications' | 'subtasks',
  validateOnly: true
})

const previewData = ref<any[]>([])

const importResult = reactive({
  total: 0,
  success: 0,
  failed: 0,
  imported: 0,
  updated: 0,
  skipped: 0,
  processing_time_ms: 0,
  applications: null as {
    total_rows: number
    imported: number
    updated: number
    skipped: number
  } | null,
  subtasks: null as {
    total_rows: number
    imported: number
    updated: number
    skipped: number
  } | null,
  errors: [] as Array<{ row: number; error?: string; message?: string; column?: string; value?: any; sheet?: string; data?: Record<string, any> }>,
  skippedItems: [] as Array<{ row: number; reason: string; data?: Record<string, any>; sheet?: string }>
})

const handleFileChange = (file: UploadFile) => {
  selectedFile.value = file
  ElMessage.success(`已选择文件：${file.name}`)
  console.log('🔍 [ImportView] File selected:', {
    name: file.name,
    size: file.size,
    type: file.raw?.type
  })
}

const downloadTemplate = async () => {
  const loadingInstance = ElLoading.service({
    text: '正在下载模板...'
  })

  try {
    console.log('🔍 [ImportView] Downloading template for:', importOptions.importType)

    // For complete import, download applications template
    const templateType = importOptions.importType === 'complete' ? 'applications' : importOptions.importType
    await ExcelAPI.downloadTemplate(templateType as 'applications' | 'subtasks')

    const templateName = importOptions.importType === 'complete' ? '完整导入' :
                        importOptions.importType === 'applications' ? '应用' : '子任务'
    ElMessage.success(`${templateName}模板下载成功`)

    loadingInstance.close()
  } catch (error: any) {
    loadingInstance.close()
    console.error('❌ [ImportView] Template download failed:', error)

    if (error?.response?.status === 404) {
      ElMessage.error('模板文件不存在，请联系管理员')
    } else if (error?.response?.status === 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else {
      ElMessage.error(`模板下载失败: ${error?.response?.data?.detail || error?.message || '未知错误'}`)
    }
  }
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    // Step 1: Validate file and preview data
    if (!selectedFile.value?.raw) {
      ElMessage.error('请先选择文件')
      return
    }

    loading.value = true
    // Show warning for large files
    if (selectedFile.value?.size && selectedFile.value.size > 1048576) { // > 1MB
      const sizeMB = (selectedFile.value.size / 1048576).toFixed(1)
      ElMessage.info(`文件较大 (${sizeMB}MB)，处理可能需要较长时间，请耐心等待...`)
    }
    try {
      console.log('🔍 [ImportView] Starting validation import for:', importOptions.importType)
      console.log('📁 [ImportView] File details:', {
        name: selectedFile.value?.name,
        size: selectedFile.value?.size,
        type: selectedFile.value?.raw?.type,
        lastModified: selectedFile.value?.raw?.lastModified
      })

      const importParams = {
        file: selectedFile.value.raw,
        update_existing: importOptions.mode === 'update',
        validate_only: true // Always validate first
      }

      let response
      if (importOptions.importType === 'complete') {
        response = await ExcelAPI.importCompleteExcel(importParams)
      } else if (importOptions.importType === 'applications') {
        response = await ExcelAPI.importApplications(importParams)
      } else {
        response = await ExcelAPI.importSubTasks(importParams)
      }

      console.log('📊 [ImportView] Validation response:', response)

      // Handle actual backend response format (differs from API_INTEGRATION_GUIDE.md)
      console.log('🔍 [ImportView] Actual backend response format:', Object.keys(response))

      // Check for additional debug information
      if (response && 'warnings' in response && Array.isArray(response.warnings) && response.warnings.length > 0) {
        console.log('⚠️ [ImportView] Backend warnings:', response.warnings)
      }
      if (response && 'preview_data' in response && response.preview_data) {
        console.log('👁️ [ImportView] Backend preview data:', response.preview_data)
      }
      if (response.processing_time_ms) {
        console.log('⏱️ [ImportView] Backend processing time:', response.processing_time_ms, 'ms')
      }

      // Log detailed breakdown to understand why total_rows is 0
      console.log('🔍 [ImportView] Detailed breakdown analysis:')
      console.log('🔍 Applications result:', response.applications)
      console.log('🔍 Subtasks result:', response.subtasks)
      console.log('🔍 Total errors:', response.errors?.length || 0)
      console.log('🔍 Success flag:', response.success)
      console.log('🔍 Total rows:', response.total_rows)
      console.log('🔍 Warnings:', response.warnings)
      if (response.errors && response.errors.length > 0) {
        console.log('🔍 First 3 errors:', response.errors.slice(0, 3))
        // Show detailed error content
        console.log('🔍 [ImportView] Detailed error analysis:')
        response.errors.slice(0, 3).forEach((error: any, index: number) => {
          console.log(`   Error ${index + 1}:`, error)
          if (typeof error === 'object') {
            console.log('     Error properties:', Object.keys(error))
            console.log('     Error content:', JSON.stringify(error, null, 2))
          }
        })
      }

      // Handle enhanced response format with dual-sheet support
      const mappedResponse = {
        total: response.total_rows || 0,
        imported: response.processed_rows || response.imported || 0,
        updated: response.updated_rows || response.updated || 0,
        skipped: response.skipped_rows || response.skipped || 0,
        processing_time_ms: response.processing_time_ms || 0,
        applications: response.applications || null,
        subtasks: response.subtasks || null,
        errors: response.errors || [],
        success: response.success || response.status === 'success'
      }

      console.log('🔄 [ImportView] Mapped response with dual-sheet support:', mappedResponse)

      // Check if validation was successful
      if (!mappedResponse.success && mappedResponse.total === 0) {
        // For dual-sheet imports, check if either table has data
        const hasApplicationsData = mappedResponse.applications && typeof mappedResponse.applications.total_rows === 'number' && mappedResponse.applications.total_rows > 0
        const hasSubtasksData = mappedResponse.subtasks && typeof mappedResponse.subtasks.total_rows === 'number' && mappedResponse.subtasks.total_rows > 0

        // Check if there were skipped rows (backend processing error)
        const skippedCount = mappedResponse.skipped ||
          (mappedResponse.applications?.skipped || 0) + (mappedResponse.subtasks?.skipped || 0)

        if (skippedCount > 0) {
          throw new Error(`后端处理错误：${skippedCount} 条记录处理失败。\n\n这通常是由于：\n1. 后端数据库连接问题\n2. 异步处理错误（greenlet_spawn）\n3. 数据验证失败\n\n请联系系统管理员检查后端日志。\n\n临时解决方案：\n- 将Excel文件拆分成更小的批次（每次100行）\n- 逐批导入数据`)
        }

        if (!hasApplicationsData && !hasSubtasksData) {
          // Check if there are specific errors from backend
          if (response.errors && response.errors.length > 0) {
            const errorDetails = response.errors.map((err: any, idx: number) => {
              if (typeof err === 'string') return `${idx + 1}. ${err}`
              if (err.message) return `${idx + 1}. ${err.message}`
              if (err.error) return `${idx + 1}. ${err.error}`
              return `${idx + 1}. ${JSON.stringify(err)}`
            }).join('\n')
            throw new Error(`文件处理失败，后端返回错误：\n\n${errorDetails}`)
          }

          // Check if there are warnings that might explain the issue
          if (response.warnings && response.warnings.length > 0) {
            const warningDetails = response.warnings.join('\n')
            throw new Error(`文件处理失败，后端警告：\n\n${warningDetails}\n\n请检查：\n1. Excel文件是否包含“总追踪表（勿动）”或“子追踪表”sheet\n2. 数据是否从第2行开始（第1行为列名）\n3. 列名是否为中文`)
          }

          const expectedFields = importOptions.importType === 'applications'
            ? Object.keys(APPLICATION_FIELD_MAPPING)
            : Object.keys(SUBTASK_FIELD_MAPPING)
          const sheetName = importOptions.importType === 'applications' ? '总追踪表（勿动）' : '子追踪表'
          const fieldMappingHint = `\n\n预期的Excel列名（${sheetName}）：\n${expectedFields.slice(0, 10).join(', ')} 等\n\n注意：\n1. Excel需要包含“总追踪表（勿动）”或“子追踪表”sheet\n2. 列名必须为中文\n3. 数据从第2行开始`

          throw new Error('文件验证失败：无法识别Excel数据。可能原因：\n1. 文件为空或没有数据行\n2. Sheet名称不正确（需要“总追踪表（勿动）”或“子追踪表”）\n3. Excel列名与预期不匹配\n4. 文件编码问题' + fieldMappingHint)
        }
      }

      // Update import result with validation data
      importResult.total = mappedResponse.total
      importResult.success = mappedResponse.imported + mappedResponse.updated
      importResult.failed = mappedResponse.errors.length
      importResult.imported = mappedResponse.imported
      importResult.updated = mappedResponse.updated
      importResult.skipped = mappedResponse.skipped
      importResult.processing_time_ms = mappedResponse.processing_time_ms
      importResult.applications = mappedResponse.applications
      importResult.subtasks = mappedResponse.subtasks
      importResult.errors = mappedResponse.errors
      importResult.skippedItems = mappedResponse.skipped_items || []

      currentStep.value = 1

      if (mappedResponse.errors.length > 0) {
        ElMessage.warning(`文件验证完成，发现 ${mappedResponse.errors.length} 个问题`)
      } else {
        ElMessage.success('文件验证完成，数据格式正确')
      }
    } catch (error: any) {
      console.error('❌ [ImportView] Validation failed:', error)
      // Check if it's a timeout error
      if (error?.code === 'ECONNABORTED' && error?.message?.includes('timeout')) {
        ElMessage.error(`文件太大，处理超时。请稍后重试或联系管理员增加服务器处理能力。`)
      } else if (error?.message?.includes('后端处理错误')) {
        // Backend processing error
        ElMessageBox.alert(
          error.message,
          '后端处理错误',
          {
            confirmButtonText: '我知道了',
            type: 'error',
            dangerouslyUseHTMLString: false
          }
        )
      } else {
        ElMessage.error(`文件验证失败: ${error?.response?.data?.detail || error?.message || '未知错误'}`)
      }
    } finally {
      loading.value = false
    }
  } else if (currentStep.value === 1) {
    // Step 2: Perform actual import
    if (importResult.errors.length > 0 && !await confirmImportWithErrors()) {
      return
    }

    currentStep.value = 2
    ElMessage.info('正在导入数据...')

    loading.value = true
    try {
      console.log('🔍 [ImportView] Starting actual import for:', importOptions.importType)

      const importParams = {
        file: selectedFile.value!.raw!,
        update_existing: importOptions.mode === 'update',
        validate_only: false // Actual import
      }

      let response
      if (importOptions.importType === 'complete') {
        response = await ExcelAPI.importCompleteExcel(importParams)
      } else if (importOptions.importType === 'applications') {
        response = await ExcelAPI.importApplications(importParams)
      } else {
        response = await ExcelAPI.importSubTasks(importParams)
      }

      console.log('📊 [ImportView] Import response:', response)

      // Handle actual backend response format
      const mappedImportResponse = {
        imported: response.processed_rows || response.imported || 0,
        updated: response.updated_rows || response.updated || 0,
        skipped: response.skipped_rows || response.skipped || 0,
        errors: response.errors || [],
        success: response.success || response.status === 'success'
      }

      console.log('🔄 [ImportView] Mapped import response:', mappedImportResponse)

      // Update final results
      importResult.imported = mappedImportResponse.imported
      importResult.updated = mappedImportResponse.updated
      importResult.skipped = mappedImportResponse.skipped
      importResult.errors = mappedImportResponse.errors
      importResult.skippedItems = mappedImportResponse.skipped_items || []
      importResult.success = mappedImportResponse.imported + mappedImportResponse.updated
      importResult.failed = mappedImportResponse.errors.length

      currentStep.value = 3
      ElMessage.success('导入完成')
    } catch (error: any) {
      console.error('❌ [ImportView] Import failed:', error)
      ElMessage.error(`导入失败: ${error?.response?.data?.detail || error?.message || '未知错误'}`)
      currentStep.value = 1 // Go back to preview step
    } finally {
      loading.value = false
    }
  }
}

const confirmImportWithErrors = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    ElMessage.warning({
      message: `检测到 ${importResult.errors.length} 个错误，是否继续导入有效数据？`,
      duration: 0,
      showClose: true,
      type: 'warning'
    })
    // For now, allow import with errors
    resolve(true)
  })
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const resetImport = () => {
  currentStep.value = 0
  selectedFile.value = null
  importResult.total = 0
  importResult.success = 0
  importResult.failed = 0
  importResult.imported = 0
  importResult.updated = 0
  importResult.skipped = 0
  importResult.errors = []
  importResult.skippedItems = []
  previewData.value = []
}

const downloadErrorReport = () => {
  if (importResult.errors.length === 0 && importResult.skippedItems.length === 0) {
    ElMessage.info('无错误或跳过的数据')
    return
  }

  let csvContent = ''
  
  // Add errors section
  if (importResult.errors.length > 0) {
    csvContent += '=== 错误记录 ===\n'
    const errorReport = importResult.errors.map(error => ({
      '行号': error.row,
      '字段': error.column || '-',
      '错误信息': error.message || error.error || '未知错误',
      '数据': String(error.value || error.data || '-')
    }))
    
    csvContent += Object.keys(errorReport[0] || {}).join(',') + '\n'
    csvContent += errorReport.map(row => Object.values(row).join(',')).join('\n')
  }
  
  // Add skipped items section
  if (importResult.skippedItems.length > 0) {
    if (csvContent) csvContent += '\n\n'
    csvContent += '=== 跳过的记录 ===\n'
    const skippedReport = importResult.skippedItems.map(item => ({
      '行号': item.row,
      '跳过原因': item.reason,
      '数据': item.data ? JSON.stringify(item.data) : '-'
    }))
    
    csvContent += Object.keys(skippedReport[0] || {}).join(',') + '\n'
    csvContent += skippedReport.map(row => Object.values(row).join(',')).join('\n')
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `import_report_${new Date().toISOString().split('T')[0]}.csv`
  link.click()

  ElMessage.success('导入报告下载成功')
}
</script>

<style scoped>
.import-view {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  color: #2d3748;
}

.steps {
  margin: 40px 0;
}

.upload-section,
.preview-section,
.result-section {
  margin-top: 40px;
}

.upload-dragger {
  width: 100%;
}

.upload-content {
  padding: 60px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.upload-text {
  font-size: 18px;
  margin-bottom: 10px;
}

.upload-hint {
  color: #718096;
  font-size: 14px;
}

.import-options {
  margin: 30px 0;
}

.validate-checkbox {
  background: #f0f4ff;
  border-radius: 8px;
  display: block;
}

.checkbox-hint {
  margin-top: 5px;
  color: #718096;
  font-size: 14px;
  font-weight: normal;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
}

.error-list {
  margin-top: 30px;
}

.error-list h4 {
  color: #e53e3e;
  margin-bottom: 15px;
}

.skipped-list {
  margin-top: 30px;
}

.skipped-list h4 {
  color: #ed8936;
  margin-bottom: 15px;
}

.validation-summary {
  margin-bottom: 20px;
}

.error-preview {
  margin-top: 20px;
}

.error-preview h4 {
  color: #e53e3e;
  margin-bottom: 15px;
}

.skipped-preview {
  margin-top: 20px;
}

.skipped-preview h4 {
  color: #ed8936;
  margin-bottom: 15px;
}

.field-mapping-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.field-mapping-info h4 {
  margin: 0 0 15px 0;
  color: #0369a1;
}

.field-mapping-info p {
  margin: 10px 0;
  color: #374151;
}

.mapping-examples {
  margin: 15px 0;
}

.mapping-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  font-size: 12px;
}

.excel-field {
  color: #059669;
  font-weight: bold;
  flex: 1;
}

.arrow {
  color: #6b7280;
  margin: 0 8px;
}

.api-field {
  color: #7c3aed;
  font-family: monospace;
  flex: 1;
  text-align: right;
}

.mapping-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #059669;
  font-weight: bold;
  margin-top: 15px;
}

/* Dual-sheet statistics styles */
.dual-sheet-summary {
  margin: 20px 0;
}

.dual-sheet-summary .card-header {
  font-weight: bold;
  color: #2d3748;
}

.stats-content {
  padding: 10px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #718096;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #2d3748;
}

.stat-value.success {
  color: #48bb78;
}

.stat-value.info {
  color: #4299e1;
}

.stat-value.warning {
  color: #ed8936;
}
</style>