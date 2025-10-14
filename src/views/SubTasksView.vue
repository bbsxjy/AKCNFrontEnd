<template>
  <div class="subtasks-view">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="header-top">
        <el-button class="back-button" @click="goBack" text>
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </div>
      <div class="header-main">
        <div class="header-info">
          <h1>{{ applicationName }}</h1>
          <div class="header-meta">
            <el-tag type="info">{{ l2Id }}</el-tag>
            <el-tag :type="application?.overall_transformation_target === 'AK' ? 'primary' : 'success'">
              {{ application?.overall_transformation_target || 'AK' }}
            </el-tag>
            <el-tag type="warning" v-if="application?.ak_supervision_acceptance_year">
              {{ application.ak_supervision_acceptance_year }}年监管
            </el-tag>
            <span class="team-info" v-if="application?.dev_team">
              <el-icon><User /></el-icon>
              {{ application.dev_team }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" size="large" @click="showCreateTaskDialog">
            <el-icon><plus /></el-icon>
            新增子任务
          </el-button>
          <el-dropdown trigger="click" placement="bottom-end">
            <el-button size="large" circle>
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="exportData">
                  <el-icon><Download /></el-icon>
                  导出数据
                </el-dropdown-item>
                <el-dropdown-item @click="refreshData">
                  <el-icon><Refresh /></el-icon>
                  刷新数据
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-icon blue">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ safeStatistics.total }}</div>
          <div class="stat-label">总任务数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <el-icon><CircleCheckFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ safeStatistics.completed }}</div>
          <div class="stat-label">已完成</div>
          <el-progress :percentage="completedPercentage" :stroke-width="4" :show-text="false" color="#48bb78" />
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ safeStatistics.inProgress }}</div>
          <div class="stat-label">进行中</div>
          <el-progress :percentage="inProgressPercentage" :stroke-width="4" :show-text="false" color="#ed8936" />
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ safeStatistics.blocked }}</div>
          <div class="stat-label">阻塞中</div>
          <el-progress :percentage="blockedPercentage" :stroke-width="4" :show-text="false" color="#f56565" />
        </div>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="main-content">

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
              <el-icon><Grid /></el-icon>
              表格视图
            </el-button>
            <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
              <el-icon><Postcard /></el-icon>
              卡片视图
            </el-button>
          </el-button-group>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索子任务..."
            clearable
            style="width: 200px"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 120px" @change="handleFilter">
            <el-option label="待启动" value="待启动" />
            <el-option label="研发进行中" value="研发进行中" />
            <el-option label="业务上线中" value="业务上线中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="存在阻塞" value="存在阻塞" />
          </el-select>
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-container">
      <!-- Loading Skeleton -->
      <div v-if="loading" style="padding: 20px;">
        <el-skeleton :rows="10" animated />
      </div>

      <el-table
        v-else
        :data="filteredSubTasks"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        row-key="id"
        :height="tableHeight"
      >
        <el-table-column type="selection" width="55" />
        <!-- 核心标识 -->
        <el-table-column prop="version_name" label="版本名称" width="150" fixed="left">
          <template #default="{ row }">
            <div v-if="editingRowId === row.id" class="editable-cell">
              <el-input v-model="editingData.version_name" size="small" @blur="saveInlineEdit(row)" />
            </div>
            <div v-else class="clickable-cell" @dblclick="startInlineEdit(row)">
              <strong>{{ row.version_name || '-' }}</strong>
              <el-icon class="edit-hint"><el-icon-edit /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sub_target" label="改造目标" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.sub_target === 'AK' ? 'primary' : 'success'">
              {{ row.sub_target || 'AK' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 负责人信息 -->
        <el-table-column label="开发负责人" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="editingRowId === row.id" class="editable-cell">
              <el-input v-model="editingData.dev_owner" size="small" @blur="saveInlineEdit(row)" />
            </div>
            <div v-else class="clickable-cell" @dblclick="startInlineEdit(row)">
              {{ row.dev_owner || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="运维负责人" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="editingRowId === row.id" class="editable-cell">
              <el-input v-model="editingData.ops_owner" size="small" @blur="saveInlineEdit(row)" />
            </div>
            <div v-else class="clickable-cell" @dblclick="startInlineEdit(row)">
              {{ row.ops_owner || '-' }}
            </div>
          </template>
        </el-table-column>
        <!-- 进度状态 -->
        <el-table-column prop="task_status" label="当前状态" width="100" align="center">
          <template #default="{ row }">
            <div v-if="editingRowId === row.id" class="editable-cell">
              <el-select v-model="editingData.task_status" size="small" @change="saveInlineEdit(row)">
                <el-option value="待启动" label="待启动" />
                <el-option value="研发进行中" label="研发进行中" />
                <el-option value="业务上线中" label="业务上线中" />
                <el-option value="已完成" label="已完成" />
                <el-option value="存在阻塞" label="存在阻塞" />
              </el-select>
            </div>
            <div v-else>
              <el-tag :type="getStatusType(row.task_status || row.status)" size="small" class="clickable-cell" @dblclick="startInlineEdit(row)">
                {{ formatStatus(row.task_status || row.status) || '待启动' }}
              </el-tag>
              <div v-if="row.is_blocked" class="block-warning">⚠️ 阻塞中</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="progress_percentage" label="进度" width="140" align="center">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="calculateProgress(row)"
                :stroke-width="6"
                :color="getProgressColor(row)"
                :format="(percentage: number) => `${percentage}%`"
              />
              <div class="progress-info">
                <span v-if="getWorkingDays(row) > 0" class="working-days">
                  已工作 <strong>{{ getWorkingDays(row) }}</strong> 天
                </span>
                <span v-if="getRemainingDays(row) > 0" class="remaining-days">
                  剩余 <strong>{{ getRemainingDays(row) }}</strong> 天
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 需求阶段对比 -->
        <el-table-column label="需求阶段" align="center">
          <el-table-column label="计划" width="95" align="center">
            <template #default="{ row }">
              <div class="date-cell planned">
                {{ formatYearMonth(row.planned_requirement_date) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="实际" width="95" align="center">
            <template #default="{ row }">
              <div v-if="editingRowId === row.id" class="editable-cell">
                <el-date-picker
                  v-model="editingData.actual_requirement_date"
                  type="date"
                  size="small"
                  format="YYYY-MM"
                  value-format="YYYY-MM-DD"
                  @change="saveInlineEdit(row)"
                />
              </div>
              <div v-else class="date-cell clickable-cell" :class="getDateComparisonClass(row.planned_requirement_date, row.actual_requirement_date)" @dblclick="startInlineEdit(row)">
                {{ formatYearMonth(row.actual_requirement_date) }}
              </div>
            </template>
          </el-table-column>
        </el-table-column>
        <!-- 发版阶段对比 -->
        <el-table-column label="发版阶段" align="center">
          <el-table-column label="计划" width="95" align="center">
            <template #default="{ row }">
              <div class="date-cell planned">
                {{ formatYearMonth(row.planned_release_date) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="实际" width="95" align="center">
            <template #default="{ row }">
              <div v-if="editingRowId === row.id" class="editable-cell">
                <el-date-picker
                  v-model="editingData.actual_release_date"
                  type="date"
                  size="small"
                  format="YYYY-MM"
                  value-format="YYYY-MM-DD"
                  @change="saveInlineEdit(row)"
                />
              </div>
              <div v-else class="date-cell clickable-cell" :class="getDateComparisonClass(row.planned_release_date, row.actual_release_date)" @dblclick="startInlineEdit(row)">
                {{ formatYearMonth(row.actual_release_date) }}
              </div>
            </template>
          </el-table-column>
        </el-table-column>
        <!-- 技术上线阶段对比 -->
        <el-table-column label="技术上线" align="center">
          <el-table-column label="计划" width="95" align="center">
            <template #default="{ row }">
              <div class="date-cell planned">
                {{ formatYearMonth(row.planned_tech_online_date) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="实际" width="95" align="center">
            <template #default="{ row }">
              <div v-if="editingRowId === row.id" class="editable-cell">
                <el-date-picker
                  v-model="editingData.actual_tech_online_date"
                  type="date"
                  size="small"
                  format="YYYY-MM"
                  value-format="YYYY-MM-DD"
                  @change="saveInlineEdit(row)"
                />
              </div>
              <div v-else class="date-cell clickable-cell" :class="getDateComparisonClass(row.planned_tech_online_date, row.actual_tech_online_date)" @dblclick="startInlineEdit(row)">
                {{ formatYearMonth(row.actual_tech_online_date) }}
              </div>
            </template>
          </el-table-column>
        </el-table-column>
        <!-- 业务上线阶段对比 -->
        <el-table-column label="业务上线" align="center">
          <el-table-column label="计划" width="95" align="center">
            <template #default="{ row }">
              <div class="date-cell planned">
                <strong style="color: #667eea;">{{ formatYearMonth(row.planned_biz_online_date) }}</strong>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="实际" width="95" align="center">
            <template #default="{ row }">
              <div v-if="editingRowId === row.id" class="editable-cell">
                <el-date-picker
                  v-model="editingData.actual_biz_online_date"
                  type="date"
                  size="small"
                  format="YYYY-MM"
                  value-format="YYYY-MM-DD"
                  @change="saveInlineEdit(row)"
                />
              </div>
              <div v-else class="date-cell clickable-cell" :class="getDateComparisonClass(row.planned_biz_online_date, row.actual_biz_online_date)" @dblclick="startInlineEdit(row)">
                <strong v-if="row.actual_biz_online_date">{{ formatYearMonth(row.actual_biz_online_date) }}</strong>
                <span v-else>-</span>
              </div>
            </template>
          </el-table-column>
        </el-table-column>
        <!-- 延期状态 -->
        <el-table-column label="延期状态" width="150" align="center">
          <template #default="{ row }">
            <div v-if="getDelayInfo(row).hasDelay" class="delay-button-wrapper">
              <el-button
                size="small"
                :type="getDelayInfo(row).severity"
                @click="showDelayDetails(row)"
                class="delay-status-button"
                plain
                round
              >
                <el-icon class="delay-icon"><el-icon-warning /></el-icon>
                <span class="delay-text">{{ getDelayInfo(row).text }}</span>
                <el-icon class="arrow-icon"><el-icon-arrow-right /></el-icon>
              </el-button>
            </div>
            <el-tag v-else type="success" size="small" effect="plain">
              <el-icon class="status-icon"><el-icon-circle-check /></el-icon>
              <span>正常</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.is_blocked"
              size="small"
              type="danger"
              @click="resolveBlock(row)"
            >
              解除阻塞
            </el-button>
            <el-button v-else size="small" type="primary" @click="updateProgress(row)">
              更新
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="card-grid">
        <!-- Loading Skeleton -->
        <div v-if="loading" style="padding: 20px;">
          <el-skeleton :rows="8" animated />
        </div>

        <div v-else v-for="task in filteredSubTasks" :key="task.id" class="task-card">
          <div class="card-header">
            <h3>{{ task.version_name }}</h3>
            <el-tag :type="task.sub_target === 'AK' ? 'primary' : 'success'" size="small">
              {{ task.sub_target || 'AK' }}
            </el-tag>
          </div>

          <div class="card-status">
            <el-tag :type="getStatusType(task.task_status || task.status)">
              {{ formatStatus(task.task_status || task.status) || '待启动' }}
            </el-tag>
            <el-progress
              :percentage="calculateProgress(task)"
              :color="getProgressColor(task)"
              style="margin-top: 10px"
            />
          </div>

          <div class="card-timeline">
            <div class="timeline-header">
              <span class="timeline-phase">工作阶段</span>
              <span class="timeline-date">计划时间</span>
              <span class="timeline-date">实际完成</span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">需求</span>
              <span class="timeline-planned">{{ formatYearMonth(task.planned_requirement_date) }}</span>
              <span class="timeline-actual" :class="getDateComparisonClass(task.planned_requirement_date, task.actual_requirement_date)">
                {{ formatYearMonth(task.actual_requirement_date) }}
              </span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">发版</span>
              <span class="timeline-planned">{{ formatYearMonth(task.planned_release_date) }}</span>
              <span class="timeline-actual" :class="getDateComparisonClass(task.planned_release_date, task.actual_release_date)">
                {{ formatYearMonth(task.actual_release_date) }}
              </span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">技术上线</span>
              <span class="timeline-planned">{{ formatYearMonth(task.planned_tech_online_date) }}</span>
              <span class="timeline-actual" :class="getDateComparisonClass(task.planned_tech_online_date, task.actual_tech_online_date)">
                {{ formatYearMonth(task.actual_tech_online_date) }}
              </span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">业务上线</span>
              <span class="timeline-planned"><strong>{{ formatYearMonth(task.planned_biz_online_date) }}</strong></span>
              <span class="timeline-actual" :class="getDateComparisonClass(task.planned_biz_online_date, task.actual_biz_online_date)">
                <strong v-if="task.actual_biz_online_date">{{ formatYearMonth(task.actual_biz_online_date) }}</strong>
                <span v-else>-</span>
              </span>
            </div>
          </div>

          <div class="card-info">
            <div class="info-item" v-if="task.dev_owner">
              <el-icon><User /></el-icon>
              <span>开发: {{ task.dev_owner }}</span>
            </div>
            <div class="info-item" v-if="task.ops_owner">
              <el-icon><Monitor /></el-icon>
              <span>运维: {{ task.ops_owner }}</span>
            </div>
            <div class="info-item" v-if="getWorkingDays(task) > 0">
              <el-icon><Clock /></el-icon>
              <span>已工作 {{ getWorkingDays(task) }} 天</span>
            </div>
            <div class="info-item" v-if="getRemainingDays(task) > 0">
              <el-icon><Calendar /></el-icon>
              <span>剩余 {{ getRemainingDays(task) }} 天</span>
            </div>
          </div>

          <div class="card-actions">
            <el-button size="small" type="primary" @click="quickEdit(task)">快速编辑</el-button>
            <el-button size="small" @click="viewDetails(task)">查看详情</el-button>
          </div>
        </div>
      </div>

      <!-- Batch Operations -->
      <div class="batch-operations">
        <strong>批量操作：</strong>
        <el-button @click="batchUpdateStatus" :disabled="selectedTasks.length === 0">
          批量更新状态
        </el-button>
        <el-button @click="batchUpdateDates" :disabled="selectedTasks.length === 0">
          批量修改日期
        </el-button>
      </div>
    </div>

    <!-- Create SubTask Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增子任务" width="700px">
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="版本名称" required>
          <el-input v-model="createForm.version_name" placeholder="请输入版本名称" />
        </el-form-item>
        <el-form-item label="改造目标" required>
          <el-radio-group v-model="createForm.sub_target">
            <el-radio value="AK">AK</el-radio>
            <el-radio value="云原生">云原生</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开发负责人">
          <el-input v-model="createForm.dev_owner" placeholder="请输入开发负责人" />
        </el-form-item>
        <el-form-item label="运维负责人">
          <el-input v-model="createForm.ops_owner" placeholder="请输入运维负责人" />
        </el-form-item>
        <el-form-item label="计划需求日期">
          <el-date-picker
            v-model="createForm.planned_requirement_date"
            type="date"
            placeholder="选择需求日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="计划发版时间">
          <el-date-picker
            v-model="createForm.planned_release_date"
            type="date"
            placeholder="选择发版日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="计划技术上线">
          <el-date-picker
            v-model="createForm.planned_tech_online_date"
            type="date"
            placeholder="选择技术上线日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="计划业务上线">
          <el-date-picker
            v-model="createForm.planned_biz_online_date"
            type="date"
            placeholder="选择业务上线日期"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="createForm.task_status" placeholder="请选择状态">
            <el-option value="待启动" label="待启动" />
            <el-option value="研发进行中" label="研发进行中" />
            <el-option value="业务上线中" label="业务上线中" />
            <el-option value="已完成" label="已完成" />
            <el-option value="存在阻塞" label="存在阻塞" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源申请">
          <el-switch v-model="createForm.resource_applied" active-text="已申请" inactive-text="未申请" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createForm.notes"
            type="textarea"
            placeholder="请输入备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认</el-button>
      </template>
    </el-dialog>

    <!-- Edit SubTask Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑子任务" width="800px">
      <el-form :model="editForm" label-width="120px">
        <el-tabs v-model="activeEditTab" type="card">
          <!-- 基础信息 -->
          <el-tab-pane label="基础信息" name="basic">
            <el-form-item label="版本名称" required>
              <el-input v-model="editForm.version_name" placeholder="请输入版本名称" />
            </el-form-item>
            <el-form-item label="改造目标">
              <el-radio-group v-model="editForm.sub_target">
                <el-radio value="AK">AK</el-radio>
                <el-radio value="云原生">云原生</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="当前状态">
              <el-select v-model="editForm.task_status" placeholder="请选择状态">
                <el-option value="待启动" label="待启动" />
                <el-option value="研发进行中" label="研发进行中" />
                <el-option value="业务上线中" label="业务上线中" />
                <el-option value="已完成" label="已完成" />
                <el-option value="存在阻塞" label="存在阻塞" />
              </el-select>
            </el-form-item>
            <el-form-item label="进度百分比">
              <el-slider v-model="safeProgressPercentage" :max="100" :min="0" show-input />
            </el-form-item>
            <el-form-item label="阻塞状态">
              <el-switch v-model="editForm.is_blocked" active-text="阻塞" inactive-text="正常" />
            </el-form-item>
            <el-form-item label="阻塞原因" v-if="editForm.is_blocked">
              <el-input v-model="editForm.block_reason" placeholder="请输入阻塞原因" />
            </el-form-item>
          </el-tab-pane>

          <!-- 负责人信息 -->
          <el-tab-pane label="负责人" name="owner">
            <el-form-item label="开发负责人">
              <el-input v-model="editForm.dev_owner" placeholder="请输入开发负责人" />
            </el-form-item>
            <el-form-item label="运维负责人">
              <el-input v-model="editForm.ops_owner" placeholder="请输入运维负责人" />
            </el-form-item>
          </el-tab-pane>

          <!-- 计划时间 -->
          <el-tab-pane label="计划时间" name="planned">
            <el-alert v-if="hasPlannedDateChanges" type="warning" :closable="false" style="margin-bottom: 15px;">
              <span style="font-size: 12px;">检测到计划时间变更，请填写变更原因</span>
            </el-alert>
            <el-form-item label="计划需求完成">
              <el-date-picker
                v-model="editForm.planned_requirement_date"
                type="date"
                placeholder="选择需求日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="checkPlannedDateChange"
              />
            </el-form-item>
            <el-form-item label="计划发版时间">
              <el-date-picker
                v-model="editForm.planned_release_date"
                type="date"
                placeholder="选择发版日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="checkPlannedDateChange"
              />
            </el-form-item>
            <el-form-item label="计划技术上线">
              <el-date-picker
                v-model="editForm.planned_tech_online_date"
                type="date"
                placeholder="选择技术上线日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="checkPlannedDateChange"
              />
            </el-form-item>
            <el-form-item label="计划业务上线">
              <el-date-picker
                v-model="editForm.planned_biz_online_date"
                type="date"
                placeholder="选择业务上线日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="checkPlannedDateChange"
              />
            </el-form-item>
            <el-form-item label="变更原因" v-if="hasPlannedDateChanges" required>
              <el-input
                v-model="editForm.plan_change_reason"
                type="textarea"
                placeholder="请输入计划变更原因（必填）"
                :rows="3"
              />
            </el-form-item>
          </el-tab-pane>

          <!-- 实际时间 -->
          <el-tab-pane label="实际时间" name="actual">
            <el-form-item label="实际需求完成">
              <el-date-picker
                v-model="editForm.actual_requirement_date"
                type="date"
                placeholder="选择实际需求日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled-date="(date: Date) => date > new Date()"
              />
            </el-form-item>
            <el-form-item label="实际发版时间">
              <el-date-picker
                v-model="editForm.actual_release_date"
                type="date"
                placeholder="选择实际发版日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled-date="(date: Date) => date > new Date()"
              />
            </el-form-item>
            <el-form-item label="实际技术上线">
              <el-date-picker
                v-model="editForm.actual_tech_online_date"
                type="date"
                placeholder="选择实际技术上线日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled-date="(date: Date) => date > new Date()"
              />
            </el-form-item>
            <el-form-item label="实际业务上线">
              <el-date-picker
                v-model="editForm.actual_biz_online_date"
                type="date"
                placeholder="选择实际业务上线日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled-date="(date: Date) => date > new Date()"
              />
            </el-form-item>
          </el-tab-pane>

          <!-- 其他信息 -->
          <el-tab-pane label="其他信息" name="other">
            <el-form-item label="资源申请">
              <el-switch v-model="editForm.resource_applied" active-text="已申请" inactive-text="未申请" />
            </el-form-item>
            <el-form-item label="运维需求提交">
              <el-date-picker
                v-model="editForm.ops_requirement_submitted"
                type="datetime"
                placeholder="选择提交时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
            <el-form-item label="运维测试状态">
              <el-input v-model="editForm.ops_testing_status" placeholder="请输入运维测试状态" />
            </el-form-item>
            <el-form-item label="上线检查状态">
              <el-input v-model="editForm.launch_check_status" placeholder="请输入上线检查状态" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="editForm.notes"
                type="textarea"
                placeholder="请输入备注"
                :rows="4"
              />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <el-button type="danger" @click="deleteSubTaskInEdit">删除子任务</el-button>
          <div>
            <el-button @click="showEditDialog = false">取消</el-button>
            <el-button type="primary" @click="handleEdit">保存</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Plus,
  Warning as ElIconWarning,
  ArrowRight as ElIconArrowRight,
  CircleCheck as ElIconCircleCheck,
  Edit as ElIconEdit,
  User,
  More,
  Download,
  Refresh,
  ArrowLeft,
  CircleCheckFilled,
  Clock,
  WarningFilled,
  Document,
  Grid,
  Postcard,
  Search,
  Monitor,
  Calendar
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElTabs, ElTabPane } from 'element-plus'
import { ApplicationsAPI, type Application } from '@/api/applications'
import { SubTasksAPI, type SubTask, type CreateSubTaskRequest, type UpdateSubTaskRequest } from '@/api/subtasks'

const router = useRouter()
const route = useRoute()

// Get application ID from route params
const applicationId = parseInt(route.params.id as string)

// Reactive data
const loading = ref(false)
const application = ref<Application | null>(null)
const subTasks = ref<SubTask[]>([])
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const editingTask = ref<SubTask | null>(null)
const selectedTasks = ref<SubTask[]>([])
const activeEditTab = ref('basic')

// Inline editing state
const editingRowId = ref<number | null>(null)
const editingData = reactive<Partial<SubTask>>({})

// View mode and filter state
const viewMode = ref<'table' | 'card'>('table')
const searchKeyword = ref('')
const filterStatus = ref<string | undefined>(undefined)

const statistics = reactive({
  total: 0,
  completed: 0,
  inProgress: 0,
  blocked: 0
})

const createForm = reactive<CreateSubTaskRequest>({
  l2_id: Number(applicationId),
  sub_target: 'AK',
  version_name: '',
  task_status: '待启动',
  planned_requirement_date: '',
  planned_release_date: '',
  planned_tech_online_date: '',
  planned_biz_online_date: '',
  notes: '',
  resource_applied: false,
  dev_owner: '',
  ops_owner: ''
} as any)

const editForm = reactive<UpdateSubTaskRequest>({
  version_name: '',
  task_status: '',
  planned_requirement_date: '',
  planned_release_date: '',
  planned_tech_online_date: '',
  planned_biz_online_date: '',
  actual_requirement_date: '',
  actual_release_date: '',
  actual_tech_online_date: '',
  actual_biz_online_date: '',
  progress_percentage: 0,
  notes: '',
  dev_owner: '',
  ops_owner: '',
  resource_applied: false,
  is_blocked: false,
  block_reason: '',
  ops_requirement_submitted: '',
  ops_testing_status: '',
  launch_check_status: '',
  sub_target: 'AK',
  plan_change_reason: ''
} as any)

// Track original planned dates for change detection
const originalPlannedDates = ref({
  planned_requirement_date: '',
  planned_release_date: '',
  planned_tech_online_date: '',
  planned_biz_online_date: ''
})

// Check if planned dates have changed
const hasPlannedDateChanges = computed(() => {
  return (
    editForm.planned_requirement_date !== originalPlannedDates.value.planned_requirement_date ||
    editForm.planned_release_date !== originalPlannedDates.value.planned_release_date ||
    editForm.planned_tech_online_date !== originalPlannedDates.value.planned_tech_online_date ||
    editForm.planned_biz_online_date !== originalPlannedDates.value.planned_biz_online_date
  )
})

// Computed properties
const applicationName = computed(() => application.value?.app_name || 'Loading...')
const l2Id = computed(() => application.value?.l2_id || '')

// Dynamic table height calculation
const tableHeight = computed(() => {
  // Calculate available height based on viewport
  const viewportHeight = window.innerHeight
  const headerHeight = 180 // Header approximate height
  const statsHeight = 120 // Stats cards height
  const toolbarHeight = 80 // Toolbar height
  const paginationHeight = 80 // Batch operations height
  const margin = 48 // Top and bottom margins

  const availableHeight = viewportHeight - headerHeight - statsHeight - toolbarHeight - paginationHeight - margin
  return Math.max(400, availableHeight) // Minimum height of 400px
})

// Filtered subtasks
const filteredSubTasks = computed(() => {
  let result = [...subTasks.value]

  // Keyword search
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(task => {
      const name = task.version_name || ''
      const devOwner = task.dev_owner || ''
      const opsOwner = task.ops_owner || ''
      return name.toLowerCase().includes(keyword) ||
             devOwner.toLowerCase().includes(keyword) ||
             opsOwner.toLowerCase().includes(keyword)
    })
  }

  // Status filter
  if (filterStatus.value) {
    result = result.filter(task => task.task_status === filterStatus.value)
  }

  return result
})

// Progress percentages for stats
const completedPercentage = computed(() => {
  const total = safeStatistics.value.total
  if (total === 0) return 0
  return Math.round((safeStatistics.value.completed / total) * 100)
})

const inProgressPercentage = computed(() => {
  const total = safeStatistics.value.total
  if (total === 0) return 0
  return Math.round((safeStatistics.value.inProgress / total) * 100)
})

const blockedPercentage = computed(() => {
  const total = safeStatistics.value.total
  if (total === 0) return 0
  return Math.round((safeStatistics.value.blocked / total) * 100)
})

// Computed property to ensure progress percentage is always a number
const safeProgressPercentage = computed({
  get: () => Number(editForm.progress_percentage) || 0,
  set: (val: number) => {
    editForm.progress_percentage = Number(val) || 0
  }
})

// Safe computed properties for statistics to prevent Vue attribute errors
const safeStatistics = computed(() => ({
  total: Number(statistics.total) || 0,
  completed: Number(statistics.completed) || 0,
  inProgress: Number(statistics.inProgress) || 0,
  blocked: Number(statistics.blocked) || 0
}))

// Completely isolated message handler to prevent reactive data contamination
const safeMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // Use setTimeout to completely isolate from current reactive context
  setTimeout(() => {
    try {
      ElMessage({
        message: String(message),
        type: type,
        duration: 3000
      })
    } catch (error) {
      // Fallback to console if ElMessage fails
      console.log(`[${type.toUpperCase()}]: ${message}`)
    }
  }, 0)
}

// Load application data
const loadApplication = async () => {
  try {
    application.value = await ApplicationsAPI.getApplication(applicationId)
  } catch (error) {
    console.error('Failed to load application:', error)
    ElMessage.error('加载应用信息失败')
  }
}

// Load subtasks data
const loadSubTasks = async () => {
  try {
    loading.value = true
    const rawSubTasks = await SubTasksAPI.getSubTasksByApplication(applicationId)
    // Ensure all data properties are properly formatted
    subTasks.value = rawSubTasks.map(task => ({
      ...task,
      progress_percentage: Number(task.progress_percentage) || 0,
      notes: task.notes || undefined
    }))
    await loadStatistics()
  } catch (error) {
    console.error('Failed to load subtasks:', error)
    ElMessage.error('加载子任务失败')
    subTasks.value = []
  } finally {
    loading.value = false
  }
}

// Load statistics
const loadStatistics = async () => {
  try {
    // Calculate statistics from loaded subtasks
    const tasks = subTasks.value
    statistics.total = tasks.length
    statistics.completed = tasks.filter(t =>
      t.task_status === '已完成' || t.task_status === 'completed'
    ).length
    statistics.inProgress = tasks.filter(t =>
      t.task_status === '研发进行中' || t.task_status === '业务上线中' ||
      t.task_status === 'in_progress' || t.task_status === 'testing'
    ).length
    statistics.blocked = tasks.filter(t =>
      t.task_status === '存在阻塞' || t.task_status === 'blocked' || t.is_blocked
    ).length
  } catch (error) {
    console.error('Failed to calculate statistics:', error)
  }
}

// Window resize handler
const handleResize = () => {
  // Force re-computation of table height
  window.dispatchEvent(new Event('resize'))
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    loadApplication(),
    loadSubTasks()
  ])

  // Add resize listener
  window.addEventListener('resize', handleResize)
})

// Cleanup
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待启动': 'info',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '已完成': 'success',
    '阻塞中': 'danger',
    '存在阻塞': 'danger'
  }
  return statusMap[status] || 'info'
}

const getProgressColor = (row: SubTask) => {
  if (row.is_blocked || row.task_status === '存在阻塞') return '#f56565'
  const progress = calculateProgress(row)
  if (progress >= 80) return '#48bb78'
  return '#667eea'
}

// formatDate is no longer used, removed to clean up

// formatShortDate is no longer used, removed to clean up

const formatYearMonth = (dateString: string | null | undefined) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    // Format as YYYY-MM
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  } catch (error) {
    return '-'
  }
}

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'planning': '待启动',
    'in_progress': '研发进行中',
    'testing': '业务上线中',
    'completed': '已完成',
    'blocked': '存在阻塞'
  }
  return statusMap[status] || status || '待启动'
}

