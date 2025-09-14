<template>
  <div class="import-view">
    <el-card>
      <template #header>
        <div class="header">
          <h2>Excel批量导入</h2>
          <el-button>下载模板</el-button>
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
            <el-form-item label="表类型">
              <el-select v-model="importOptions.sheetType" placeholder="请选择表类型">
                <el-option value="main" label="主表（应用表）" />
                <el-option value="detail" label="子表（任务表）" />
                <el-option value="both" label="主表和子表" />
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

        <div class="step-actions">
          <el-button type="primary" @click="nextStep" :disabled="!selectedFile">
            开始导入
          </el-button>
        </div>
      </div>

      <!-- Preview Data -->
      <div v-if="currentStep === 1" class="preview-section">
        <h3>数据预览</h3>
        <el-table :data="previewData" style="width: 100%" max-height="400">
          <el-table-column prop="l2_id" label="L2 ID" width="120" />
          <el-table-column prop="app_name" label="应用名称" width="180" />
          <el-table-column prop="transformation_target" label="改造目标" width="100" />
          <el-table-column prop="responsible_team" label="负责团队" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-icon v-if="row.hasError" color="red"><warning /></el-icon>
              <el-icon v-else color="green"><check /></el-icon>
            </template>
          </el-table-column>
        </el-table>

        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">确认导入</el-button>
        </div>
      </div>

      <!-- Import Result -->
      <div v-if="currentStep === 3" class="result-section">
        <el-result
          icon="success"
          title="导入完成"
          :sub-title="`成功导入 ${importResult.success} 条记录，失败 ${importResult.failed} 条`"
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
          <el-table :data="importResult.errors" style="width: 100%">
            <el-table-column prop="row" label="行号" width="80" />
            <el-table-column prop="field" label="字段" width="120" />
            <el-table-column prop="message" label="错误信息" />
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Warning, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'

const currentStep = ref(0)
const selectedFile = ref<UploadFile | null>(null)

const importOptions = reactive({
  mode: 'append',
  sheetType: 'main',
  validateOnly: true
})

const previewData = ref([
  {
    l2_id: 'L2_APP_005',
    app_name: '测试导入系统',
    transformation_target: '云原生',
    responsible_team: '研发一部',
    hasError: false
  },
  {
    l2_id: 'L2_APP_006',
    app_name: '财务系统',
    transformation_target: 'AK',
    responsible_team: '研发二部',
    hasError: false
  }
])

const importResult = reactive({
  total: 0,
  success: 0,
  failed: 0,
  errors: [
    { row: 5, field: 'l2_id', message: 'L2 ID已存在' },
    { row: 8, field: 'supervision_year', message: '年份格式不正确' }
  ] as Array<{ row: number; field: string; message: string }>
})

const handleFileChange = (file: UploadFile) => {
  selectedFile.value = file
  ElMessage.success(`已选择文件：${file.name}`)
}

const nextStep = () => {
  if (currentStep.value === 0) {
    // Simulate file parsing
    currentStep.value = 1
    ElMessage.success('文件解析成功')
  } else if (currentStep.value === 1) {
    // Simulate import process
    currentStep.value = 2
    ElMessage.info('正在导入数据...')
    
    setTimeout(() => {
      currentStep.value = 3
      importResult.total = 100
      importResult.success = 98
      importResult.failed = 2
      ElMessage.success('导入完成')
    }, 2000)
  }
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
  importResult.errors = []
}

const downloadErrorReport = () => {
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
</style>