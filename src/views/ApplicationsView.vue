<template>
  <div class="applications-view">
    <el-card>
      <template #header>
        <div class="header">
          <h2>应用系统列表</h2>
          <div class="actions">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><plus /></el-icon>
              新增应用
            </el-button>
            <el-button type="success" @click="goToImport">
              <el-icon><upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="warning" @click="exportExcel">
              <el-icon><download /></el-icon>
              导出Excel
            </el-button>
          </div>
        </div>
      </template>

      <!-- Search Bar -->
      <div class="search-bar">
        <el-form :model="searchForm" inline>
          <el-form-item>
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索 L2 ID 或应用名称..."
              style="width: 250px"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="searchForm.status"
              placeholder="全部状态"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="searchForm.department"
              placeholder="全部部门"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in departmentOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="searchForm.target"
              placeholder="改造目标"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="item in targetOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetSearch">重置筛选</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- Applications Data Table -->
      <el-table
        :data="applications"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <!-- 核心标识 -->
        <el-table-column prop="l2_id" label="L2 ID" width="110" fixed="left">
          <template #default="{ row }">
            <strong>{{ row.l2_id }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="app_name" label="应用名称" min-width="90" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.app_name || row.application_name }}
          </template>
        </el-table-column>
        <!-- 管理信息 -->
        <el-table-column prop="ak_supervision_acceptance_year" label="监管年份" width="90" align="center">
          <template #default="{ row }">
            {{ row.ak_supervision_acceptance_year ? row.ak_supervision_acceptance_year + '年' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="overall_transformation_target" label="改造目标" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.overall_transformation_target === 'AK' ? 'primary' : 'success'">
              {{ row.overall_transformation_target || 'AK' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 进度状态 -->
        <el-table-column prop="current_status" label="当前状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.current_status)" size="small">
              {{ row.current_status || '待启动' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 关键计划时间点 -->
        <el-table-column label="计划需求" width="120" align="center">
          <template #default="{ row }">
            <div class="plan-date-cell">
              {{ formatYearMonth(row.planned_requirement_date) }}
              <el-icon v-if="hasDateAdjustment(row, 'requirement')" class="adjustment-indicator" title="计划已调整">
                <el-icon-warning />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="计划发版" width="120" align="center">
          <template #default="{ row }">
            <div class="plan-date-cell">
              {{ formatYearMonth(row.planned_release_date) }}
              <el-icon v-if="hasDateAdjustment(row, 'release')" class="adjustment-indicator" title="计划已调整">
                <el-icon-warning />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="计划技术上线" width="120" align="center">
          <template #default="{ row }">
            <div class="plan-date-cell">
              {{ formatYearMonth(row.planned_tech_online_date) }}
              <el-icon v-if="hasDateAdjustment(row, 'tech')" class="adjustment-indicator" title="计划已调整">
                <el-icon-warning />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="计划业务上线" width="120" align="center">
          <template #default="{ row }">
            <div class="plan-date-cell">
              <strong style="color: #667eea;">{{ formatYearMonth(row.planned_biz_online_date) }}</strong>
              <el-icon v-if="hasDateAdjustment(row, 'biz')" class="adjustment-indicator" title="计划已调整">
                <el-icon-warning />
              </el-icon>
            </div>
          </template>
        </el-table-column>
        <!-- 延期状态（合并调整和延期） -->
        <el-table-column label="延期状态" width="150" align="center">
          <template #default="{ row }">
            <div v-if="getDelayCount(row) > 0" class="delay-button-wrapper">
              <el-button
                size="small"
                :type="row.is_delayed ? 'danger' : 'warning'"
                @click="showDelayDetails(row)"
                class="delay-status-button"
                plain
                round
              >
                <el-icon class="delay-icon"><el-icon-warning /></el-icon>
                <span class="delay-text">延期{{ getDelayCount(row) }}次</span>
                <el-icon class="arrow-icon"><el-icon-arrow-right /></el-icon>
              </el-button>
            </div>
            <el-tag v-else type="success" size="small" effect="plain">
              <el-icon class="status-icon"><el-icon-circle-check /></el-icon>
              <span>正常</span>
            </el-tag>
          </template>
        </el-table-column>
        <!-- 操作按钮 -->
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="editApplication(row)">编辑</el-button>
              <el-button size="small" type="primary" @click="viewSubTasks(row)">子任务</el-button>
              <el-button size="small" type="info" @click="showAppDetail(row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
        </div>
    </el-card>

    <!-- Create Application Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增应用" width="700px">
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="L2 ID" required>
          <el-input v-model="createForm.l2_id" placeholder="如：CI000001" />
        </el-form-item>
        <el-form-item label="应用名称" required>
          <el-input v-model="createForm.app_name" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="所属L1">
          <el-input v-model="createForm.belonging_l1_name" placeholder="请输入所属L1名称" />
        </el-form-item>
        <el-form-item label="所属项目">
          <el-input v-model="createForm.belonging_projects" placeholder="请输入所属项目" />
        </el-form-item>
        <el-form-item label="所属指标">
          <el-input v-model="createForm.belonging_kpi" placeholder="请输入所属指标" />
        </el-form-item>
        <el-form-item label="改造目标" required>
          <el-radio-group v-model="createForm.overall_transformation_target">
            <el-radio value="AK">AK</el-radio>
            <el-radio value="云原生">云原生</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="监管验收年份">
          <el-select v-model="createForm.ak_supervision_acceptance_year" placeholder="请选择年份">
            <el-option :value="2025" label="2025年" />
            <el-option :value="2026" label="2026年" />
            <el-option :value="2027" label="2027年" />
          </el-select>
        </el-form-item>
        <el-form-item label="开发团队">
          <el-input v-model="editForm.dev_team" placeholder="请输入开发团队"/>
        </el-form-item>
        <el-form-item label="开发负责人">
          <el-input v-model="createForm.dev_owner" placeholder="请输入开发负责人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="loading">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- Edit Application Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑应用" width="800px">
      <el-form :model="editForm" label-width="120px">
        <el-tabs v-model="activeEditTab" type="card">
          <!-- 基础信息 -->
          <el-tab-pane label="基础信息" name="basic">
            <el-form-item label="L2 ID">
              <el-input v-model="editForm.l2_id" />
            </el-form-item>
            <el-form-item label="应用名称" required>
              <el-input v-model="editForm.app_name" />
            </el-form-item>
            <el-form-item label="所属L1">
              <el-input v-model="editForm.belonging_l1_name" placeholder="请输入所属L1名称" />
            </el-form-item>
            <el-form-item label="所属项目">
              <el-input v-model="editForm.belonging_projects" placeholder="请输入所属项目" />
            </el-form-item>
            <el-form-item label="所属指标">
              <el-input v-model="editForm.belonging_kpi" placeholder="请输入所属指标" />
            </el-form-item>
            <el-form-item label="监管验收年份">
              <el-select v-model="editForm.ak_supervision_acceptance_year" placeholder="请选择年份">
                <el-option :value="2025" label="2025年" />
                <el-option :value="2026" label="2026年" />
                <el-option :value="2027" label="2027年" />
              </el-select>
            </el-form-item>
            <el-form-item label="改造目标">
              <el-radio-group v-model="editForm.overall_transformation_target">
                <el-radio value="AK">AK</el-radio>
                <el-radio value="云原生">云原生</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="当前状态">
              <el-select v-model="editForm.current_status" placeholder="请选择状态">
                <el-option value="待启动" label="待启动" />
                <el-option value="研发进行中" label="研发进行中" />
                <el-option value="业务上线中" label="业务上线中" />
                <el-option value="全部完成" label="全部完成" />
                <el-option value="存在阻塞" label="存在阻塞" />
              </el-select>
            </el-form-item>
            <el-form-item label="验收状态">
              <el-select v-model="editForm.acceptance_status" placeholder="请选择验收状态" clearable>
                <el-option value="未验收" label="未验收" />
                <el-option value="验收中" label="验收中" />
                <el-option value="已验收" label="已验收" />
              </el-select>
            </el-form-item>
          </el-tab-pane>

          <!-- 团队信息 -->
          <el-tab-pane label="团队信息" name="team">
            <el-form-item label="应用档位">
              <el-input-number v-model="editForm.app_tier" :min="1" :max="5" placeholder="请选择档位" />
            </el-form-item>
            <el-form-item label="开发模式">
              <el-input v-model="editForm.dev_mode" placeholder="请输入开发模式" />
            </el-form-item>
            <el-form-item label="运维模式">
              <el-input v-model="editForm.ops_mode" placeholder="请输入运维模式" />
            </el-form-item>
            <el-form-item label="开发负责人">
              <el-input v-model="editForm.dev_owner" placeholder="请输入开发负责人" />
            </el-form-item>
            <el-form-item label="开发团队">
              <el-input v-model="editForm.dev_team" placeholder="请输入开发团队"/>
            </el-form-item>
            <el-form-item label="运维负责人">
              <el-input v-model="editForm.ops_owner" placeholder="请输入运维负责人" />
            </el-form-item>
            <el-form-item label="运维团队">
              <el-input v-model="editForm.ops_team" placeholder="请输入运维团队"/>
            </el-form-item>
          </el-tab-pane>

          <!-- 计划时间 -->
          <el-tab-pane label="计划时间" name="planned">
            <el-form-item label="计划需求完成">
              <el-date-picker
                v-model="editForm.planned_requirement_date"
                type="date"
                placeholder="选择计划需求完成日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="计划发版时间">
              <el-date-picker
                v-model="editForm.planned_release_date"
                type="date"
                placeholder="选择计划发版日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="计划技术上线">
              <el-date-picker
                v-model="editForm.planned_tech_online_date"
                type="date"
                placeholder="选择计划技术上线日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="计划业务上线">
              <el-date-picker
                v-model="editForm.planned_biz_online_date"
                type="date"
                placeholder="选择计划业务上线日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-alert type="info" :closable="false" style="margin-top: 10px;">
              <span style="font-size: 12px;">提示：修改计划时间会记录在审计日志中</span>
            </el-alert>
          </el-tab-pane>

          <!-- 实际时间 -->
          <el-tab-pane label="实际时间" name="actual">
            <el-form-item label="实际需求完成">
              <el-date-picker
                v-model="editForm.actual_requirement_date"
                type="date"
                placeholder="选择实际需求完成日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="(date: Date) => date > new Date()"
              />
            </el-form-item>
            <el-form-item label="实际发版时间">
              <el-date-picker
                v-model="editForm.actual_release_date"
                type="date"
                placeholder="选择实际发版日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="(date: Date) => date > new Date()"
              />
            </el-form-item>
            <el-form-item label="实际技术上线">
              <el-date-picker
                v-model="editForm.actual_tech_online_date"
                type="date"
                placeholder="选择实际技术上线日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="(date: Date) => date > new Date()"
              />
            </el-form-item>
            <el-form-item label="实际业务上线">
              <el-date-picker
                v-model="editForm.actual_biz_online_date"
                type="date"
                placeholder="选择实际业务上线日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="(date: Date) => date > new Date()"
              />
            </el-form-item>
            <el-alert type="success" :closable="false" style="margin-top: 10px;">
              <span style="font-size: 12px;">提示：填写实际时间表示该阶段已完成</span>
            </el-alert>
          </el-tab-pane>

          <!-- 其他信息 -->
          <el-tab-pane label="其他信息" name="other">
            <el-form-item label="域名化改造">
              <el-switch v-model="editForm.is_domain_transformation_completed" active-text="完成" inactive-text="未完成" />
            </el-form-item>
            <el-form-item label="DBPM改造">
              <el-switch v-model="editForm.is_dbpm_transformation_completed" active-text="完成" inactive-text="未完成" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="editForm.notes"
                type="textarea"
                :rows="4"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <el-button type="danger" @click="deleteApplicationInEdit">删除应用</el-button>
          <div>
            <el-button @click="showEditDialog = false">取消</el-button>
            <el-button type="primary" @click="handleUpdate" :loading="loading">
              保存
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- Application Detail Dialog -->
    <el-dialog v-model="showDetailDialog" title="应用详情" width="900px">
      <el-tabs v-model="activeDetailTab" type="card">
        <!-- 基础信息 -->
        <el-tab-pane label="基础信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="L2 ID" label-align="right">
              <strong>{{ detailData.l2_id }}</strong>
            </el-descriptions-item>
            <el-descriptions-item label="应用名称" label-align="right">
              {{ detailData.app_name }}
            </el-descriptions-item>
            <el-descriptions-item label="所属L1" label-align="right">
              {{ detailData.belonging_l1_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="所属项目" label-align="right">
              {{ detailData.belonging_projects || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="所属指标" label-align="right">
              {{ detailData.belonging_kpi || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="应用档位" label-align="right">
              {{ detailData.app_tier || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="监管验收年份" label-align="right">
              {{ detailData.ak_supervision_acceptance_year ? detailData.ak_supervision_acceptance_year + '年' : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="改造目标" label-align="right">
              <el-tag :type="detailData.overall_transformation_target === 'AK' ? 'primary' : 'success'" size="small">
                {{ detailData.overall_transformation_target || 'AK' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前改造阶段" label-align="right">
              {{ detailData.current_transformation_phase || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="验收状态" label-align="right">
              <el-tag v-if="detailData.acceptance_status"
                     :type="detailData.acceptance_status === '已验收' ? 'success' : 'warning'"
                     size="small">
                {{ detailData.acceptance_status }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 团队信息 -->
        <el-tab-pane label="团队信息" name="team">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="开发模式" label-align="right">
              {{ detailData.dev_mode || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="运维模式" label-align="right">
              {{ detailData.ops_mode || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="开发负责人" label-align="right">
              {{ detailData.dev_owner || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="开发团队" label-align="right">
              {{ detailData.dev_team || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="运维负责人" label-align="right">
              {{ detailData.ops_owner || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="运维团队" label-align="right">
              {{ detailData.ops_team || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 时间进度 -->
        <el-tab-pane label="时间进度" name="timeline">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="【计划】需求完成" label-align="right">
              {{ formatDate(detailData.planned_requirement_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="【实际】需求到达" label-align="right">
              <span :style="{ color: detailData.actual_requirement_date ? '#48bb78' : '#999' }">
                {{ formatDate(detailData.actual_requirement_date) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="【计划】发版时间" label-align="right">
              {{ formatDate(detailData.planned_release_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="【实际】发版时间" label-align="right">
              <span :style="{ color: detailData.actual_release_date ? '#48bb78' : '#999' }">
                {{ formatDate(detailData.actual_release_date) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="【计划】技术上线" label-align="right">
              {{ formatDate(detailData.planned_tech_online_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="【实际】技术上线" label-align="right">
              <span :style="{ color: detailData.actual_tech_online_date ? '#48bb78' : '#999' }">
                {{ formatDate(detailData.actual_tech_online_date) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="【计划】业务上线" label-align="right">
              {{ formatDate(detailData.planned_biz_online_date) }}
            </el-descriptions-item>
            <el-descriptions-item label="【实际】业务上线" label-align="right">
              <span :style="{ color: detailData.actual_biz_online_date ? '#48bb78' : '#999' }">
                {{ formatDate(detailData.actual_biz_online_date) }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 进度状态 -->
        <el-tab-pane label="进度状态" name="progress">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="整体进度" label-align="right">
              <el-progress :percentage="detailData.progress_percentage || 0" :color="getProgressColor(detailData)" style="width: 200px;" />
            </el-descriptions-item>
            <el-descriptions-item label="子任务统计" label-align="right">
              {{ detailData.completed_subtask_count || 0 }} / {{ detailData.subtask_count || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="延期状态" label-align="right">
              <el-tag v-if="detailData.is_delayed" type="danger" size="small">
                延期 {{ detailData.delay_days }} 天
              </el-tag>
              <el-tag v-else type="success" size="small">正常</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态" label-align="right">
              <el-tag :type="getStatusType(detailData.current_status)" size="small">
                {{ detailData.current_status || '待启动' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="域AK改造" label-align="right">
              <el-tag :type="detailData.is_domain_transformation_completed ? 'success' : 'info'" size="small">
                {{ detailData.is_domain_transformation_completed ? '完成' : '未完成' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="DBPM改造" label-align="right">
              <el-tag :type="detailData.is_dbpm_transformation_completed ? 'success' : 'info'" size="small">
                {{ detailData.is_dbpm_transformation_completed ? '完成' : '未完成' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 其他信息 -->
        <el-tab-pane label="其他信息" name="other">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="创建时间" label-align="right">
              {{ formatDate(detailData.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间" label-align="right">
              {{ formatDate(detailData.updated_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="备注" label-align="right" :span="2">
              {{ detailData.notes || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 操作记录 -->
        <el-tab-pane label="操作记录" name="audit" lazy>
          <div v-loading="auditLoading" style="min-height: 300px;">
            <div v-if="auditRecords.length === 0" class="audit-empty">
              <el-empty description="暂无操作记录" />
            </div>
            <el-timeline v-else>
              <el-timeline-item
                v-for="(record, index) in (auditRecords || [])"
                :key="record?.id || `audit-${index}`"
                :timestamp="formatDate(record?.created_at)"
                placement="top"
              >
                <div class="audit-record">
                  <div class="audit-header">
                    <span class="audit-user">{{ record?.user_full_name || '系统' }}</span>
                    <el-tag size="small" :type="getOperationType(record?.operation)">
                      {{ getOperationText(record?.operation) }}
                    </el-tag>
                  </div>
                  <div class="audit-changes" v-if="record?.changed_fields && record?.changed_fields.length > 0">
                    <div class="change-item" v-for="(field, fieldIndex) in record.changed_fields" :key="`${field}-${fieldIndex}`">
                      <span class="field-name">{{ getFieldLabel(field) }}:</span>
                      <span class="old-value" v-if="record?.old_values && record?.old_values[field] !== undefined">
                        {{ formatFieldValue(field, record?.old_values[field]) }}
                      </span>
                      <span class="arrow" v-if="record?.old_values && record?.old_values[field] !== undefined">→</span>
                      <span class="new-value" v-if="record?.new_values && record?.new_values[field] !== undefined">
                        {{ formatFieldValue(field, record?.new_values[field]) }}
                      </span>
                    </div>
                  </div>
                  <div class="audit-footer" v-if="isAdmin && record?.id">
                    <el-button
                      v-if="record?.operation !== 'DELETE' && canRollback(record)"
                      size="small"
                      type="warning"
                      @click="rollbackAudit(record)"
                    >
                      回滚此操作
                    </el-button>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Delay Details Dialog -->
    <el-dialog v-model="showDelayDetailsDialog" title="延期详情" width="900px">
      <div v-loading="delayDetailsLoading" style="min-height: 400px;">
        <!-- 延期统计 -->
        <div class="delay-summary">
          <el-alert type="warning" :closable="false">
            <template #title>
              <div class="summary-content">
                <span>该应用已延期 <strong>{{ delayDetailsData.totalDelayCount }}</strong> 次</span>
                <span class="total-delay-days">累计延期 <strong>{{ delayDetailsData.totalDelayDays }}</strong> 天</span>
              </div>
            </template>
          </el-alert>
        </div>

        <!-- 延期历史时间线 -->
        <div class="delay-timeline" v-if="delayDetailsData.delayHistory && delayDetailsData.delayHistory.length > 0">
          <h3>延期历史</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in delayDetailsData.delayHistory"
              :key="index"
              :timestamp="formatDate(item.date)"
              :type="item.type || 'primary'"
              placement="top"
            >
              <div class="delay-record">
                <div class="delay-header">
                  <el-tag size="small" :type="getDelayType(item.delayDays)">
                    延期 {{ Math.abs(item.delayDays) }} {{ item.delayUnit || '天' }}
                  </el-tag>
                  <span class="delay-phase">{{ getDelayPhaseLabel(item.phase) }}</span>
                </div>
                <div class="delay-content">
                  <div class="delay-dates">
                    <span class="original-date">原计划：{{ formatYearMonth(item.originalDate) }}</span>
                    <span class="arrow">→</span>
                    <span class="new-date">调整为：{{ formatYearMonth(item.newDate) }}</span>
                  </div>
                  <div class="delay-reason" v-if="item.reason">
                    <span class="reason-label">延期原因：</span>
                    <span class="reason-text">{{ item.reason }}</span>
                  </div>
                  <div class="delay-footer">
                    <span class="operator">操作人：{{ item.operator || '系统' }}</span>
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 各阶段延期统计 -->
        <div class="delay-statistics" v-if="delayDetailsData.phaseStatistics">
          <h3>各阶段延期统计</h3>
          <el-table :data="delayDetailsData.phaseStatistics" border>
            <el-table-column prop="phase" label="阶段" width="120">
              <template #default="{ row }">
                {{ getDelayPhaseLabel(row.phase) }}
              </template>
            </el-table-column>
            <el-table-column prop="delayCount" label="延期次数" width="100" align="center">
              <template #default="{ row }">
                <el-badge :value="row.delayCount" type="warning" />
              </template>
            </el-table-column>
            <el-table-column prop="totalDelayDays" label="累计延期天数" width="120" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.totalDelayDays > 30 }">
                  {{ row.totalDelayDays }} 天
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="currentStatus" label="当前状态" min-width="150">
              <template #default="{ row }">
                <div v-if="row.currentPlannedDate">
                  计划：{{ formatYearMonth(row.currentPlannedDate) }}
                  <el-tag
                    v-if="row.isDelayed"
                    type="danger"
                    size="small"
                    style="margin-left: 10px;"
                  >
                    延期中
                  </el-tag>
                </div>
                <div v-else>-</div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 延期原因分析 -->
        <div class="delay-analysis" v-if="delayDetailsData.reasonAnalysis && delayDetailsData.reasonAnalysis.length > 0">
          <h3>延期原因分析</h3>
          <div class="reason-tags">
            <el-tag
              v-for="(reason, index) in delayDetailsData.reasonAnalysis"
              :key="index"
              size="medium"
              style="margin: 5px;"
            >
              {{ reason.reason }}（{{ reason.count }}次）
            </el-tag>
          </div>
        </div>

        <!-- 无延期记录 -->
        <div v-if="!delayDetailsData.delayHistory || delayDetailsData.delayHistory.length === 0" class="no-delay-history">
          <el-empty description="该应用暂无延期记录" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDelayDetailsDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Plan History Dialog -->
    <el-dialog v-model="showPlanHistoryDialog" title="计划调整历史" width="900px">
      <div v-loading="planHistoryLoading" style="min-height: 400px;">
        <!-- 调整统计 -->
        <div class="adjustment-summary">
          <el-alert type="warning" :closable="false">
            <template #title>
              <div class="summary-content">
                <span>该应用计划已调整 <strong>{{ planHistoryData.length }}</strong> 次</span>
                <span v-if="currentPlanAdjustment" class="latest-adjustment">
                  最近调整：{{ formatDate(currentPlanAdjustment.adjusted_at) }}
                </span>
              </div>
            </template>
          </el-alert>
        </div>

        <!-- 时间线对比视图 -->
        <div class="timeline-comparison" v-if="planHistoryData.length > 0">
          <h3>计划时间线对比</h3>
          <div class="timeline-chart">
            <div class="timeline-row" v-for="(history, index) in planHistoryData" :key="index">
              <div class="timeline-label">
                <div class="version-label">
                  <el-tag v-if="index === 0" type="success" size="small">当前</el-tag>
                  <el-tag v-else size="small">第{{ planHistoryData.length - index }}次</el-tag>
                </div>
                <div class="adjust-info">
                  <div class="adjust-date">{{ formatDate(history.adjusted_at) }}</div>
                  <div class="adjust-user">{{ history.adjusted_by }}</div>
                </div>
              </div>
              <div class="timeline-content">
                <div class="timeline-bar">
                  <div class="phase-block requirement" :style="getPhaseStyle(history, 'requirement')">
                    <span>需求</span>
                    <span class="phase-date">{{ formatYearMonth(history.planned_requirement_date) }}</span>
                  </div>
                  <div class="phase-block release" :style="getPhaseStyle(history, 'release')">
                    <span>发版</span>
                    <span class="phase-date">{{ formatYearMonth(history.planned_release_date) }}</span>
                  </div>
                  <div class="phase-block tech" :style="getPhaseStyle(history, 'tech')">
                    <span>技术上线</span>
                    <span class="phase-date">{{ formatYearMonth(history.planned_tech_online_date) }}</span>
                  </div>
                  <div class="phase-block biz" :style="getPhaseStyle(history, 'biz')">
                    <span>业务上线</span>
                    <span class="phase-date">{{ formatYearMonth(history.planned_biz_online_date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 调整明细 -->
        <div class="adjustment-details" v-if="planHistoryData.length > 0">
          <h3>调整明细</h3>
          <el-table :data="planAdjustmentDetails" border>
            <el-table-column prop="adjusted_at" label="调整时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.adjusted_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="adjusted_by" label="调整人" width="100" />
            <el-table-column prop="field" label="调整项" width="120">
              <template #default="{ row }">
                {{ getAdjustmentFieldLabel(row.field) }}
              </template>
            </el-table-column>
            <el-table-column prop="old_date" label="原计划" width="100">
              <template #default="{ row }">
                <span class="old-date">{{ formatYearMonth(row.old_date) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="new_date" label="新计划" width="100">
              <template #default="{ row }">
                <span class="new-date">{{ formatYearMonth(row.new_date) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="delay_days" label="延期天数" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.delay_days > 0" type="danger" size="small">
                  +{{ row.delay_days }}天
                </el-tag>
                <el-tag v-else-if="row.delay_days < 0" type="success" size="small">
                  {{ row.delay_days }}天
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="调整原因" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>

        <!-- 无调整记录 -->
        <div v-if="planHistoryData.length === 0" class="no-adjustment-history">
          <el-empty description="该应用暂无计划调整记录" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showPlanHistoryDialog = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Upload,
  Download,
  Warning as ElIconWarning,
  Clock as ElIconClock,
  CircleCheck as ElIconCircleCheck,
  ArrowRight as ElIconArrowRight,
  InfoFilled as ElIconInfoFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApplicationsAPI, type Application, type CreateApplicationRequest } from '@/api/applications'
import { SubTasksAPI, type SubTask } from '@/api/subtasks'
import { ExcelAPI } from '@/api/reports'
import { AuditAPI, type AuditLog } from '@/api/audit'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDetailDialog = ref(false)
const showPlanHistoryDialog = ref(false)
const showDelayDetailsDialog = ref(false)
const delayDetailsData = ref<any>({})
const delayDetailsLoading = ref(false)
const selectedApplications = ref<Application[]>([])
const editingId = ref<number | null>(null)
const detailData = ref<Partial<Application>>({})
const activeEditTab = ref('basic')
const activeDetailTab = ref('basic')
const planHistoryData = ref<any[]>([])
const planHistoryLoading = ref(false)

// Audit related states
const auditRecords = ref<AuditLog[]>([])
const auditLoading = ref(false)
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.hasRole('ADMIN'))

// Plan adjustment tracking states - Initialize here
const planAdjustmentCache = ref<Map<number, any>>(new Map())
const currentPlanAdjustment = ref<any>(null)
const planAdjustmentDetails = ref<any[]>([])

// Tab and SubTasks states
const activeTab = ref('applications')
const allSubTasks = ref<SubTask[]>([])
const subtaskLoading = ref(false)
const selectedSubTasks = ref<SubTask[]>([])
const subtaskCurrentPage = ref(1)
const subtaskPageSize = ref(10)

const subtaskSearchForm = reactive({
  keyword: '',
  status: undefined as string | undefined,
  application: undefined as number | undefined
})

// Data states
const allApplications = ref<Application[]>([]) // 存储所有原始数据
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

const searchForm = reactive({
  keyword: '',
  status: undefined as string | undefined,
  department: undefined as string | undefined,
  target: undefined as string | undefined
})

// 用于防抖的关键词
const debouncedKeyword = ref('')

// 下拉选项
const statusOptions = [
  { label: '待启动', value: '待启动' },
  { label: '研发进行中', value: '研发进行中' },
  { label: '业务上线中', value: '业务上线中' },
  { label: '全部完成', value: '全部完成' },
  { label: '存在阻塞', value: '存在阻塞' }
]

const departmentOptions = [
  { label: '研发一部', value: '研发一部' },
  { label: '研发二部', value: '研发二部' },
  { label: '运维部', value: '运维部' },
  { label: '架构部', value: '架构部' },
  { label: '测试部', value: '测试部' }
]

const targetOptions = [
  { label: 'AK', value: 'AK' },
  { label: '云原生', value: '云原生' }
]

const createForm = reactive({
  l2_id: '',
  app_name: '',
  dev_owner: '',
  dev_team: '',
  current_status: '待启动',
  ak_supervision_acceptance_year: 2025,
  overall_transformation_target: 'AK',
  belonging_l1_name: '',
  belonging_projects: '',
  belonging_kpi: ''
})

const editForm = reactive({
  l2_id: '',
  app_name: '',
  overall_transformation_target: 'AK',
  dev_owner: '',
  dev_team: '',
  ops_owner: '',
  ops_team: '',
  current_status: '待启动',
  ak_supervision_acceptance_year: 2025,
  app_tier: undefined as number | undefined,
  belonging_l1_name: '',
  belonging_projects: '',
  belonging_kpi: '',
  acceptance_status: '',
  dev_mode: '',
  ops_mode: '',
  is_domain_transformation_completed: false,
  is_dbpm_transformation_completed: false,
  notes: '',
  // 计划时间
  planned_requirement_date: '',
  planned_release_date: '',
  planned_tech_online_date: '',
  planned_biz_online_date: '',
  // 实际时间
  actual_requirement_date: '',
  actual_release_date: '',
  actual_tech_online_date: '',
  actual_biz_online_date: ''
})

// 前端筛选后的数据
const filteredApplications = computed(() => {
  let result = [...allApplications.value]

  // 关键词搜索（使用防抖后的值）
  if (debouncedKeyword.value) {
    const keyword = debouncedKeyword.value.toLowerCase()
    result = result.filter(app => {
      const id = app.l2_id || ''
      const name = app.app_name || ''
      return id.toLowerCase().includes(keyword) || name.toLowerCase().includes(keyword)
    })
  }

  // 状态筛选
  if (searchForm.status) {
    result = result.filter(app => app.status === searchForm.status)
  }

  // 部门筛选
  if (searchForm.department) {
    result = result.filter(app => (app.dev_team === searchForm.department) || (app.ops_team === searchForm.department))
  }

  // 改造目标筛选（假设数据中有此字段）
  if (searchForm.target) {
    result = result.filter(app => app.overall_transformation_target === searchForm.target)
  }

  return result
})

// 分页后的数据
const applications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredApplications.value.slice(start, end)
})

// 总数
const total = computed(() => filteredApplications.value.length)

// SubTask 相关计算属性
const filteredSubTasks = computed(() => {
  let result = [...allSubTasks.value]

  // 关键词搜索
  if (subtaskSearchForm.keyword) {
    const keyword = subtaskSearchForm.keyword.toLowerCase()
    result = result.filter(task => {
      const name = task.version_name || ''
      return name.toLowerCase().includes(keyword)
    })
  }

  // 状态筛选
  if (subtaskSearchForm.status) {
    result = result.filter(task => task.task_status === subtaskSearchForm.status)
  }

  // 应用筛选
  if (subtaskSearchForm.application) {
    result = result.filter(task => task.l2_id === subtaskSearchForm.application)
  }

  return result
})

// 分页后的子任务数据
const paginatedSubTasks = computed(() => {
  const start = (subtaskCurrentPage.value - 1) * subtaskPageSize.value
  const end = start + subtaskPageSize.value
  return filteredSubTasks.value.slice(start, end)
})

// Load all applications data
const loadApplications = async () => {
  try {
    loading.value = true
    // 一次性获取所有数据（或者较大数量）
    const response = await ApplicationsAPI.getApplications({
      skip: 0,
      limit: 1000 // 获取前1000条数据
    })
    allApplications.value = response.items || []
  } catch (error) {
    console.error('Failed to load applications:', error)
    ElMessage.error('加载应用列表失败，请检查网络连接')
    allApplications.value = []
  } finally {
    loading.value = false
  }
}

// Load all subtasks data
const loadSubTasks = async () => {
  try {
    subtaskLoading.value = true
    const response = await SubTasksAPI.getSubTasks({ limit: 1000 })
    allSubTasks.value = response.items || []
  } catch (error) {
    console.error('Failed to load subtasks:', error)
    ElMessage.error('加载子任务列表失败')
    allSubTasks.value = []
  } finally {
    subtaskLoading.value = false
  }
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    loadApplications(),
    loadSubTasks()
  ])

  // Load delay data after applications are loaded
  if (allApplications.value.length > 0) {
    // Load first batch of delay data for visible applications
    const visibleApps = applications.value.slice(0, 10)
    for (const app of visibleApps) {
      loadDelayDataForApp(app)
    }
  }
})

// Load delay data for a specific application
const loadDelayDataForApp = async (app: Application) => {
  // Skip if already loaded or not delayed
  if (planAdjustmentCache.value.has(app.id)) {
    return
  }

  try {
    const audits = await AuditAPI.getRecordHistory('applications', app.id)

    const planAdjustments = audits.filter(audit =>
      audit.changed_fields?.some(field =>
        field.includes('planned_') && field.includes('_date')
      )
    ).map(audit => ({
      adjusted_at: audit.created_at,
      field: audit.changed_fields?.find(f => f.includes('planned_')),
      user: audit.user_full_name
    }))

    if (planAdjustments.length > 0 || app.is_delayed) {
      planAdjustmentCache.value.set(app.id, planAdjustments)
    }
  } catch (error) {
    console.error(`Failed to load delay data for app ${app.id}:`, error)
    // Set empty array to avoid re-fetching
    if (app.is_delayed) {
      planAdjustmentCache.value.set(app.id, [])
    }
  }
}


// 防抖处理关键词搜索
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(() => searchForm.keyword, (newVal) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedKeyword.value = newVal
    currentPage.value = 1
  }, 300) // 300ms 防抖
})

// 监听其他筛选条件
watch([() => searchForm.status, () => searchForm.department, () => searchForm.target], () => {
  currentPage.value = 1
})

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    '待启动': 'info',
    '研发进行中': 'primary',
    '业务上线中': 'warning',
    '全部完成': 'success',
    '存在阻塞': 'danger'
  }
  return statusMap[status] || 'info'
}

const getProgressColor = (row: Application) => {
  if (row.progress_percentage >= 80) return '#48bb78'
  if (row.progress_percentage >= 50) return '#ed8936'
  return '#667eea'
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-'

  try {
    // Handle different date formats
    let date: Date
    if (dateString.includes('T')) {
      // ISO format: 2024-01-01T00:00:00
      date = new Date(dateString)
    } else if (dateString.includes('-')) {
      // Date format: 2024-01-01
      date = new Date(dateString + 'T00:00:00')
    } else {
      // Fallback
      date = new Date(dateString)
    }

    if (isNaN(date.getTime())) {
      return '-'
    }

    // Return formatted date
    if (dateString.includes('T')) {
      return date.toLocaleString('zh-CN')
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateString)
    return '-'
  }
}

// Format date as xx年xx月
const formatYearMonth = (dateString: string | null | undefined) => {
  if (!dateString) return '-'

  try {
    // Handle different date formats
    let date: Date
    if (dateString.includes('T')) {
      // ISO format: 2024-01-01T00:00:00
      date = new Date(dateString)
    } else if (dateString.includes('-')) {
      // Date format: 2024-01-01
      date = new Date(dateString + 'T00:00:00')
    } else {
      // Fallback
      date = new Date(dateString)
    }

    if (isNaN(date.getTime())) {
      return '-'
    }

    // Format as xx年xx月
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const monthStr = month < 10 ? '0' + month : month.toString()
    return `${year}年${monthStr}月`
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateString)
    return '-'
  }
}

const formatShortDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'

    // Format as MM-DD
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}`
  } catch (error) {
    return '-'
  }
}

// Removed handleSearch since we have watch

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = undefined
  searchForm.department = undefined
  searchForm.target = undefined
  debouncedKeyword.value = ''
  currentPage.value = 1
}

const handleSelectionChange = (selection: Application[]) => {
  selectedApplications.value = selection
}

const editApplication = (row: Application) => {
  editingId.value = row.id
  activeEditTab.value = 'basic'
  // Copy data to edit form
  Object.assign(editForm, {
    l2_id: row.l2_id,
    app_name: row.app_name,
    overall_transformation_target: row.overall_transformation_target || 'AK',
    dev_owner: row.dev_owner || '',
    dev_team: row.dev_team || '',
    ops_owner: row.ops_owner || '',
    ops_team: row.ops_team || '',
    current_status: row.current_status || '待启动',
    ak_supervision_acceptance_year: row.ak_supervision_acceptance_year || 2025,
    app_tier: row.app_tier || undefined,
    belonging_l1_name: row.belonging_l1_name || '',
    belonging_projects: row.belonging_projects || '',
    belonging_kpi: row.belonging_kpi || '',
    acceptance_status: row.acceptance_status || '',
    dev_mode: row.dev_mode || '',
    ops_mode: row.ops_mode || '',
    is_domain_transformation_completed: row.is_domain_transformation_completed || false,
    is_dbpm_transformation_completed: row.is_dbpm_transformation_completed || false,
    notes: row.notes || '',
    // 计划时间
    planned_requirement_date: row.planned_requirement_date || '',
    planned_release_date: row.planned_release_date || '',
    planned_tech_online_date: row.planned_tech_online_date || '',
    planned_biz_online_date: row.planned_biz_online_date || '',
    // 实际时间
    actual_requirement_date: row.actual_requirement_date || '',
    actual_release_date: row.actual_release_date || '',
    actual_tech_online_date: row.actual_tech_online_date || '',
    actual_biz_online_date: row.actual_biz_online_date || ''
  })
  showEditDialog.value = true
}

const handleUpdate = async () => {
  if (!editForm.app_name || !editingId.value) {
    ElMessage.error('请填写必填字段')
    return
  }

  try {
    const updatedApp = await ApplicationsAPI.updateApplication(editingId.value, editForm)
    ElMessage.success('应用更新成功')
    showEditDialog.value = false

    // 更新本地数据
    const index = allApplications.value.findIndex(app => app.id === editingId.value)
    if (index !== -1) {
      allApplications.value[index] = updatedApp
    }
  } catch (error) {
    console.error('Failed to update application:', error)
    ElMessage.error('更新应用失败')
  }
}

// Delete application from edit dialog
const deleteApplicationInEdit = async () => {
  if (!editingId.value) {
    ElMessage.error('没有选中的应用')
    return
  }

  const app = allApplications.value.find(app => app.id === editingId.value)
  if (!app) {
    ElMessage.error('应用不存在')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除应用"${app.app_name}"吗？此操作将同时删除所有相关子任务，且不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await ApplicationsAPI.deleteApplication(editingId.value)
    ElMessage.success('应用删除成功')
    showEditDialog.value = false

    // Remove from local data
    const index = allApplications.value.findIndex(app => app.id === editingId.value)
    if (index !== -1) {
      allApplications.value.splice(index, 1)
    }
  } catch (error: any) {
    if (error === 'cancel') {
      return // User cancelled
    }

    console.error('Failed to delete application:', error)
    if (error.response?.status === 500) {
      ElMessage.error('服务器内部错误，请稍后重试')
    } else if (error.response?.status === 404) {
      ElMessage.error('应用不存在或已被删除')
    } else {
      ElMessage.error('删除应用失败')
    }
  }
}

const viewSubTasks = (row: Application) => {
  router.push(`/subtasks/${row.id}`)
}


const handleCreate = async () => {
  if (!createForm.l2_id || !createForm.app_name) {
    ElMessage.error('请填写必填字段')
    return
  }

  try {
    const newApp = await ApplicationsAPI.createApplication(createForm as CreateApplicationRequest)
    ElMessage.success('应用创建成功')
    showCreateDialog.value = false

    // 直接添加到本地数据
    allApplications.value.unshift(newApp)

    // Reset form
    Object.assign(createForm, {
      l2_id: '',
      app_name: '',
      dev_owner: '',
      dev_team: '',
      current_status: '待启动',
      ak_supervision_acceptance_year: 2025,
      overall_transformation_target: 'AK',
      belonging_l1_name: '',
      belonging_projects: '',
      belonging_kpi: ''
    })
  } catch (error) {
    console.error('Failed to create application:', error)
    ElMessage.error('创建应用失败')
  }
}

const exportExcel = async () => {
  try {
    const filters = {
      ...(searchForm.status && { status: searchForm.status }),
      ...(searchForm.department && { team: searchForm.department })
    }

    const columns = [
      'l2_id',
      'app_name',
      'ak_supervision_acceptance_year',
      'overall_transformation_target',
      'current_transformation_phase',
      'current_status',
      'dev_team',
      'dev_owner',
      'ops_team',
      'ops_owner',
      'app_tier',
      'belonging_l1_name',
      'belonging_projects',
      'progress_percentage',
      'is_delayed',
      'delay_days'
    ]

    // Use the new direct download method
    await ExcelAPI.exportAndDownloadApplications({
      filters,
      columns
    })

    ElMessage.success(`Excel文件导出成功`)
  } catch (error) {
    console.error('Failed to export Excel:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// Navigate to import page
const goToImport = () => {
  router.push('/import')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// SubTask related functions
const getApplicationName = (applicationId: number) => {
  const app = allApplications.value.find(app => app.id === applicationId)
  return app ? app.app_name : '-'
}

const getApplicationL2Id = (applicationId: number) => {
  const app = allApplications.value.find(app => app.id === applicationId)
  return app ? app.l2_id : '-'
}

const getSubTaskProgressColor = (row: SubTask) => {
  if (row.task_status === '存在阻塞' || row.is_blocked) return '#f56565'
  const progress = calculateSubTaskProgress(row)
  if (progress >= 80) return '#48bb78'
  return '#667eea'
}

const calculateSubTaskProgress = (row: SubTask) => {
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

const getSubTaskWorkingDays = (row: SubTask) => {
  // Calculate working days from earliest actual date to now
  const actualDates = [
    row.actual_requirement_date,
    row.actual_release_date,
    row.actual_tech_online_date,
    row.actual_biz_online_date
  ].filter(d => d && d !== null) as string[]

  if (actualDates.length === 0) return 0

  const earliestDate = new Date(actualDates.sort()[0])
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - earliestDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

const getSubTaskDelayInfo = (row: SubTask) => {
  // Calculate delay based on planned vs actual dates
  const today = new Date()
  let delayDays = 0
  let delayType = ''

  // Check each milestone for delays
  if (row.planned_biz_online_date && !row.actual_biz_online_date) {
    const plannedDate = new Date(row.planned_biz_online_date)
    if (today > plannedDate) {
      delayDays = Math.ceil((today.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24))
      delayType = '业务上线'
    }
  } else if (row.planned_tech_online_date && !row.actual_tech_online_date) {
    const plannedDate = new Date(row.planned_tech_online_date)
    if (today > plannedDate) {
      delayDays = Math.ceil((today.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24))
      delayType = '技术上线'
    }
  } else if (row.planned_release_date && !row.actual_release_date) {
    const plannedDate = new Date(row.planned_release_date)
    if (today > plannedDate) {
      delayDays = Math.ceil((today.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24))
      delayType = '发版'
    }
  }

  if (delayDays > 0) {
    return {
      hasDelay: true,
      days: delayDays,
      type: delayType,
      text: `${delayType}延期${delayDays}天`,
      severity: delayDays > 30 ? 'danger' : 'warning'
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

const getDateComparisonClass = (plannedDate: string | null | undefined, actualDate: string | null | undefined) => {
  if (!actualDate) return 'pending'
  if (!plannedDate) return 'completed'

  const planned = new Date(plannedDate)
  const actual = new Date(actualDate)

  if (actual <= planned) {
    return 'on-time' // 按时或提前完成
  } else {
    const delayDays = Math.ceil((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24))
    if (delayDays > 30) {
      return 'delayed-serious' // 严重延期
    } else {
      return 'delayed' // 轻度延期
    }
  }
}

const showSubTaskDelayDetails = (row: SubTask) => {
  const delayInfo = getSubTaskDelayInfo(row)

  ElMessageBox.alert(
    `<div style="line-height: 1.8;">
      <p><strong>版本名称：</strong>${row.version_name}</p>
      <p><strong>延期类型：</strong>${delayInfo.type}</p>
      <p><strong>延期天数：</strong>${delayInfo.days}天</p>
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

const resetSubtaskSearch = () => {
  subtaskSearchForm.keyword = ''
  subtaskSearchForm.status = undefined
  subtaskSearchForm.application = undefined
  subtaskCurrentPage.value = 1
}

const handleSubTaskSelectionChange = (selection: SubTask[]) => {
  selectedSubTasks.value = selection
}

const editSubTask = (row: SubTask) => {
  router.push(`/subtasks/${row.l2_id}`)
}


const handleSubTaskSizeChange = (size: number) => {
  subtaskPageSize.value = size
  subtaskCurrentPage.value = 1
}

const handleSubTaskCurrentChange = (page: number) => {
  subtaskCurrentPage.value = page
}

// Show application detail
const showAppDetail = async (row: Application) => {
  detailData.value = { ...row }
  activeDetailTab.value = 'basic'
  showDetailDialog.value = true

  // Load audit records when showing details
  loadAuditRecords(row.id)
}

// Load audit records for the application
const loadAuditRecords = async (applicationId: number) => {
  try {
    auditLoading.value = true
    const records = await AuditAPI.getRecordHistory('applications', applicationId)

    // Ensure records is an array and filter out invalid entries
    if (Array.isArray(records)) {
      auditRecords.value = records.filter(record =>
        record && typeof record === 'object' && record.operation
      )
    } else {
      console.warn('Audit records API did not return an array:', records)
      auditRecords.value = []
    }
  } catch (error) {
    console.error('Failed to load audit records:', error)
    auditRecords.value = []
  } finally {
    auditLoading.value = false
  }
}

// Get operation type for styling
const getOperationType = (operation: string) => {
  const typeMap: Record<string, string> = {
    'INSERT': 'success',
    'UPDATE': 'warning',
    'DELETE': 'danger'
  }
  return typeMap[operation] || 'info'
}

// Get operation text in Chinese
const getOperationText = (operation: string) => {
  const textMap: Record<string, string> = {
    'INSERT': '创建',
    'UPDATE': '更新',
    'DELETE': '删除'
  }
  return textMap[operation] || operation
}

// Get field label in Chinese
const getFieldLabel = (field: string) => {
  const labelMap: Record<string, string> = {
    'app_name': '应用名称',
    'l2_id': 'L2 ID',
    'belonging_l1_name': '所属L1',
    'belonging_projects': '所属项目',
    'belonging_kpi': '所属指标',
    'ak_supervision_acceptance_year': '监管验收年份',
    'overall_transformation_target': '改造目标',
    'current_status': '当前状态',
    'current_transformation_phase': '当前改造阶段',
    'dev_owner': '开发负责人',
    'dev_team': '开发团队',
    'ops_owner': '运维负责人',
    'ops_team': '运维团队',
    'app_tier': '应用档位',
    'dev_mode': '开发模式',
    'ops_mode': '运维模式',
    'acceptance_status': '验收状态',
    'is_domain_transformation_completed': '域AK改造完成',
    'is_dbpm_transformation_completed': 'DBPM改造完成',
    'planned_requirement_date': '计划需求时间',
    'planned_release_date': '计划发版时间',
    'planned_tech_online_date': '计划技术上线',
    'planned_biz_online_date': '计划业务上线',
    'actual_requirement_date': '实际需求时间',
    'actual_release_date': '实际发版时间',
    'actual_tech_online_date': '实际技术上线',
    'actual_biz_online_date': '实际业务上线',
    'notes': '备注'
  }
  return labelMap[field] || field
}

// Format field value for display
const formatFieldValue = (field: string, value: any) => {
  if (value === null || value === undefined || value === '') return '空'

  // Date fields
  if (field.includes('_date') || field.includes('_at')) {
    return formatYearMonth(value)
  }

  // Boolean fields
  if (field.startsWith('is_')) {
    return value ? '是' : '否'
  }

  // Year field
  if (field === 'ak_supervision_acceptance_year') {
    return value + '年'
  }

  return value.toString()
}

// Check if can rollback
const canRollback = (record: AuditLog) => {
  if (!record || !record.id || !record.created_at) return false

  // Only allow rollback of recent operations (within 7 days)
  const recordDate = new Date(record.created_at)
  const now = new Date()
  const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
  return daysDiff <= 7
}

// Rollback audit operation
const rollbackAudit = async (record: AuditLog) => {
  if (!record || !record.id) {
    ElMessage.error('无法回滚：记录ID无效')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要回滚此操作吗？这将恢复到操作前的状态。`,
      '确认回滚',
      {
        confirmButtonText: '确定回滚',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await AuditAPI.rollbackAuditLog(record.id, {
      confirm: true,
      reason: '管理员手动回滚'
    })

    ElMessage.success('操作已回滚')

    // Reload application data and audit records
    await loadApplications()
    await loadAuditRecords(detailData.value.id!)
  } catch (error: any) {
    if (error === 'cancel') return

    console.error('Failed to rollback:', error)
    ElMessage.error('回滚操作失败')
  }
}

// Check if application has date adjustments
const hasDateAdjustment = (row: Application, phase: string) => {
  // This would check from audit records if the date field has been modified
  // For now, we'll simulate based on audit cache
  const adjustments = planAdjustmentCache.value.get(row.id)
  if (!adjustments) return false

  const fieldMap: Record<string, string> = {
    'requirement': 'planned_requirement_date',
    'release': 'planned_release_date',
    'tech': 'planned_tech_online_date',
    'biz': 'planned_biz_online_date'
  }

  return adjustments.some((adj: any) => adj.field === fieldMap[phase])
}

// Get plan adjustment count for an application
const getPlanAdjustmentCount = (row: Application) => {
  // Count unique adjustment events from audit records
  const adjustments = planAdjustmentCache.value.get(row.id)
  if (!adjustments) return 0

  // Count unique adjustment dates
  const uniqueDates = new Set(adjustments.map((adj: any) => adj.adjusted_at.split('T')[0]))
  return uniqueDates.size
}

// Show plan history dialog
const showPlanHistory = async (row: Application) => {
  planHistoryLoading.value = true
  showPlanHistoryDialog.value = true

  try {
    // Load audit records for this application
    const audits = await AuditAPI.getRecordHistory('applications', row.id)

    // Filter for plan date changes
    const planFields = [
      'planned_requirement_date',
      'planned_release_date',
      'planned_tech_online_date',
      'planned_biz_online_date'
    ]

    const planAudits = audits.filter(audit =>
      audit.changed_fields &&
      audit.changed_fields.some(field => planFields.includes(field))
    )

    // Process into timeline data
    planHistoryData.value = processPlanHistory(planAudits, row)
    planAdjustmentDetails.value = extractAdjustmentDetails(planAudits)
    currentPlanAdjustment.value = planHistoryData.value[0]

  } catch (error) {
    console.error('Failed to load plan history:', error)
    planHistoryData.value = []
    planAdjustmentDetails.value = []
  } finally {
    planHistoryLoading.value = false
  }
}

// Process plan history for timeline view
const processPlanHistory = (audits: AuditLog[], currentApp: Application) => {
  const history: any[] = []

  // Add current state
  history.push({
    adjusted_at: new Date().toISOString(),
    adjusted_by: '当前状态',
    planned_requirement_date: currentApp.planned_requirement_date,
    planned_release_date: currentApp.planned_release_date,
    planned_tech_online_date: currentApp.planned_tech_online_date,
    planned_biz_online_date: currentApp.planned_biz_online_date,
    is_current: true
  })

  // Add historical states from audits
  audits.forEach(audit => {
    const planState = {
      adjusted_at: audit.created_at,
      adjusted_by: audit.user_full_name || '系统',
      planned_requirement_date: audit.old_values?.planned_requirement_date,
      planned_release_date: audit.old_values?.planned_release_date,
      planned_tech_online_date: audit.old_values?.planned_tech_online_date,
      planned_biz_online_date: audit.old_values?.planned_biz_online_date
    }

    // Only add if there are actual date values
    if (Object.values(planState).some(v => v && v !== audit.created_at && v !== audit.user_full_name)) {
      history.push(planState)
    }
  })

  return history
}

// Extract adjustment details for table view
const extractAdjustmentDetails = (audits: AuditLog[]) => {
  const details: any[] = []
  const planFields = [
    'planned_requirement_date',
    'planned_release_date',
    'planned_tech_online_date',
    'planned_biz_online_date'
  ]

  audits.forEach(audit => {
    audit.changed_fields?.forEach(field => {
      if (planFields.includes(field)) {
        const oldDate = audit.old_values?.[field]
        const newDate = audit.new_values?.[field]

        if (oldDate && newDate) {
          const daysDiff = calculateDaysDiff(oldDate, newDate)

          details.push({
            adjusted_at: audit.created_at,
            adjusted_by: audit.user_full_name || '系统',
            field: field,
            old_date: oldDate,
            new_date: newDate,
            delay_days: daysDiff,
            reason: audit.new_values?.adjustment_reason || '未说明'
          })
        }
      }
    })
  })

  return details.sort((a, b) => new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime())
}

// Calculate days difference between two dates
const calculateDaysDiff = (date1: string, date2: string) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = d2.getTime() - d1.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Get adjustment field label
const getAdjustmentFieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    'planned_requirement_date': '需求完成',
    'planned_release_date': '发版时间',
    'planned_tech_online_date': '技术上线',
    'planned_biz_online_date': '业务上线'
  }
  return labels[field] || field
}

// Get phase style for timeline chart
const getPhaseStyle = (history: any, phase: string) => {
  const fieldMap: Record<string, string> = {
    'requirement': 'planned_requirement_date',
    'release': 'planned_release_date',
    'tech': 'planned_tech_online_date',
    'biz': 'planned_biz_online_date'
  }

  const date = history[fieldMap[phase]]
  if (!date) return { visibility: 'hidden' }

  // Calculate position based on date
  // This is simplified - in production you'd calculate actual positions
  return {}
}

// Get delay count for an application
const getDelayCount = (row: Application) => {
  // First check if application is currently delayed
  if (!row.is_delayed && !planAdjustmentCache.value.has(row.id)) {
    return 0
  }

  // Try to get from cache first
  const adjustments = planAdjustmentCache.value.get(row.id)
  if (adjustments && adjustments.length > 0) {
    // Count unique delay events from adjustments
    const delayEvents = adjustments.filter((adj: any) => {
      return adj.field && adj.field.includes('planned_') && adj.field.includes('_date')
    })

    // Group by date to count unique delay events
    const uniqueDates = new Set(delayEvents.map((adj: any) => adj.adjusted_at.split('T')[0]))
    return Math.max(uniqueDates.size, row.is_delayed ? 1 : 0)
  }

  // If no cache data but is delayed, return at least 1
  return row.is_delayed ? 1 : 0
}

// Get delay type for styling
const getDelayType = (delayDays: number) => {
  if (Math.abs(delayDays) > 30) return 'danger'
  if (Math.abs(delayDays) > 15) return 'warning'
  return 'info'
}

// Get delay phase label
const getDelayPhaseLabel = (phase: string) => {
  const labels: Record<string, string> = {
    'requirement': '需求阶段',
    'release': '发版阶段',
    'tech': '技术上线',
    'biz': '业务上线',
    'planned_requirement_date': '需求阶段',
    'planned_release_date': '发版阶段',
    'planned_tech_online_date': '技术上线',
    'planned_biz_online_date': '业务上线'
  }
  return labels[phase] || phase
}

// Show delay details dialog
const showDelayDetails = async (row: Application) => {
  delayDetailsLoading.value = true
  showDelayDetailsDialog.value = true

  try {
    // Load audit records for this application
    const audits = await AuditAPI.getRecordHistory('applications', row.id)

    // Process delay history
    const delayHistory = await processDelayHistory(audits, row)
    const phaseStatistics = calculatePhaseStatistics(delayHistory, row)
    const reasonAnalysis = analyzeDelayReasons(delayHistory)

    // Calculate total delay metrics
    // If no history but currently delayed, use current delay_days
    let totalDelayCount = delayHistory.length || (row.is_delayed ? 1 : 0)
    let totalDelayDays = calculateTotalDelayDays(delayHistory)

    // If current application is delayed but no history found, use current delay_days
    if (row.is_delayed && totalDelayDays === 0) {
      totalDelayDays = row.delay_days || 0

      // Add current delay to history if not already included
      if (delayHistory.length === 0) {
        delayHistory.push({
          date: new Date().toISOString(),
          phase: 'planned_biz_online_date',
          originalDate: row.planned_biz_online_date,
          newDate: null,
          delayDays: row.delay_days,
          delayUnit: row.delay_days > 30 ? `${Math.floor(row.delay_days / 30)}个月` : '天',
          reason: '当前延期状态',
          operator: '系统',
          type: row.delay_days > 30 ? 'danger' : row.delay_days > 15 ? 'warning' : 'primary'
        })
        totalDelayCount = 1
      }
    }

    delayDetailsData.value = {
      applicationName: row.app_name,
      l2Id: row.l2_id,
      totalDelayCount,
      totalDelayDays,
      delayHistory,
      phaseStatistics,
      reasonAnalysis,
      currentDelayStatus: row.is_delayed ? `延期${row.delay_days}天` : '正常'
    }
  } catch (error) {
    console.error('Failed to load delay details:', error)
    ElMessage.error('加载延期详情失败')

    // Fallback to current delay information if available
    if (row.is_delayed) {
      delayDetailsData.value = {
        applicationName: row.app_name,
        l2Id: row.l2_id,
        totalDelayCount: 1,
        totalDelayDays: row.delay_days || 0,
        delayHistory: [{
          date: new Date().toISOString(),
          phase: 'planned_biz_online_date',
          originalDate: row.planned_biz_online_date,
          newDate: null,
          delayDays: row.delay_days || 0,
          delayUnit: (row.delay_days || 0) > 30 ? `${Math.floor((row.delay_days || 0) / 30)}个月` : '天',
          reason: '当前延期状态',
          operator: '系统',
          type: (row.delay_days || 0) > 30 ? 'danger' : (row.delay_days || 0) > 15 ? 'warning' : 'primary'
        }],
        phaseStatistics: [],
        reasonAnalysis: [{ reason: '当前延期状态', count: 1 }],
        currentDelayStatus: `延期${row.delay_days}天`
      }
    } else {
      delayDetailsData.value = {
        totalDelayCount: 0,
        totalDelayDays: 0,
        delayHistory: [],
        phaseStatistics: [],
        reasonAnalysis: []
      }
    }
  } finally {
    delayDetailsLoading.value = false
  }
}

// Process delay history from audit records
const processDelayHistory = async (audits: AuditLog[], app: Application) => {
  const delayHistory: any[] = []
  const planFields = [
    'planned_requirement_date',
    'planned_release_date',
    'planned_tech_online_date',
    'planned_biz_online_date'
  ]

  // Filter and process audit records for plan date changes
  audits.forEach(audit => {
    if (!audit.changed_fields) return

    audit.changed_fields.forEach(field => {
      if (planFields.includes(field)) {
        const oldDate = audit.old_values?.[field]
        const newDate = audit.new_values?.[field]

        if (oldDate && newDate) {
          const delayDays = calculateDaysDiff(oldDate, newDate)

          // Record both delays (positive) and advances (negative)
          if (delayDays !== 0) {
            delayHistory.push({
              date: audit.created_at,
              phase: field,
              originalDate: oldDate,
              newDate: newDate,
              delayDays: Math.abs(delayDays),
              delayUnit: Math.abs(delayDays) > 30 ? `${Math.floor(Math.abs(delayDays) / 30)}个月` : '天',
              reason: audit.new_values?.notes || audit.new_values?.adjustment_reason || '未说明原因',
              operator: audit.user_full_name || '系统',
              type: delayDays > 30 ? 'danger' : delayDays > 15 ? 'warning' : 'primary',
              isDelay: delayDays > 0  // true for delay, false for advance
            })
          }
        }
      }
    })
  })

  // Sort by date (newest first)
  return delayHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Calculate phase statistics
const calculatePhaseStatistics = (delayHistory: any[], app: Application) => {
  const phases = ['requirement', 'release', 'tech', 'biz']
  const fieldMap: Record<string, string> = {
    'requirement': 'planned_requirement_date',
    'release': 'planned_release_date',
    'tech': 'planned_tech_online_date',
    'biz': 'planned_biz_online_date'
  }

  const stats = phases.map(phase => {
    const phaseField = fieldMap[phase]
    const phaseDelays = delayHistory.filter(item => item.phase === phaseField && item.isDelay !== false)

    let totalDelayDays = phaseDelays.reduce((sum, item) => sum + item.delayDays, 0)
    let delayCount = phaseDelays.length

    // For biz phase, if app is currently delayed and no history, use current delay
    if (phase === 'biz' && app.is_delayed && delayCount === 0) {
      totalDelayDays = app.delay_days || 0
      delayCount = 1
    }

    return {
      phase: phase,
      delayCount: delayCount,
      totalDelayDays: totalDelayDays,
      currentPlannedDate: (app as any)[phaseField],
      isDelayed: phase === 'biz' && app.is_delayed
    }
  })

  return stats
}

// Analyze delay reasons
const analyzeDelayReasons = (delayHistory: any[]) => {
  const reasonMap = new Map<string, number>()

  delayHistory.forEach(item => {
    const reason = item.reason || '未说明原因'
    reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1)
  })

  return Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
}

// Calculate total delay days
const calculateTotalDelayDays = (delayHistory: any[]) => {
  return delayHistory.reduce((sum, item) => sum + item.delayDays, 0)
}

// Watch for page changes to load delay data
watch([currentPage, pageSize], async () => {
  // Load delay data for newly visible applications
  const visibleApps = applications.value
  for (const app of visibleApps) {
    if (!planAdjustmentCache.value.has(app.id) && (app.is_delayed || getPlanAdjustmentCount(app) > 0)) {
      loadDelayDataForApp(app)
    }
  }
})
</script>

<style scoped>
.applications-view {
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

.actions {
  display: flex;
  gap: 10px;
}

.search-bar {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.data-tabs {
  margin-bottom: 20px;
}

.data-tabs .el-tabs__header {
  margin-bottom: 0;
}

.block-warning {
  color: #f56565;
  font-size: 12px;
  margin-top: 2px;
}

.completed-date {
  color: #48bb78;
  font-weight: 600;
}

/* 子任务表格样式 */
.progress-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.working-days {
  font-size: 11px;
  color: #718096;
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

/* 日期对比单元格样式 */
.date-cell {
  padding: 4px;
  border-radius: 4px;
  font-size: 13px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-cell.planned {
  color: #4a5568;
  background-color: #f7fafc;
  font-weight: 500;
}

.date-cell.on-time {
  color: #22543d;
  background-color: #c6f6d5;
  font-weight: 600;
}

.date-cell.delayed {
  color: #7c2d12;
  background-color: #fed7aa;
  font-weight: 600;
}

.date-cell.delayed-serious {
  color: #7c2d12;
  background-color: #feb2b2;
  font-weight: 600;
}

.date-cell.pending {
  color: #a0aec0;
  background-color: #f7fafc;
}

.date-cell.completed {
  color: #22543d;
  background-color: #c6f6d5;
  font-weight: 600;
}

/* 子任务表格列头样式 */
:deep(.el-table__header-wrapper .el-table__header .is-group) {
  background-color: #f8f9fa;
}

:deep(.el-table__header-wrapper .el-table__header .is-group > div) {
  background-color: #f8f9fa;
  font-weight: 600;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.operation-buttons .el-button {
  padding: 5px 10px;
}

.blocked-text {
  color: #f56565;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 12px;
  min-width: 35px;
}

.delay-warning {
  color: #f56565;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 移动端响应式设计 */
/* 表格样式优化 */
.el-table {
  font-size: 13px;
}

.el-table th {
  background-color: #f7fafc;
  font-weight: 600;
  color: #2d3748;
  text-align: center !important;
}

.el-table td {
  padding: 10px 0;
}

/* 计划时间点突出显示 */
.el-table th.el-table__cell[colspan="1"][rowspan="1"] {
  .cell:contains("计划") {
    color: #667eea;
  }
}

/* 进度条样式 */
.el-progress {
  line-height: 1;
}

.el-progress__text {
  font-size: 12px !important;
  color: #2d3748;
}

/* 详情弹窗样式 */
.el-descriptions {
  margin-top: 10px;
}

.el-descriptions-item__label {
  font-weight: 600;
  color: #4a5568;
}

/* 标签页样式 */
.el-tabs__item {
  font-size: 14px;
}

.el-tabs__content {
  padding: 20px 10px;
}

/* 审计记录样式 */
.audit-empty {
  padding: 40px 0;
  text-align: center;
}

.audit-record {
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
  margin-bottom: 10px;
}

.audit-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.audit-user {
  font-weight: 600;
  color: #2d3748;
}

.audit-changes {
  padding: 8px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin: 10px 0;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.field-name {
  font-weight: 500;
  color: #4a5568;
  min-width: 100px;
}

.old-value {
  color: #a0aec0;
  text-decoration: line-through;
}

.arrow {
  color: #718096;
  font-weight: bold;
}

.new-value {
  color: #48bb78;
  font-weight: 500;
}

.audit-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

/* Timeline 样式优化 */
.el-timeline {
  padding: 20px;
}

.el-timeline-item__timestamp {
  color: #718096 !important;
  font-size: 12px !important;
}

/* 计划调整指示器 */
.plan-date-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.adjustment-indicator {
  color: #ed8936;
  font-size: 14px;
  cursor: help;
}

.adjustment-badge {
  cursor: pointer;
}

.adjustment-badge .el-badge__content {
  background-color: #ed8936;
}

.no-adjustment {
  color: #cbd5e0;
  font-size: 12px;
}

/* 计划历史弹窗样式 */
.adjustment-summary {
  margin-bottom: 20px;
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.latest-adjustment {
  font-size: 12px;
  color: #718096;
  margin-left: 20px;
}

/* 时间线对比视图 */
.timeline-comparison {
  margin: 20px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.timeline-comparison h3 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 16px;
}

.timeline-chart {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.timeline-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.timeline-label {
  width: 150px;
  flex-shrink: 0;
}

.version-label {
  margin-bottom: 5px;
}

.adjust-info {
  font-size: 12px;
  color: #718096;
}

.adjust-date {
  margin-bottom: 2px;
}

.adjust-user {
  color: #4a5568;
}

.timeline-content {
  flex: 1;
  overflow-x: auto;
}

.timeline-bar {
  display: flex;
  gap: 10px;
  min-width: 600px;
  padding: 10px;
  background: #f7fafc;
  border-radius: 4px;
  position: relative;
}

.phase-block {
  flex: 1;
  padding: 8px;
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-block.requirement {
  border-left: 3px solid #667eea;
}

.phase-block.release {
  border-left: 3px solid #48bb78;
}

.phase-block.tech {
  border-left: 3px solid #ed8936;
}

.phase-block.biz {
  border-left: 3px solid #f56565;
}

.phase-date {
  font-weight: 600;
  color: #2d3748;
}

/* 调整明细表格 */
.adjustment-details {
  margin-top: 30px;
}

.adjustment-details h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 16px;
}

.old-date {
  color: #a0aec0;
  text-decoration: line-through;
}

.new-date {
  color: #48bb78;
  font-weight: 600;
}

.no-adjustment-history {
  padding: 40px;
  text-align: center;
}

/* 延期按钮容器 */
.delay-button-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

/* 延期状态按钮样式 */
.delay-status-button {
  font-size: 12px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  font-weight: 500;
  position: relative;
  overflow: hidden;
  min-width: 90px;
}

.delay-status-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.delay-status-button:hover::before {
  width: 120%;
  height: 120%;
}

.delay-status-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 12px rgba(0,0,0,0.12);
}

.delay-status-button:active {
  transform: translateY(0) scale(1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 延期按钮图标 */
.delay-status-button .delay-icon {
  margin-right: 3px;
  font-size: 14px;
  animation: pulse 2s infinite;
}

.delay-status-button .delay-text {
  margin: 0 2px;
}

.delay-status-button .arrow-icon {
  margin-left: 2px;
  font-size: 12px;
  transition: transform 0.3s;
}

.delay-status-button:hover .arrow-icon {
  transform: translateX(3px);
}

/* 信息图标 */
.info-icon {
  color: #909399;
  font-size: 14px;
  cursor: help;
  transition: color 0.3s;
}

.info-icon:hover {
  color: #606266;
}

/* 危险级别按钮 */
.delay-status-button.el-button--danger.is-plain {
  background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
  border-color: #fca5a5;
  color: #b91c1c;
  animation: danger-pulse 3s infinite;
}

.delay-status-button.el-button--danger.is-plain:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #f87171;
  color: #991b1b;
}

/* 警告级别按钮 */
.delay-status-button.el-button--warning.is-plain {
  background: linear-gradient(135deg, #fffdf7 0%, #fef3c7 100%);
  border-color: #fcd34d;
  color: #92400e;
}

.delay-status-button.el-button--warning.is-plain:hover {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fbbf24;
  color: #78350f;
}

/* 正常状态标签 */
.el-tag--success.is-plain {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #86efac;
  color: #15803d;
  padding: 5px 12px;
  font-size: 12px;
}

.el-tag--success.is-plain .status-icon {
  margin-right: 4px;
  font-size: 14px;
  color: #22c55e;
}

/* 动画 */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

@keyframes danger-pulse {
  0%, 100% {
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
  }
  50% {
    box-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
  }
}

/* 延期详情对话框样式 */
.delay-summary {
  margin-bottom: 20px;
}

.delay-summary .summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-delay-days {
  color: #f56565;
  margin-left: 20px;
}

/* 延期历史时间线 */
.delay-timeline {
  margin: 20px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.delay-timeline h3 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 16px;
}

.delay-record {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.delay-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.delay-phase {
  color: #4a5568;
  font-weight: 500;
}

.delay-content {
  padding: 10px 0;
}

.delay-dates {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}

.original-date {
  color: #a0aec0;
}

.new-date {
  color: #f56565;
  font-weight: 600;
}

.delay-reason {
  margin: 8px 0;
  padding: 8px;
  background: #f7fafc;
  border-radius: 4px;
  font-size: 13px;
}

.reason-label {
  color: #4a5568;
  font-weight: 500;
  margin-right: 8px;
}

.reason-text {
  color: #2d3748;
}

.delay-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #718096;
}

/* 各阶段延期统计 */
.delay-statistics {
  margin: 30px 0;
}

.delay-statistics h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 16px;
}

.text-danger {
  color: #f56565;
  font-weight: 600;
}

/* 延期原因分析 */
.delay-analysis {
  margin: 30px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.delay-analysis h3 {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 16px;
}

.reason-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.no-delay-history {
  padding: 60px;
  text-align: center;
}

@media (max-width: 768px) {
  .applications-view {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    text-align: center;
  }
  
  .header h2 {
    font-size: 20px;
  }
  
  .actions {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .actions .el-button {
    flex: 1;
    min-width: 80px;
    font-size: 12px;
  }
  
  .search-bar {
    padding: 15px;
  }
  
  .search-bar .el-row {
    gap: 10px;
  }
  
  .search-bar .el-button {
    width: 100%;
    margin-top: 10px;
  }
  
  /* 表格在移动端的处理 */
  .el-table {
    font-size: 12px;
  }
  
  .el-table .el-table__cell {
    padding: 8px 4px;
  }
  
  .el-table .cell {
    line-height: 1.2;
    word-break: break-word;
  }
  
  /* 隐藏一些在移动端不重要的列 */
  .el-table .el-table-column--selection {
    display: none;
  }
  
  .progress-cell {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
  
  .progress-text {
    font-size: 10px;
  }
  
  .pagination {
    margin-top: 15px;
  }
  
  .pagination .el-pagination {
    justify-content: center;
  }
  
  .pagination .el-pagination__sizes,
  .pagination .el-pagination__jump {
    display: none;
  }
}

@media (max-width: 480px) {
  .applications-view {
    padding: 5px;
  }
  
  .header h2 {
    font-size: 18px;
  }
  
  .actions .el-button {
    font-size: 11px;
    padding: 8px 12px;
  }
  
  .search-bar {
    padding: 10px;
  }
  
  .el-table {
    font-size: 11px;
  }
  
  .el-table .el-table__cell {
    padding: 6px 2px;
  }
  
  /* 进一步简化表格显示 */
  .el-tag {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .el-button--small {
    font-size: 10px;
    padding: 4px 8px;
  }
}

/* Fix for Element Plus select display issue */
.search-bar .el-select__placeholder.is-transparent {
  opacity: 1 !important;
  color: #c0c4cc !important;
}

.search-bar .el-select__selected-item:not(.el-select__placeholder) {
  opacity: 1 !important;
  color: #606266 !important;
}

/* Upload area styles */
.upload-area {
  width: 100%;
}

.upload-area .el-upload {
  width: 100%;
}

.upload-area .el-upload-dragger {
  width: 100%;
  height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.el-icon--upload {
  font-size: 67px;
  color: #c0c4cc;
  margin-bottom: 16px;
}
</style>