// Date comparison for highlighting
const getDateComparisonClass = (plannedDate: string | null | undefined, actualDate: string | null | undefined) => {
  if (!actualDate) return ''
  if (!plannedDate) return 'actual'

  const planned = new Date(plannedDate)
  const actual = new Date(actualDate)

  if (actual <= planned) {
    return 'on-time' // Green - on time or early
  } else {
    return 'delayed' // Red - delayed
  }
}

const calculateProgress = (row: SubTask) => {
  // If progress is explicitly set, use it
  if (row.progress_percentage !== undefined && row.progress_percentage !== null) {
    return Number(row.progress_percentage)
  }

  // Otherwise calculate based on actual dates
  let progress = 0
  if (row.actual_requirement_date) progress += 25
  if (row.actual_release_date) progress += 25
  if (row.actual_tech_online_date) progress += 25
  if (row.actual_biz_online_date) progress += 25

  return progress
}

const getWorkingDays = (row: SubTask) => {
  // Calculate working days from earliest actual date to now
  const actualDates = [
    row.actual_requirement_date,
    row.actual_release_date,
    row.actual_tech_online_date,
    row.actual_biz_online_date
  ].filter(d => d && d !== null) as string[]

  if (actualDates.length === 0) {
    // If no actual work started, calculate from first planned date
    const plannedDates = [
      row.planned_requirement_date,
      row.planned_release_date,
      row.planned_tech_online_date,
      row.planned_biz_online_date
    ].filter(d => d && d !== null) as string[]

    if (plannedDates.length === 0) return 0

    const sortedPlanned = plannedDates.sort()
    if (sortedPlanned.length === 0) return 0

    const firstPlannedDate = sortedPlanned[0]
    if (!firstPlannedDate) return 0

    const earliestPlanned = new Date(firstPlannedDate)
    const today = new Date()

    // Only count if the work should have started
    if (earliestPlanned > today) return 0

    const diffTime = Math.abs(today.getTime() - earliestPlanned.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const sortedActual = actualDates.sort()
  if (sortedActual.length === 0) return 0

  const firstActualDate = sortedActual[0]
  if (!firstActualDate) return 0

  const earliestDate = new Date(firstActualDate)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - earliestDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// Calculate remaining days
const getRemainingDays = (row: SubTask) => {
  if (row.actual_biz_online_date) return 0 // Already completed

  const today = new Date()
  const targetDate = row.planned_biz_online_date ? new Date(row.planned_biz_online_date) : null

  if (!targetDate) return 0

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

// Removed hasDateAdjustment function since it's not being used

const getDelayInfo = (row: SubTask) => {
  // Calculate delay based on planned vs actual dates
  const today = new Date()
  let delayMonths = 0
  let delayType = ''

  // Helper function to calculate month difference
  const calcMonthDiff = (plannedDate: Date) => {
    const yearDiff = today.getFullYear() - plannedDate.getFullYear()
    const monthDiff = today.getMonth() - plannedDate.getMonth()
    return Math.max(0, yearDiff * 12 + monthDiff)
  }

  // Check each milestone for delays
  if (row.planned_biz_online_date && !row.actual_biz_online_date) {
    const plannedDate = new Date(row.planned_biz_online_date)
    if (today > plannedDate) {
      delayMonths = calcMonthDiff(plannedDate)
      delayType = '业务上线'
    }
  } else if (row.planned_tech_online_date && !row.actual_tech_online_date) {
    const plannedDate = new Date(row.planned_tech_online_date)
    if (today > plannedDate) {
      delayMonths = calcMonthDiff(plannedDate)
      delayType = '技术上线'
    }
  } else if (row.planned_release_date && !row.actual_release_date) {
    const plannedDate = new Date(row.planned_release_date)
    if (today > plannedDate) {
      delayMonths = calcMonthDiff(plannedDate)
      delayType = '发版'
    }
  }

  if (delayMonths > 0) {
    return {
      hasDelay: true,
      days: delayMonths,
      type: delayType,
      text: `${delayType}延期${delayMonths}月`,
      severity: delayMonths > 3 ? 'danger' : 'warning'
    }
  }

  return {
    hasDelay: false,
    days: 0,
    type: '',
    text: '',
    severity: ''
  }
}

const showDelayDetails = (row: SubTask) => {
  const delayInfo = getDelayInfo(row)

  ElMessageBox.alert(
    `<div style="line-height: 1.8;">
      <p><strong>版本名称：</strong>${row.version_name}</p>
      <p><strong>延期类型：</strong>${delayInfo.type}</p>
      <p><strong>延期时间：</strong>${delayInfo.days}月</p>
      <hr style="margin: 10px 0;">
      <p><strong>计划日期：</strong></p>
      <ul style="list-style: none; padding-left: 20px;">
        <li>需求：${formatYearMonth(row.planned_requirement_date)}</li>
        <li>发版：${formatYearMonth(row.planned_release_date)}</li>
        <li>技术上线：${formatYearMonth(row.planned_tech_online_date)}</li>
        <li>业务上线：${formatYearMonth(row.planned_biz_online_date)}</li>
      </ul>
      <p><strong>实际日期：</strong></p>
      <ul style="list-style: none; padding-left: 20px;">
        <li>需求：${formatYearMonth(row.actual_requirement_date)}</li>
        <li>发版：${formatYearMonth(row.actual_release_date)}</li>
        <li>技术上线：${formatYearMonth(row.actual_tech_online_date)}</li>
        <li>业务上线：${formatYearMonth(row.actual_biz_online_date)}</li>
      </ul>
    </div>`,
    '延期详情',
    {
      confirmButtonText: '确定',
      dangerouslyUseHTMLString: true,
      customClass: 'delay-details-dialog'
    }
  )
}

// Inline editing methods
const startInlineEdit = (row: SubTask) => {
  editingRowId.value = row.id
  // Copy current row data to editing data
  Object.assign(editingData, {
    version_name: row.version_name,
    task_status: row.task_status,
    dev_owner: row.dev_owner,
    ops_owner: row.ops_owner,
    actual_requirement_date: row.actual_requirement_date,
    actual_release_date: row.actual_release_date,
    actual_tech_online_date: row.actual_tech_online_date,
    actual_biz_online_date: row.actual_biz_online_date,
    progress_percentage: row.progress_percentage
  })
}

const saveInlineEdit = async (row: SubTask) => {
  if (editingRowId.value !== row.id) return

  try {
    // Prepare update data
    const updateData: UpdateSubTaskRequest = {
      version_name: editingData.version_name || row.version_name,
      task_status: editingData.task_status || row.task_status,
      dev_owner: editingData.dev_owner,
      ops_owner: editingData.ops_owner,
      actual_requirement_date: editingData.actual_requirement_date || null,
      actual_release_date: editingData.actual_release_date || null,
      actual_tech_online_date: editingData.actual_tech_online_date || null,
      actual_biz_online_date: editingData.actual_biz_online_date || null,
      progress_percentage: calculateProgress({
        ...row,
        ...editingData
      })
    }

    await SubTasksAPI.updateSubTask(row.id, updateData)

    // Update local data
    Object.assign(row, updateData)

    // Clear editing state
    editingRowId.value = null
    Object.keys(editingData).forEach(key => delete editingData[key as keyof typeof editingData])

    safeMessage('更新成功', 'success')
  } catch (error) {
    console.error('Failed to update subtask:', error)
    safeMessage('更新失败', 'error')
    // Revert changes
    editingRowId.value = null
  }
}

const goBack = () => {
  router.push('/applications')
}

// Export data
const exportData = () => {
  ElMessage.info('导出功能待实现')
}

// Refresh data
const refreshData = async () => {
  await loadSubTasks()
  ElMessage.success('数据已刷新')
}

// Handle search
const handleSearch = () => {
  // Search is reactive through computed property
}

// Handle filter
const handleFilter = () => {
  // Filter is reactive through computed property
}

// Quick edit from card view
const quickEdit = (task: SubTask) => {
  editTask(task)
}

// View task details
const viewDetails = (task: SubTask) => {
  editTask(task)
}

// Create subtask
const showCreateTaskDialog = () => {
  // Reset form with dev_owner and ops_owner from application
  Object.assign(createForm, {
    l2_id: Number(applicationId),
    sub_target: application.value?.overall_transformation_target || 'AK',
    version_name: '',
    task_status: '待启动',
    planned_requirement_date: '',
    planned_release_date: '',
    planned_tech_online_date: '',
    planned_biz_online_date: '',
    notes: '',
    resource_applied: false,
    dev_owner: application.value?.dev_owner || '',
    ops_owner: application.value?.ops_owner || ''
  })
  showCreateDialog.value = true
}

const handleCreate = async () => {
  if (!createForm.version_name) {
    safeMessage('请填写必填字段', 'error')
    return
  }

  try {
    await SubTasksAPI.createSubTask(createForm)
    safeMessage('子任务创建成功', 'success')
    showCreateDialog.value = false
    await loadSubTasks()
  } catch (error) {
    console.error('Failed to create subtask:', error)
    safeMessage('创建子任务失败', 'error')
  }
}

// Edit subtask
const editTask = (task: SubTask) => {
  editingTask.value = task
  activeEditTab.value = 'basic'
  Object.assign(editForm, {
    version_name: task.version_name || '',
    task_status: task.task_status || '',
    planned_requirement_date: task.planned_requirement_date || '',
    planned_release_date: task.planned_release_date || '',
    planned_tech_online_date: task.planned_tech_online_date || '',
    planned_biz_online_date: task.planned_biz_online_date || '',
    actual_requirement_date: task.actual_requirement_date || '',
    actual_release_date: task.actual_release_date || '',
    actual_tech_online_date: task.actual_tech_online_date || '',
    actual_biz_online_date: task.actual_biz_online_date || '',
    progress_percentage: Number(task.progress_percentage) || 0,
    notes: task.notes || '',
    dev_owner: task.dev_owner || '',
    ops_owner: task.ops_owner || '',
    resource_applied: task.resource_applied || false,
    is_blocked: task.is_blocked || false,
    block_reason: task.block_reason || '',
    ops_requirement_submitted: task.ops_requirement_submitted || '',
    ops_testing_status: task.ops_testing_status || '',
    launch_check_status: task.launch_check_status || '',
    sub_target: task.sub_target || 'AK',
    plan_change_reason: ''
  })
  
  // Store original planned dates for comparison
  originalPlannedDates.value = {
    planned_requirement_date: task.planned_requirement_date || '',
    planned_release_date: task.planned_release_date || '',
    planned_tech_online_date: task.planned_tech_online_date || '',
    planned_biz_online_date: task.planned_biz_online_date || ''
  }
  
  showEditDialog.value = true
}

// Check if planned date changed
const checkPlannedDateChange = () => {
  // This is triggered when dates change, hasPlannedDateChanges will auto-update
}

const handleEdit = async () => {
  if (!editingTask.value || !editForm.version_name) {
    safeMessage('请填写必填字段', 'error')
    return
  }

  // Check if plan change reason is required
  if (hasPlannedDateChanges.value && !editForm.plan_change_reason) {
    safeMessage('计划时间有变更，请填写变更原因', 'error')
    activeEditTab.value = 'planned'  // Switch to planned tab
    return
  }

  try {
    // Format dates to YYYY-MM-DD strings if needed
    const formattedData = {
      ...editForm,
      // Ensure progress_percentage is a number
      progress_percentage: Number(editForm.progress_percentage) || 0
    }

    // If plan changed, append reason to notes
    if (hasPlannedDateChanges.value && editForm.plan_change_reason) {
      const changeNote = `[计划变更 ${new Date().toLocaleDateString('zh-CN')}] ${editForm.plan_change_reason}`
      formattedData.notes = formattedData.notes 
        ? `${formattedData.notes}\n${changeNote}`
        : changeNote
    }

    await SubTasksAPI.updateSubTask(editingTask.value.id, formattedData)
    
    // Update application dates and delay status if plan dates changed
    if (hasPlannedDateChanges.value && application.value) {
      try {
        // Get all subtasks for this application to calculate aggregate dates
        const allSubtasks = await SubTasksAPI.getSubTasksByApplication(applicationId)
        
        // Get the latest planned dates from all subtasks
        const latestDates = {
          planned_requirement_date: null as string | null,
          planned_release_date: null as string | null,
          planned_tech_online_date: null as string | null,
          planned_biz_online_date: null as string | null
        }
        
        allSubtasks.forEach(subtask => {
          // Update with the latest (max) date for each phase
          if (subtask.planned_requirement_date) {
            if (!latestDates.planned_requirement_date || 
                new Date(subtask.planned_requirement_date) > new Date(latestDates.planned_requirement_date)) {
              latestDates.planned_requirement_date = subtask.planned_requirement_date
            }
          }
          if (subtask.planned_release_date) {
            if (!latestDates.planned_release_date || 
                new Date(subtask.planned_release_date) > new Date(latestDates.planned_release_date)) {
              latestDates.planned_release_date = subtask.planned_release_date
            }
          }
          if (subtask.planned_tech_online_date) {
            if (!latestDates.planned_tech_online_date || 
                new Date(subtask.planned_tech_online_date) > new Date(latestDates.planned_tech_online_date)) {
              latestDates.planned_tech_online_date = subtask.planned_tech_online_date
            }
          }
          if (subtask.planned_biz_online_date) {
            if (!latestDates.planned_biz_online_date || 
                new Date(subtask.planned_biz_online_date) > new Date(latestDates.planned_biz_online_date)) {
              latestDates.planned_biz_online_date = subtask.planned_biz_online_date
            }
          }
        })
        
        // Check if application is delayed based on new dates
        const today = new Date()
        const isDelayed = Object.entries(latestDates).some(([key, dateStr]) => {
          if (!dateStr) return false
          const date = new Date(dateStr)
          const actualKey = key.replace('planned', 'actual')
          const actualDate = application.value![actualKey as keyof Application]
          return date < today && !actualDate
        })
        
        // Calculate delay months if delayed
        let delayMonths = 0
        if (isDelayed) {
          const delayedDates = Object.entries(latestDates)
            .filter(([key, dateStr]) => {
              if (!dateStr) return false
              const date = new Date(dateStr)
              const actualKey = key.replace('planned', 'actual')
              const actualDate = application.value![actualKey as keyof Application]
              return date < today && !actualDate
            })
            .map(([_, dateStr]) => new Date(dateStr!))

          if (delayedDates.length > 0) {
            const oldestDelayedDate = new Date(Math.min(...delayedDates.map(d => d.getTime())))
            const yearDiff = today.getFullYear() - oldestDelayedDate.getFullYear()
            const monthDiff = today.getMonth() - oldestDelayedDate.getMonth()
            delayMonths = Math.max(0, yearDiff * 12 + monthDiff)
          }
        }
        
        // Update application with new dates and delay status
        await ApplicationsAPI.updateApplication(application.value.id, {
          ...latestDates,
          is_delayed: isDelayed,
          delay_days: delayMonths
        })
      } catch (error) {
        console.error('Failed to update application dates and delay status:', error)
      }
    }
    
    safeMessage('子任务更新成功', 'success')
    showEditDialog.value = false
    await loadSubTasks()
    await loadApplication() // Reload application data to reflect changes
  } catch (error: any) {
    console.error('Failed to update subtask:', error)

    // Handle specific backend error
    if (error.response?.status === 500) {
      if (error.response?.data?.detail?.includes('selectinload')) {
        safeMessage('后端服务配置错误，请联系系统管理员', 'error')
      } else {
        safeMessage('服务器内部错误，请稍后重试', 'error')
      }
    } else {
      safeMessage('更新子任务失败', 'error')
    }
  }
}

// Quick actions
const resolveBlock = async (task: SubTask) => {
  try {
    await ElMessageBox.confirm(`确定要解决阻塞吗？`, '解决阻塞', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await SubTasksAPI.updateSubTask(task.id, {
      task_status: 'in_progress',
      is_blocked: false
    })
    safeMessage('阻塞已解决', 'success')
    await loadSubTasks()
  } catch (error: any) {
    console.error('Failed to resolve block:', error)

    // Handle specific backend error
    if (error.response?.status === 500) {
      if (error.response?.data?.detail?.includes('selectinload')) {
        safeMessage('后端服务配置错误，请联系系统管理员', 'error')
      } else {
        safeMessage('服务器内部错误，请稍后重试', 'error')
      }
    } else {
      safeMessage('解决阻塞失败', 'error')
    }
  }
}

const updateProgress = (task: SubTask) => {
  editTask(task)
}


// Table selection
const handleSelectionChange = (selection: SubTask[]) => {
  selectedTasks.value = selection
}

// Batch operations
const batchUpdateStatus = async () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请选择要操作的子任务')
    return
  }

  try {
    const { value: status } = await ElMessageBox.prompt('请输入新状态', '批量更新状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator: (value) => {
        const validStatus = ['待启动', '研发进行中', '业务上线中', '已完成', '存在阻塞']
        return validStatus.includes(value) || '请输入有效的状态'
      }
    })

    for (const task of selectedTasks.value) {
      await SubTasksAPI.updateSubTask(task.id, { task_status: status })
    }

    ElMessage({
      message: `成功更新 ${Number(selectedTasks.value.length)} 个子任务状态`,
      type: 'success'
    })
    await loadSubTasks()
  } catch (error) {
    console.error('Failed batch update status:', error)
    ElMessage({
      message: '批量更新失败',
      type: 'error'
    })
  }
}

const batchUpdateDates = async () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请选择要操作的子任务')
    return
  }

  try {
    const { value: endDate } = await ElMessageBox.prompt('请输入新的计划结束日期', '批量修改日期', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'date'
    })

    for (const task of selectedTasks.value) {
      await SubTasksAPI.updateSubTask(task.id, { planned_biz_online_date: endDate })
    }

    ElMessage({
      message: `成功更新 ${Number(selectedTasks.value.length)} 个子任务日期`,
      type: 'success'
    })
    await loadSubTasks()
  } catch (error) {
    console.error('Failed batch update dates:', error)
    ElMessage({
      message: '批量更新失败',
      type: 'error'
    })
  }
}

