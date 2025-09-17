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
          <strong>先验证数据（推荐）</strong>
          <div class="checkbox-hint">
            勾选后将先进行数据验证，显示错误和警告，确认无误后再导入
          </div>
        </el-checkbox>

        <!-- Field Mapping Info -->
        <div v-if="selectedFile" class="field-mapping-info">
          <h4>🔄 字段映射说明</h4>
          <p>系统将自动映射您Excel文件中的中文列名到API字段：</p>
          <el-row :gutter="10" class="mapping-examples">
            <el-col :span="8" v-for="(apiField, excelField) in Object.fromEntries(Object.entries(EXCEL_FIELD_MAPPING || {}).slice(0, 6))" :key="excelField">
              <div class="mapping-item">
                <span class="excel-field">{{ excelField }}</span>
                <span class="arrow">→</span>
                <span class="api-field">{{ apiField }}</span>
              </div>
            </el-col>
          </el-row>
          <p class="mapping-note">
            <el-icon><Check /></el-icon>
            支持您现有的Excel格式，无需修改列名
          </p>
        </div>

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
            <el-table-column prop="error" label="错误信息" />
            <el-table-column label="数据" width="200">
              <template #default="{ row }">
                <el-tooltip :content="JSON.stringify(row.data || {}, null, 2)" placement="top">
                  <span>{{ row.data ? Object.keys(row.data).slice(0, 2).join(', ') + '...' : 'No data' }}</span>
                </el-tooltip>
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
            <el-button @click="downloadErrorReport" v-if="importResult.failed > 0">
              下载错误报告
            </el-button>
          </template>
        </el-result>

        <div v-if="importResult.errors.length > 0" class="error-list">
          <h4>错误详情</h4>
          <el-table :data="importResult.errors" style="width: 100%" max-height="400">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="error" label="错误信息" />
            <el-table-column label="数据" width="300">
              <template #default="{ row }">
                <el-tooltip :content="JSON.stringify(row.data || {}, null, 2)" placement="top">
                  <span style="font-family: monospace; font-size: 12px;">
                    {{ row.data ? JSON.stringify(row.data).substring(0, 50) + '...' : 'No data' }}
                  </span>
                </el-tooltip>
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
import { Warning, Check } from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { ExcelAPI } from '@/api/reports'
import { EXCEL_FIELD_MAPPING, getExcelColumns } from '@/utils/excelFieldMapping'

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
  errors: [] as Array<{ row: number; error?: string; message?: string; column?: string; value?: any; sheet?: string; data?: Record<string, any> }>
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
  try {
    const loadingInstance = ElLoading.service({
      text: '正在下载模板...'
    })

    console.log('🔍 [ImportView] Downloading template for:', importOptions.importType)

    // For complete import, download applications template
    const templateType = importOptions.importType === 'complete' ? 'applications' : importOptions.importType
    await ExcelAPI.downloadTemplate(templateType as 'applications' | 'subtasks')

    const templateName = importOptions.importType === 'complete' ? '完整导入' :
                        importOptions.importType === 'applications' ? '应用' : '子任务'
    ElMessage.success(`${templateName}模板下载成功`)

    loadingInstance.close()
  } catch (error: any) {
    console.error('❌ [ImportView] Template download failed:', error)

    if (error?.response?.status === 404) {
      ElMessage.error('模板文件不存在，请联系管理员')
    } else if (error?.response?.status === 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else {
      ElMessage.error(`模板下载失败: ${error?.response?.data?.detail || error?.message || '未知错误'}`)
    }

    loadingInstance.close()
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
    try {
      console.log('🔍 [ImportView] Starting validation import for:', importOptions.importType)

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
      if (response.warnings && response.warnings.length > 0) {
        console.log('⚠️ [ImportView] Backend warnings:', response.warnings)
      }
      if (response.preview_data) {
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
      if (response.errors && response.errors.length > 0) {
        console.log('🔍 First 3 errors:', response.errors.slice(0, 3))
      }

      // Handle enhanced response format with dual-sheet support
      const mappedResponse = {
        total: response.total_rows || response.total || (response.imported || 0) + (response.updated || 0) + (response.skipped || 0),
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
        const hasApplicationsData = mappedResponse.applications?.total_rows > 0
        const hasSubtasksData = mappedResponse.subtasks?.total_rows > 0

        if (!hasApplicationsData && !hasSubtasksData) {
          const expectedFields = Object.keys(EXCEL_FIELD_MAPPING)
          const fieldMappingHint = `\n\n预期的Excel列名：\n${expectedFields.slice(0, 6).join(', ')} 等\n\n您的Excel应包含这些中文列名，系统会自动进行字段映射。`

          throw new Error('文件验证失败：无法识别Excel数据。可能原因：\n1. 文件为空或没有数据行\n2. Excel列名与预期不匹配\n3. 文件编码问题' + fieldMappingHint)
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

      currentStep.value = 1

      if (mappedResponse.errors.length > 0) {
        ElMessage.warning(`文件验证完成，发现 ${mappedResponse.errors.length} 个问题`)
      } else {
        ElMessage.success('文件验证完成，数据格式正确')
      }
    } catch (error: any) {
      console.error('❌ [ImportView] Validation failed:', error)
      ElMessage.error(`文件验证失败: ${error?.response?.data?.detail || error?.message || '未知错误'}`)
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
  previewData.value = []
}

const downloadErrorReport = () => {
  if (importResult.errors.length === 0) {
    ElMessage.info('无错误数据')
    return
  }

  const errorReport = importResult.errors.map(error => ({
    '行号': error.row,
    '错误信息': error.error,
    '数据': JSON.stringify(error.data)
  }))

  const csv = [
    Object.keys(errorReport[0]).join(','),
    ...errorReport.map(row => Object.values(row).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`
  link.click()

  ElMessage.success('错误报告下载成功')
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
  padding: 15px;
  border-radius: 8px;
  display: block;
  margin: 20px 0;
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