// Delete subtask from edit dialog
const deleteSubTaskInEdit = async () => {
  if (!editingTask.value) {
    safeMessage('没有选中的子任务', 'error')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除子任务"${editingTask.value.version_name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await SubTasksAPI.deleteSubTask(editingTask.value.id)
    safeMessage('子任务删除成功', 'success')
    showEditDialog.value = false
    await loadSubTasks()
  } catch (error: any) {
    if (error === 'cancel') {
      return // User cancelled
    }

    console.error('Failed to delete subtask:', error)
    if (error.response?.status === 500) {
      if (error.response?.data?.detail?.includes('selectinload')) {
        safeMessage('后端服务配置错误，请联系系统管理员', 'error')
      } else {
        safeMessage('服务器内部错误，请稍后重试', 'error')
      }
    } else {
      safeMessage('删除子任务失败', 'error')
    }
  }
}

</script>

<style scoped>
.subtasks-view {
  padding: 0;
  background: #f5f6fa;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-top {
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-button {
  color: white !important;
  font-size: 14px;
  padding: 4px 8px;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.header-main {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  flex: 1;
}

.header-info h1 {
  margin: 0 0 8px 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.header-meta .el-tag {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions .el-button {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
}

.header-actions .el-button--primary {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.header-actions .el-button--primary:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.header-actions .el-button--default {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 1);
  color: #667eea;
}

.header-actions .el-button--default:hover {
  background: rgba(255, 255, 255, 1);
  color: #764ba2;
}

/* 统计卡片 */
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  padding: 20px 24px;
  margin-bottom: 0;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.green {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.stat-icon.orange {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
}

.stat-icon.red {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 13px;
  color: #718096;
}

.stat-content .el-progress {
  margin-top: 8px;
}

/* 主内容区 */
.main-content {
  margin: 24px;
  background: white;
  border-radius: 12px;
  overflow: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-height: calc(100vh - 400px);
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafbfc;
  border-radius: 12px 12px 0 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 表格容器 */
.table-container {
  padding: 0;
  width: 100%;
  overflow: auto;
}

.table-container .el-table {
  width: 100%;
  min-width: 100%;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
  padding: 20px;
  max-height: calc(100vh - 420px);
  overflow-y: auto;
}

.task-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.task-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.card-status {
  margin-bottom: 16px;
}

.card-timeline {
  background: #f7fafc;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.timeline-header {
  display: grid;
  grid-template-columns: 90px 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  color: #718096;
  font-weight: 600;
  text-align: left;
}

.timeline-header .timeline-phase {
  text-align: left;
}

.timeline-header .timeline-date {
  text-align: center;
}

.timeline-item {
  display: grid;
  grid-template-columns: 90px 1fr 1fr;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  align-items: center;
}

.timeline-label {
  color: #4a5568;
  font-weight: 500;
}

.timeline-planned {
  color: #718096;
  text-align: center;
}

.timeline-actual {
  font-weight: 500;
  text-align: center;
}

.timeline-actual.on-time {
  color: #48bb78;
}

.timeline-actual.delayed {
  color: #f56565;
}

.card-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4a5568;
}

.info-item .el-icon {
  color: #cbd5e0;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}



.block-warning {
  color: #e53e3e;
  font-size: 12px;
}

.completed-date {
  color: #48bb78;
}

.blocked-text {
  color: #e53e3e;
}

.plan-date-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.adjustment-indicator {
  color: #ed8936;
  font-size: 14px;
}

.progress-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
}

.working-days {
  font-size: 11px;
  color: #4a5568;
}

.working-days strong {
  color: #3182ce;
  font-weight: 600;
}

.remaining-days {
  font-size: 11px;
  color: #718096;
}

.remaining-days strong {
  color: #ed8936;
  font-weight: 600;
}

.actual-date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.actual-date-cell .completed {
  color: #48bb78;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.actual-date-cell .in-progress {
  color: #3182ce;
  font-size: 12px;
}

.actual-date-cell .pending {
  color: #a0aec0;
}

.status-icon {
  font-size: 14px;
}

.delay-button-wrapper {
  display: inline-block;
}

.delay-status-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  transition: all 0.3s ease;
  border-width: 1px;
  cursor: pointer;
}

.delay-status-button:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.delay-icon {
  font-size: 14px;
  animation: pulse 2s infinite;
}

.delay-text {
  font-weight: 500;
}

.arrow-icon {
  font-size: 12px;
  margin-left: 2px;
  transition: transform 0.3s ease;
}

.delay-status-button:hover .arrow-icon {
  transform: translateX(3px);
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.batch-operations {
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 12px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-operations .el-button {
  margin-left: 10px;
}

/* Inline editing styles */
.clickable-cell {
  position: relative;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clickable-cell:hover {
  background-color: #f7fafc;
}

.clickable-cell .edit-hint {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #cbd5e0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.clickable-cell:hover .edit-hint {
  opacity: 1;
}

.editable-cell {
  padding: 0;
}

.editable-cell .el-input,
.editable-cell .el-select,
.editable-cell .el-date-picker {
  width: 100%;
}

.editable-cell .el-input__inner {
  height: 28px;
  line-height: 28px;
  font-size: 13px;
}

/* Date comparison styles */
.date-cell {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.date-cell.planned {
  color: #4a5568;
}

.date-cell.on-time {
  background-color: #c6f6d5;
  color: #22543d;
}

.date-cell.delayed {
  background-color: #fed7d7;
  color: #742a2a;
}

.date-cell.actual {
  color: #2d3748;
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .subtasks-view {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header h2 {
    font-size: 18px;
    text-align: center;
  }
  
  .app-info {
    text-align: center;
    font-size: 13px;
  }
  
  .actions {
    display: flex;
    justify-content: center;
    gap: 10px;
  }
  
  .actions .el-button {
    flex: 1;
    font-size: 12px;
  }
  
  .overview {
    margin-bottom: 20px;
  }
  
  .overview .el-col {
    margin-bottom: 10px;
  }
  
  .stat-item {
    padding: 15px 10px;
  }
  
  .stat-value {
    font-size: 1.5em;
  }
  
  .stat-label {
    font-size: 13px;
  }
  
  /* 表格移动端优化 */
  .el-table {
    font-size: 12px;
  }
  
  .el-table .el-table__cell {
    padding: 8px 4px;
  }
  
  .batch-operations {
    margin-top: 15px;
    padding: 10px;
  }
  
  .batch-operations .el-button {
    margin: 5px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .subtasks-view {
    padding: 8px;
  }
  
  .header h2 {
    font-size: 16px;
  }
  
  .app-info {
    font-size: 12px;
  }
  
  .actions .el-button {
    font-size: 11px;
    padding: 8px 12px;
  }
  
  .overview .el-row {
    gap: 10px;
  }
  
  .stat-value {
    font-size: 1.3em;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .el-table {
    font-size: 11px;
  }
  
  .el-table .el-table__cell {
    padding: 6px 2px;
  }
  
  .el-tag {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .el-button--small {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>