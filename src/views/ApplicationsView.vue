<template>
  <div class="applications-view">
    <el-card>
      <template #header>
        <div class="header">
          <h2>应用管理</h2>
          <div class="actions">
            <el-button type="primary" @click="showCreateDialog = true" v-if="mainTab === 'applications'">
              <el-icon><plus /></el-icon>
              新增应用
            </el-button>
            <el-button type="success" @click="goToImport" v-if="mainTab === 'applications'">
              <el-icon><upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="warning" @click="mainTab === 'applications' ? exportExcel() : exportSubTasksExcel()">
              <el-icon><download /></el-icon>
              导出Excel
            </el-button>
          </div>
        </div>
      </template>

      <!-- Main Data Type Tabs -->
      <el-tabs v-model="mainTab" class="main-data-tabs" @tab-change="handleMainTabChange">
        <el-tab-pane label="应用列表" name="applications"></el-tab-pane>
        <el-tab-pane label="子任务列表" name="subtasks"></el-tab-pane>
      </el-tabs>

      <!-- Applications Content -->
      <div v-show="mainTab === 'applications'" class="content-container">
      <!-- Filter Section -->
      <div class="filter-section">
        <!-- View Type Tabs -->
        <el-tabs v-model="viewType" @tab-change="handleViewTypeChange" class="view-tabs">
          <el-tab-pane name="favorites">
            <template #label>
              <span class="tab-with-icon">
                <el-icon><star-filled /></el-icon>
                我关注的
                <el-badge v-if="favoriteApplications.length > 0" :value="favoriteApplications.length" class="tab-badge" />
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane label="全部应用" name="all"></el-tab-pane>
          <el-tab-pane name="currentMonth">
            <template #label>
              <span>{{ currentMonthLabel }}</span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="nextMonth">
            <template #label>
              <span>{{ nextMonthLabel }}</span>
            </template>
          </el-tab-pane>
        </el-tabs>

        <!-- Monthly Plan Summary (shown when viewing monthly plans) -->
        <div v-if="viewType !== 'all' && viewType !== 'favorites'" class="monthly-plan-summary">
          <el-alert :type="monthlyPlanAlert.type" :closable="false">
            <template #title>
              <div class="summary-header">
                <span>{{ monthlyPlanAlert.title }}</span>
                <el-button size="small" type="primary" @click="exportMonthlyPlan">
                  <el-icon><download /></el-icon>
                  导出月度计划
                </el-button>
              </div>
            </template>
            <div class="plan-statistics">
              <span class="stat-item">需求完成: <strong>{{ monthlyStatistics.requirement }}</strong> 个</span>
              <span class="stat-item">发版: <strong>{{ monthlyStatistics.release }}</strong> 个</span>
              <span class="stat-item">技术上线: <strong>{{ monthlyStatistics.tech }}</strong> 个</span>
              <span class="stat-item">业务上线: <strong>{{ monthlyStatistics.biz }}</strong> 个</span>
            </div>
          </el-alert>
        </div>

        <!-- Main Search and Quick Filters -->
        <div class="filter-content">
          <div class="main-filters">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索 L2 ID 或应用名称..."
              clearable
              class="search-input"
            >
              <template #prefix>
                <el-icon><el-icon-search /></el-icon>
              </template>
            </el-input>

            <el-select
              v-model="searchForm.target"
              placeholder="改造目标"
              clearable
              class="filter-select"
            >
              <el-option
                v-for="item in targetOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-select
              v-model="searchForm.progress_status"
              placeholder="改造进度"
              clearable
              class="filter-select"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <el-select
              v-model="searchForm.acceptance_year"
              placeholder="监管验收年份"
              clearable
              class="filter-select"
            >
              <el-option :value="2024" label="2024年" />
              <el-option :value="2025" label="2025年" />
              <el-option :value="2026" label="2026年" />
              <el-option :value="2027" label="2027年" />
            </el-select>

            <el-button
              @click="showAdvancedFilters = !showAdvancedFilters"
              class="toggle-filters-btn"
            >
              <el-icon><el-icon-filter /></el-icon>
              {{ showAdvancedFilters ? '收起筛选' : '更多筛选' }}
            </el-button>

            <el-button @click="resetSearch" class="reset-btn">
              重置
            </el-button>
          </div>

          <!-- Advanced Filters -->
          <div v-if="showAdvancedFilters" class="advanced-filters">
            <!-- Group 1: Basic Information Filters -->
            <div class="filter-grid">
              <div class="filter-item">
                <label class="filter-label">所属L1</label>
                <el-select
                  v-model="searchForm.belonging_l1"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in l1Options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">档位</label>
                <el-select
                  v-model="searchForm.app_tier"
                  placeholder="全部"
                  clearable
                >
                  <el-option :value="1" label="1档" />
                  <el-option :value="2" label="2档" />
                  <el-option :value="3" label="3档" />
                  <el-option :value="4" label="4档" />
                  <el-option :value="5" label="5档" />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">所属项目</label>
                <el-select
                  v-model="searchForm.belonging_project"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in projectOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">开发模式</label>
                <el-select
                  v-model="searchForm.dev_mode"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in devModeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">运维模式</label>
                <el-select
                  v-model="searchForm.ops_mode"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in opsModeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">开发负责人</label>
                <el-select
                  v-model="searchForm.dev_owner"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in devOwnerOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">开发团队</label>
                <el-select
                  v-model="searchForm.dev_team"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in devTeamOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">运维负责人</label>
                <el-select
                  v-model="searchForm.ops_owner"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in opsOwnerOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">运维团队</label>
                <el-select
                  v-model="searchForm.ops_team"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in opsTeamOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">所属KPI指标</label>
                <el-select
                  v-model="searchForm.belonging_kpi"
                  placeholder="全部"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="item in kpiOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">域名化改造</label>
                <el-select
                  v-model="searchForm.domain_completed"
                  placeholder="全部"
                  clearable
                >
                  <el-option :value="true" label="已完成" />
                  <el-option :value="false" label="未完成" />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">DBPM改造</label>
                <el-select
                  v-model="searchForm.dbpm_completed"
                  placeholder="全部"
                  clearable
                >
                  <el-option :value="true" label="已完成" />
                  <el-option :value="false" label="未完成" />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">验收状态</label>
                <el-select
                  v-model="searchForm.acceptance_status"
                  placeholder="全部"
                  clearable
                >
                  <el-option value="未验收" label="未验收" />
                  <el-option value="验收中" label="验收中" />
                  <el-option value="已验收" label="已验收" />
                </el-select>
              </div>
            </div>

            <!-- Group 2: Time Filters (Single Row) -->
            <div class="time-filters">
              <div class="filter-item">
                <label class="filter-label">计划需求时间</label>
                <el-select
                  v-model="searchForm.planned_req_months"
                  placeholder="选择月份（可多选）"
                  multiple
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  style="width: 100%"
                >
                  <el-option
                    v-for="month in monthOptions"
                    :key="month.value"
                    :label="month.label"
                    :value="month.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">计划发版时间</label>
                <el-select
                  v-model="searchForm.planned_release_months"
                  placeholder="选择月份（可多选）"
                  multiple
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  style="width: 100%"
                >
                  <el-option
                    v-for="month in monthOptions"
                    :key="month.value"
                    :label="month.label"
                    :value="month.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">计划技术上线时间</label>
                <el-select
                  v-model="searchForm.planned_tech_months"
                  placeholder="选择月份（可多选）"
                  multiple
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  style="width: 100%"
                >
                  <el-option
                    v-for="month in monthOptions"
                    :key="month.value"
                    :label="month.label"
                    :value="month.value"
                  />
                </el-select>
              </div>

              <div class="filter-item">
                <label class="filter-label">计划业务上线时间</label>
                <el-select
                  v-model="searchForm.planned_biz_months"
                  placeholder="选择月份（可多选）"
                  multiple
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  style="width: 100%"
                >
                  <el-option
                    v-for="month in monthOptions"
                    :key="month.value"
                    :label="month.label"
                    :value="month.value"
                  />
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading">
        <el-skeleton :rows="10" animated />
      </div>

      <template v-else>
        <!-- Scroll Hint -->
        <div v-if="applications.length > 0" class="scroll-hint">
          <el-icon><el-icon-d-arrow-left /></el-icon>
          <span>横向滚动查看更多列</span>
          <el-icon><el-icon-d-arrow-right /></el-icon>
        </div>

        <!-- Applications Data Table -->
        <ApplicationsTable
          :applications="applications"
          :table-max-height="tableMaxHeight"
          :has-date-adjustment="hasDateAdjustment"
          :get-delay-count="getDelayCount"
          @selection-change="handleSelectionChange"
          @toggle-favorite="toggleFavorite"
          @show-detail="showAppDetail"
          @view-subtasks="viewSubTasks"
          @show-delay-details="showDelayDetails"
          @edit="editApplication"
        />

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
      </template>
      </div>
      <!-- End Applications Content -->

      <!-- SubTasks Content -->
      <div v-show="mainTab === 'subtasks'" class="content-container">
        <!-- SubTask Filter Section -->
        <div class="filter-section">
          <!-- View Type Tabs for SubTasks -->
          <el-tabs v-model="subtaskViewType" @tab-change="handleSubtaskViewTypeChange" class="view-tabs">
            <el-tab-pane name="favorites">
              <template #label>
                <span class="tab-with-icon">
                  <el-icon><star-filled /></el-icon>
                  我关注的
                  <el-badge v-if="favoriteSubTasks.length > 0" :value="favoriteSubTasks.length" class="tab-badge" />
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="全部子任务" name="all"></el-tab-pane>
            <el-tab-pane name="currentMonth">
              <template #label>
                <span>{{ subtaskCurrentMonthLabel }}</span>
              </template>
            </el-tab-pane>
            <el-tab-pane name="nextMonth">
              <template #label>
                <span>{{ subtaskNextMonthLabel }}</span>
              </template>
            </el-tab-pane>
          </el-tabs>

          <!-- Monthly Plan Summary for SubTasks -->
          <div v-if="subtaskViewType !== 'all' && subtaskViewType !== 'favorites'" class="monthly-plan-summary">
            <el-alert :type="subtaskMonthlyPlanAlert.type" :closable="false">
              <template #title>
                <div class="summary-header">
                  <span>{{ subtaskMonthlyPlanAlert.title }}</span>
                  <el-button size="small" type="primary" @click="exportSubTaskMonthlyPlan">
                    <el-icon><download /></el-icon>
                    导出月度计划
                  </el-button>
                </div>
              </template>
              <div class="plan-statistics">
                <span class="stat-item">需求完成: <strong>{{ subtaskMonthlyStatistics.requirement }}</strong> 个</span>
                <span class="stat-item">发版: <strong>{{ subtaskMonthlyStatistics.release }}</strong> 个</span>
                <span class="stat-item">技术上线: <strong>{{ subtaskMonthlyStatistics.tech }}</strong> 个</span>
                <span class="stat-item">业务上线: <strong>{{ subtaskMonthlyStatistics.biz }}</strong> 个</span>
              </div>
            </el-alert>
          </div>

          <div class="filter-content">
            <!-- Main Filters Row -->
            <div class="main-filters">
              <el-input
                v-model="subtaskSearchForm.keyword"
                placeholder="搜索 L2 ID 或应用名称..."
                clearable
                class="search-input"
              >
                <template #prefix>
                  <el-icon><el-icon-search /></el-icon>
                </template>
              </el-input>

              <el-select
                v-model="subtaskSearchForm.version_name"
                placeholder="版本名称"
                clearable
                filterable
                class="filter-select"
                style="width: 200px"
              >
                <el-option
                  v-for="version in subtaskVersionOptions"
                  :key="version.value"
                  :label="version.label"
                  :value="version.value"
                />
              </el-select>

              <el-select
                v-model="subtaskSearchForm.sub_target"
                placeholder="改造目标"
                clearable
                class="filter-select"
              >
                <el-option value="AK" label="AK" />
                <el-option value="云原生" label="云原生" />
              </el-select>

              <el-button
                @click="showAdvancedFilters = !showAdvancedFilters"
                class="toggle-filters-btn"
              >
                <el-icon><el-icon-filter /></el-icon>
                {{ showAdvancedFilters ? '收起筛选' : '更多筛选' }}
              </el-button>

              <el-button @click="resetSubtaskSearch" class="reset-btn">
                重置
              </el-button>
            </div>

            <!-- Advanced Filters -->
            <div v-if="showAdvancedFilters" class="advanced-filters">
              <div class="filter-grid">
                <div class="filter-item">
                  <label class="filter-label">开发负责人</label>
                  <el-select
                    v-model="subtaskSearchForm.dev_owner"
                    placeholder="全部"
                    clearable
                    filterable
                  >
                    <el-option
                      v-for="item in subtaskDevOwnerOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <div class="filter-item">
                  <label class="filter-label">运维负责人</label>
                  <el-select
                    v-model="subtaskSearchForm.ops_owner"
                    placeholder="全部"
                    clearable
                    filterable
                  >
                    <el-option
                      v-for="item in subtaskOpsOwnerOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <div class="filter-item">
                  <label class="filter-label">资源申请</label>
                  <el-select
                    v-model="subtaskSearchForm.resource_applied"
                    placeholder="全部"
                    clearable
                  >
                    <el-option :value="true" label="已申请" />
                    <el-option :value="false" label="未申请" />
                  </el-select>
                </div>

                <div class="filter-item">
                  <label class="filter-label">运营需求提交</label>
                  <el-select
                    v-model="subtaskSearchForm.ops_requirement_submitted"
                    placeholder="全部"
                    clearable
                  >
                    <el-option :value="true" label="已提交" />
                    <el-option :value="false" label="未提交" />
                  </el-select>
                </div>

                <div class="filter-item">
                  <label class="filter-label">运营测试</label>
                  <el-select
                    v-model="subtaskSearchForm.ops_testing_status"
                    placeholder="全部"
                    clearable
                  >
                    <el-option value="待测试" label="待测试" />
                    <el-option value="测试中" label="测试中" />
                    <el-option value="已完成" label="已完成" />
                    <el-option value="测试失败" label="测试失败" />
                  </el-select>
                </div>

                <div class="filter-item">
                  <label class="filter-label">上线检查</label>
                  <el-select
                    v-model="subtaskSearchForm.launch_check_status"
                    placeholder="全部"
                    clearable
                  >
                    <el-option value="待检查" label="待检查" />
                    <el-option value="检查中" label="检查中" />
                    <el-option value="已通过" label="已通过" />
                    <el-option value="未通过" label="未通过" />
                  </el-select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="subtaskLoading">
          <el-skeleton :rows="10" animated />
        </div>

        <template v-else>
        <!-- Scroll Hint -->
        <div v-if="paginatedSubTasks.length > 0" class="scroll-hint">
          <el-icon><el-icon-d-arrow-left /></el-icon>
          <span>横向滚动查看更多列</span>
          <el-icon><el-icon-d-arrow-right /></el-icon>
        </div>

        <!-- SubTasks Data Table -->
        <el-table
          :data="paginatedSubTasks"
          style="width: 100%"
          :max-height="tableMaxHeight"
          @selection-change="handleSubTaskSelectionChange"
        >
          <el-table-column type="selection" width="50" />

          <!-- 关注 -->
          <el-table-column label="关注" width="60" align="center" fixed="left">
            <template #default="{ row }">
              <el-icon
                class="favorite-icon"
                :class="{ 'is-favorite': row.is_favorite }"
                @click.stop="toggleSubTaskFavorite(row)"
              >
                <star-filled v-if="row.is_favorite" />
                <star v-else />
              </el-icon>
            </template>
          </el-table-column>

          <!-- 所属应用 -->
          <el-table-column prop="l2_id" label="所属应用" width="200" fixed="left">
            <template #default="{ row }">
              <div>
                <div style="font-size: 12px; color: #718096; margin-bottom: 4px;">{{ getApplicationL2IdDisplay(row.l2_id) }}</div>
                <el-link type="primary" @click="showSubTaskDetail(row)" :underline="false" class="app-name-link">
                  {{ getApplicationNameByL2Id(row.l2_id) }}
                </el-link>
              </div>
            </template>
          </el-table-column>

          <!-- 版本名称 -->
          <el-table-column prop="version_name" label="版本名称" width="150">
            <template #default="{ row }">
              <strong>{{ row.version_name || '-' }}</strong>
            </template>
          </el-table-column>

          <!-- 改造目标 -->
          <el-table-column prop="sub_target" label="改造目标" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.sub_target === 'AK' ? 'primary' : 'success'">
                {{ row.sub_target || 'AK' }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 进度状态 -->
          <el-table-column prop="task_status" label="当前状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getSubTaskStatusType(row.task_status)" size="small">
                {{ row.task_status || '待启动' }}
              </el-tag>
              <div v-if="row.is_blocked" class="block-warning">⚠️ 阻塞中</div>
            </template>
          </el-table-column>

          <!-- 需求阶段 -->
          <el-table-column label="需求阶段" align="center">
            <el-table-column label="计划" width="105" align="center">
              <template #default="{ row }">
                <div class="date-cell planned">
                  {{ formatYearMonth(row.planned_requirement_date) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="实际" width="105" align="center">
              <template #default="{ row }">
                <div class="date-cell" :class="getDateComparisonClass(row.planned_requirement_date, row.actual_requirement_date)">
                  {{ formatYearMonth(row.actual_requirement_date) }}
                </div>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 发版阶段 -->
          <el-table-column label="发版阶段" align="center">
            <el-table-column label="计划" width="105" align="center">
              <template #default="{ row }">
                <div class="date-cell planned">
                  {{ formatYearMonth(row.planned_release_date) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="实际" width="105" align="center">
              <template #default="{ row }">
                <div class="date-cell" :class="getDateComparisonClass(row.planned_release_date, row.actual_release_date)">
                  {{ formatYearMonth(row.actual_release_date) }}
                </div>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 技术上线阶段 -->
          <el-table-column label="技术上线" align="center">
            <el-table-column label="计划" width="105" align="center">
              <template #default="{ row }">
                <div class="date-cell planned">
                  {{ formatYearMonth(row.planned_tech_online_date) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="实际" width="105" align="center">
              <template #default="{ row }">
                <div class="date-cell" :class="getDateComparisonClass(row.planned_tech_online_date, row.actual_tech_online_date)">
                  {{ formatYearMonth(row.actual_tech_online_date) }}
                </div>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 业务上线阶段 -->
          <el-table-column label="业务上线" align="center">
            <el-table-column label="计划" width="105" align="center">
              <template #default="{ row }">
                <div class="date-cell planned">
                  <strong style="color: #667eea;">{{ formatYearMonth(row.planned_biz_online_date) }}</strong>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="实际" width="120" align="center">
              <template #default="{ row }">
                <div class="date-cell" :class="getDateComparisonClass(row.planned_biz_online_date, row.actual_biz_online_date)">
                  <strong v-if="row.actual_biz_online_date">{{ formatYearMonth(row.actual_biz_online_date) }}</strong>
                  <span v-else>-</span>
                </div>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 延期状态 -->
          <el-table-column label="延期状态" width="150" align="center">
            <template #default="{ row }">
              <div v-if="getSubTaskDelayInfo(row).hasDelay" class="delay-button-wrapper">
                <el-button
                  size="small"
                  :type="getSubTaskDelayInfo(row).severity"
                  @click="showSubTaskDelayDetails(row)"
                  class="delay-status-button"
                  plain
                  round
                >
                  <el-icon class="delay-icon"><el-icon-warning /></el-icon>
                  <span class="delay-text">{{ getSubTaskDelayInfo(row).text }}</span>
                  <el-icon class="arrow-icon"><el-icon-arrow-right /></el-icon>
                </el-button>
              </div>
              <el-tag v-else type="success" size="small" effect="plain">
                <el-icon class="status-icon"><el-icon-circle-check /></el-icon>
                <span>正常</span>
              </el-tag>
            </template>
          </el-table-column>

          <!-- 操作 -->
          <el-table-column label="操作" width="80" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" @click="editSubTask(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- SubTask Pagination -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="subtaskCurrentPage"
            v-model:page-size="subtaskPageSize"
            :page-sizes="[20, 50, 100]"
            :total="filteredSubTasks.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSubTaskSizeChange"
            @current-change="handleSubTaskCurrentChange"
          />
        </div>
        </template>
      </div>
      <!-- End SubTasks Content -->

    </el-card>

    <!-- Create Application Dialog -->
    <ApplicationCreateDialog
      v-model="showCreateDialog"
      :loading="loading"
      @create="handleCreate"
    />

    <!-- Edit Application Dialog -->
    <ApplicationEditDialog
      v-model="showEditDialog"
      :data="editApplicationData"
      :loading="loading"
      @save="handleUpdate"
      @delete="deleteApplicationInEdit"
    />

    <!-- Application Detail Dialog -->
    <ApplicationDetailDialog
      v-model="showDetailDialog"
      :data="detailData"
      :audit-records="auditRecords"
      :audit-loading="auditLoading"
      @rollback="rollbackAudit"
      @load-audit="loadAuditRecords"
    />

    <!-- Delay Details Dialog -->
    <DelayDetailsDialog
      v-model="showDelayDetailsDialog"
      :data="delayDetailsData"
      :loading="delayDetailsLoading"
    />

    <!-- Plan History Dialog -->
    <PlanHistoryDialog
      v-model="showPlanHistoryDialog"
      :data="planHistoryDialogData"
      :loading="planHistoryLoading"
    />

    <!-- SubTask Detail Dialog -->
    <SubTaskDetailDialog
      v-model="showSubTaskDetailDialog"
      :data="subTaskDetailData"
      :all-applications="allApplications"
      @edit="editSubTask"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Plus,
  Upload,
  Download,
  Warning as ElIconWarning,
  Clock as ElIconClock,
  CircleCheck as ElIconCircleCheck,
  ArrowRight as ElIconArrowRight,
  InfoFilled as ElIconInfoFilled,
  StarFilled,
  Star,
  Search as ElIconSearch,
  Filter as ElIconFilter,
  DArrowLeft as ElIconDArrowLeft,
  DArrowRight as ElIconDArrowRight
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApplicationsAPI, type Application, type CreateApplicationRequest } from '@/api/applications'
import { SubTasksAPI, type SubTask } from '@/api/subtasks'
import { ExcelAPI } from '@/api/reports'
import { AuditAPI, type AuditLog } from '@/api/audit'
import { useAuthStore } from '@/stores/auth'
import { useFormatters } from '@/composables/applications/useFormatters'
import { useStatusHelpers } from '@/composables/applications/useStatusHelpers'
import { useDelayCalculations } from '@/composables/applications/useDelayCalculations'
import SubTaskDetailDialog from '@/components/applications/dialogs/SubTaskDetailDialog.vue'
import ApplicationCreateDialog from '@/components/applications/dialogs/ApplicationCreateDialog.vue'
import ApplicationEditDialog from '@/components/applications/dialogs/ApplicationEditDialog.vue'
import ApplicationDetailDialog from '@/components/applications/dialogs/ApplicationDetailDialog.vue'
import DelayDetailsDialog from '@/components/applications/dialogs/DelayDetailsDialog.vue'
import PlanHistoryDialog from '@/components/applications/dialogs/PlanHistoryDialog.vue'
import ApplicationsTable from '@/components/applications/ApplicationsTable.vue'

const router = useRouter()
const route = useRoute()

// 使用 composables
const {
  formatDate,
  formatYearMonth,
  formatShortDate,
  formatFieldValue,
  getFieldLabel,
  getAdjustmentFieldLabel,
  getDelayPhaseLabel
} = useFormatters()

const {
  getStatusType,
  getSubTaskStatusType,
  getProgressColor,
  getSubTaskProgressColor,
  calculateSubTaskProgress,
  getOperationType,
  getOperationText,
  getPhaseStatusClass,
  getPhaseStatusText,
  getStatusTagType,
  getDetailedPhaseText,
  getPhaseColorClass
} = useStatusHelpers()

const {
  calculateDaysDiff,
  calculateMonthsDiff,
  getDelayType,
  getSubTaskDelayInfo,
  getDateComparisonClass,
  getSubTaskWorkingDays,
  calculateTotalDelayDays
} = useDelayCalculations()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDetailDialog = ref(false)
const showPlanHistoryDialog = ref(false)
const showDelayDetailsDialog = ref(false)
const delayDetailsData = ref<any>({})
const delayDetailsLoading = ref(false)
const selectedApplications = ref<Application[]>([])
const editingId = ref<number | null>(null)
const editApplicationData = ref<Partial<Application>>({})
const detailData = ref<Partial<Application>>({})
const activeDetailTab = ref('basic')
const planHistoryData = ref<any[]>([])
const planHistoryLoading = ref(false)

// SubTask detail dialog states
const showSubTaskDetailDialog = ref(false)
const subTaskDetailData = ref<Partial<SubTask>>({})
const activeSubTaskDetailTab = ref('basic')

// Monthly plan view states
const viewType = ref('all') // 'all' | 'favorites' | 'currentMonth' | 'nextMonth'
const currentDate = new Date()
const currentMonth = currentDate.getMonth() + 1
const currentYear = currentDate.getFullYear()
const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear

// Favorites management
const FAVORITES_STORAGE_KEY = 'application_favorites'
const favoriteIds = ref<Set<number>>(new Set())

// SubTask favorites management
const SUBTASK_FAVORITES_STORAGE_KEY = 'subtask_favorites'
const favoriteSubTaskIds = ref<Set<number>>(new Set())

// Advanced filters toggle
const showAdvancedFilters = ref(false)

// Audit related states
const auditRecords = ref<AuditLog[]>([])
const auditLoading = ref(false)
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.hasRole('ADMIN'))

// Plan adjustment tracking states - Initialize here
const planAdjustmentCache = ref<Map<number, any>>(new Map())
const currentPlanAdjustment = ref<any>(null)
const planAdjustmentDetails = ref<any[]>([])

// Computed property for PlanHistoryDialog data
const planHistoryDialogData = computed(() => ({
  planHistory: planHistoryData.value,
  adjustmentDetails: planAdjustmentDetails.value,
  currentPlanAdjustment: currentPlanAdjustment.value
}))

// Tab states
const activeTab = ref('applications')
const mainTab = ref('applications') // 主要分类tab: 'applications' 或 'subtasks'

// Data states
const allApplications = ref<Application[]>([]) // 存储所有原始数据
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// SubTask states
const allSubTasks = ref<SubTask[]>([]) // 存储所有子任务数据
const subtaskLoading = ref(false)
const subtaskCurrentPage = ref(1)
const subtaskPageSize = ref(20)
const selectedSubTasks = ref<SubTask[]>([])

const searchForm = reactive({
  keyword: '',
  target: undefined as string | undefined,  // 改造目标
  progress_status: undefined as string | undefined,  // 改造进度（整体状态）
  acceptance_year: undefined as number | undefined,  // 监管验收年份

  // 高级筛选字段 - 第一组
  belonging_l1: undefined as string | undefined,  // 所属L1
  app_tier: undefined as number | undefined,  // 档位
  belonging_project: undefined as string | undefined,  // 所属项目
  dev_mode: undefined as string | undefined,  // 开发模式
  ops_mode: undefined as string | undefined,  // 运维模式
  dev_owner: undefined as string | undefined,  // 开发负责人
  dev_team: undefined as string | undefined,  // 开发团队
  ops_owner: undefined as string | undefined,  // 运维负责人
  ops_team: undefined as string | undefined,  // 运维团队
  belonging_kpi: undefined as string | undefined,  // 所属KPI指标
  domain_completed: undefined as boolean | undefined,  // 域名化DBPM
  dbpm_completed: undefined as boolean | undefined,  // DBPM
  acceptance_status: undefined as string | undefined,  // 验收状态

  // 高级筛选字段 - 第二组（时间筛选 - 支持多选）
  planned_req_months: [] as string[],  // 计划需求时间（月份，可多选）
  planned_release_months: [] as string[],  // 计划发版时间（月份，可多选）
  planned_tech_months: [] as string[],  // 计划技术上线时间（月份，可多选）
  planned_biz_months: [] as string[],  // 计划业务上线时间（月份，可多选）

  // 旧字段保留用于兼容
  status: undefined as string | undefined,
  department: undefined as string | undefined,
  ak_status: '' as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | '',
  cloud_native_status: '' as 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | '',
  is_delayed: undefined as boolean | undefined
})

// SubTask view type
const subtaskViewType = ref('all') // 'all' | 'notStarted' | 'inProgress' | 'completed' | 'blocked'

// SubTask search form
const subtaskSearchForm = reactive({
  keyword: '',
  status: undefined as string | undefined,
  version_name: undefined as string | undefined,
  sub_target: undefined as string | undefined,
  dev_owner: undefined as string | undefined,
  ops_owner: undefined as string | undefined,
  resource_applied: undefined as boolean | undefined,
  ops_requirement_submitted: undefined as boolean | undefined,
  ops_testing_status: undefined as string | undefined,
  launch_check_status: undefined as string | undefined
})

// SubTask filter options
const subtaskVersionOptions = ref<Array<{ label: string; value: string }>>([])
const subtaskDevOwnerOptions = ref<Array<{ label: string; value: string }>>([])
const subtaskOpsOwnerOptions = ref<Array<{ label: string; value: string }>>([])

// 用于防抖的关键词
const debouncedKeyword = ref('')

// 动态下拉选项 - 基于实际数据生成
const statusOptions = ref<Array<{ label: string; value: string }>>([])
const departmentOptions = ref<Array<{ label: string; value: string }>>([])
const targetOptions = ref<Array<{ label: string; value: string }>>([])
const l1Options = ref<Array<{ label: string; value: string }>>([])
const projectOptions = ref<Array<{ label: string; value: string }>>([])
const devModeOptions = ref<Array<{ label: string; value: string }>>([])
const opsModeOptions = ref<Array<{ label: string; value: string }>>([])
const devOwnerOptions = ref<Array<{ label: string; value: string }>>([])
const devTeamOptions = ref<Array<{ label: string; value: string }>>([])
const opsOwnerOptions = ref<Array<{ label: string; value: string }>>([])
const opsTeamOptions = ref<Array<{ label: string; value: string }>>([])
const kpiOptions = ref<Array<{ label: string; value: string }>>([])

// 月份选项 - 生成最近24个月的选项
const monthOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = []
  const now = new Date()

  // 生成过去12个月到未来12个月的选项
  for (let i = -12; i <= 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const value = `${year}-${String(month).padStart(2, '0')}`
    const label = `${year}年${String(month).padStart(2, '0')}月`
    options.push({ label, value })
  }

  return options
})


// Monthly plan labels
const currentMonthLabel = computed(() => {
  return `计划到期列表-${currentYear}年${String(currentMonth).padStart(2, '0')}月（本月）`
})

const nextMonthLabel = computed(() => {
  return `计划到期列表-${nextMonthYear}年${String(nextMonth).padStart(2, '0')}月（下个月）`
})

// Monthly plan alert info
const monthlyPlanAlert = computed(() => {
  if (viewType.value === 'currentMonth') {
    return {
      type: 'warning',
      title: `${currentYear}年${currentMonth}月应上线应用清单`
    }
  } else if (viewType.value === 'nextMonth') {
    return {
      type: 'info',
      title: `${nextMonthYear}年${nextMonth}月应上线应用清单`
    }
  }
  return { type: 'info', title: '' }
})

// Filter applications by month
const filterApplicationsByMonth = (apps: Application[], targetYear: number, targetMonth: number) => {
  return apps.filter(app => {
    // Check all planned dates for the target month
    const dates = [
      app.planned_requirement_date,
      app.planned_release_date,
      app.planned_tech_online_date,
      app.planned_biz_online_date
    ]

    return dates.some(dateStr => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    })
  })
}

// Favorite applications
const favoriteApplications = computed(() => {
  return allApplications.value.filter(app => favoriteIds.value.has(app.id))
})

// Favorite subtasks
const favoriteSubTasks = computed(() => {
  return allSubTasks.value.filter(task => favoriteSubTaskIds.value.has(task.id))
})

// SubTask monthly plan labels
const subtaskCurrentMonthLabel = computed(() => {
  return `计划到期子任务-${currentYear}年${String(currentMonth).padStart(2, '0')}月（本月）`
})

const subtaskNextMonthLabel = computed(() => {
  return `计划到期子任务-${nextMonthYear}年${String(nextMonth).padStart(2, '0')}月（下个月）`
})

// SubTask monthly plan alert info
const subtaskMonthlyPlanAlert = computed(() => {
  if (subtaskViewType.value === 'currentMonth') {
    return {
      type: 'warning',
      title: `${currentYear}年${currentMonth}月应上线子任务清单`
    }
  } else if (subtaskViewType.value === 'nextMonth') {
    return {
      type: 'info',
      title: `${nextMonthYear}年${nextMonth}月应上线子任务清单`
    }
  }
  return { type: 'info', title: '' }
})

// Filter subtasks by month
const filterSubTasksByMonth = (tasks: SubTask[], targetYear: number, targetMonth: number) => {
  return tasks.filter(task => {
    // Check all planned dates for the target month
    const dates = [
      task.planned_requirement_date,
      task.planned_release_date,
      task.planned_tech_online_date,
      task.planned_biz_online_date
    ]

    return dates.some(dateStr => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    })
  })
}

// SubTask monthly statistics
const subtaskMonthlyStatistics = computed(() => {
  let tasks: SubTask[] = []

  if (subtaskViewType.value === 'currentMonth') {
    tasks = filterSubTasksByMonth(allSubTasks.value, currentYear, currentMonth)
  } else if (subtaskViewType.value === 'nextMonth') {
    tasks = filterSubTasksByMonth(allSubTasks.value, nextMonthYear, nextMonth)
  }

  const targetYear = subtaskViewType.value === 'currentMonth' ? currentYear : nextMonthYear
  const targetMonth = subtaskViewType.value === 'currentMonth' ? currentMonth : nextMonth

  return {
    requirement: tasks.filter(task => {
      if (!task.planned_requirement_date) return false
      const date = new Date(task.planned_requirement_date)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    }).length,
    release: tasks.filter(task => {
      if (!task.planned_release_date) return false
      const date = new Date(task.planned_release_date)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    }).length,
    tech: tasks.filter(task => {
      if (!task.planned_tech_online_date) return false
      const date = new Date(task.planned_tech_online_date)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    }).length,
    biz: tasks.filter(task => {
      if (!task.planned_biz_online_date) return false
      const date = new Date(task.planned_biz_online_date)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    }).length
  }
})

// Monthly statistics
const monthlyStatistics = computed(() => {
  let apps: Application[] = []
  
  if (viewType.value === 'currentMonth') {
    apps = filterApplicationsByMonth(allApplications.value, currentYear, currentMonth)
  } else if (viewType.value === 'nextMonth') {
    apps = filterApplicationsByMonth(allApplications.value, nextMonthYear, nextMonth)
  }
  
  const targetYear = viewType.value === 'currentMonth' ? currentYear : nextMonthYear
  const targetMonth = viewType.value === 'currentMonth' ? currentMonth : nextMonth
  
  return {
    requirement: apps.filter(app => {
      if (!app.planned_requirement_date) return false
      const date = new Date(app.planned_requirement_date)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    }).length,
    release: apps.filter(app => {
      if (!app.planned_release_date) return false
      const date = new Date(app.planned_release_date)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    }).length,
    tech: apps.filter(app => {
      if (!app.planned_tech_online_date) return false
      const date = new Date(app.planned_tech_online_date)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    }).length,
    biz: apps.filter(app => {
      if (!app.planned_biz_online_date) return false
      const date = new Date(app.planned_biz_online_date)
      return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
    }).length
  }
})

// 前端筛选后的数据
const filteredApplications = computed(() => {
  let result = [...allApplications.value]

  // Apply favorites filter if viewing favorites
  if (viewType.value === 'favorites') {
    result = result.filter(app => favoriteIds.value.has(app.id))
  }
  // Apply monthly filter if viewing monthly plans
  else if (viewType.value === 'currentMonth') {
    result = filterApplicationsByMonth(result, currentYear, currentMonth)
  } else if (viewType.value === 'nextMonth') {
    result = filterApplicationsByMonth(result, nextMonthYear, nextMonth)
  }

  // 关键词搜索（使用防抖后的值）
  if (debouncedKeyword.value) {
    const keyword = debouncedKeyword.value.toLowerCase()
    result = result.filter(app => {
      const id = app.l2_id || ''
      const name = app.app_name || ''
      return id.toLowerCase().includes(keyword) || name.toLowerCase().includes(keyword)
    })
  }

  // 改造目标筛选
  if (searchForm.target) {
    result = result.filter(app => app.overall_transformation_target === searchForm.target)
  }

  // 改造进度筛选（整体状态）
  if (searchForm.progress_status) {
    result = result.filter(app => app.current_status === searchForm.progress_status)
  }

  // 监管验收年份筛选
  if (searchForm.acceptance_year) {
    result = result.filter(app => app.ak_supervision_acceptance_year === searchForm.acceptance_year)
  }

  // === Group 1 Advanced Filters ===

  // 所属L1筛选
  if (searchForm.belonging_l1) {
    result = result.filter(app => app.belonging_l1_name === searchForm.belonging_l1)
  }

  // 档位筛选
  if (searchForm.app_tier) {
    result = result.filter(app => app.app_tier === searchForm.app_tier)
  }

  // 所属项目筛选
  if (searchForm.belonging_project) {
    result = result.filter(app => app.belonging_projects === searchForm.belonging_project)
  }

  // 开发模式筛选
  if (searchForm.dev_mode) {
    result = result.filter(app => app.dev_mode === searchForm.dev_mode)
  }

  // 运维模式筛选
  if (searchForm.ops_mode) {
    result = result.filter(app => app.ops_mode === searchForm.ops_mode)
  }

  // 开发负责人筛选
  if (searchForm.dev_owner) {
    result = result.filter(app => app.dev_owner === searchForm.dev_owner)
  }

  // 开发团队筛选
  if (searchForm.dev_team) {
    result = result.filter(app => app.dev_team === searchForm.dev_team)
  }

  // 运维负责人筛选
  if (searchForm.ops_owner) {
    result = result.filter(app => app.ops_owner === searchForm.ops_owner)
  }

  // 运维团队筛选
  if (searchForm.ops_team) {
    result = result.filter(app => app.ops_team === searchForm.ops_team)
  }

  // 所属KPI指标筛选
  if (searchForm.belonging_kpi) {
    result = result.filter(app => app.belonging_kpi === searchForm.belonging_kpi)
  }

  // 域名化改造完成筛选
  if (searchForm.domain_completed !== undefined) {
    result = result.filter(app => app.is_domain_transformation_completed === searchForm.domain_completed)
  }

  // DBPM改造完成筛选
  if (searchForm.dbpm_completed !== undefined) {
    result = result.filter(app => app.is_dbpm_transformation_completed === searchForm.dbpm_completed)
  }

  // 验收状态筛选
  if (searchForm.acceptance_status) {
    result = result.filter(app => app.acceptance_status === searchForm.acceptance_status)
  }

  // === Group 2 Time Filters (支持多选) ===

  // 计划需求时间（月份，可多选）
  if (searchForm.planned_req_months && searchForm.planned_req_months.length > 0) {
    result = result.filter(app => {
      if (!app.planned_requirement_date) return false
      const appMonth = app.planned_requirement_date.substring(0, 7) // YYYY-MM
      return searchForm.planned_req_months.includes(appMonth)
    })
  }

  // 计划发版时间（月份，可多选）
  if (searchForm.planned_release_months && searchForm.planned_release_months.length > 0) {
    result = result.filter(app => {
      if (!app.planned_release_date) return false
      const appMonth = app.planned_release_date.substring(0, 7) // YYYY-MM
      return searchForm.planned_release_months.includes(appMonth)
    })
  }

  // 计划技术上线时间（月份，可多选）
  if (searchForm.planned_tech_months && searchForm.planned_tech_months.length > 0) {
    result = result.filter(app => {
      if (!app.planned_tech_online_date) return false
      const appMonth = app.planned_tech_online_date.substring(0, 7) // YYYY-MM
      return searchForm.planned_tech_months.includes(appMonth)
    })
  }

  // 计划业务上线时间（月份，可多选）
  if (searchForm.planned_biz_months && searchForm.planned_biz_months.length > 0) {
    result = result.filter(app => {
      if (!app.planned_biz_online_date) return false
      const appMonth = app.planned_biz_online_date.substring(0, 7) // YYYY-MM
      return searchForm.planned_biz_months.includes(appMonth)
    })
  }

  // === Backward Compatibility Filters ===

  // 状态筛选（旧字段）
  if (searchForm.status) {
    result = result.filter(app => app.current_status === searchForm.status)
  }

  // 部门筛选（旧字段）
  if (searchForm.department) {
    result = result.filter(app => (app.dev_team === searchForm.department) || (app.ops_team === searchForm.department))
  }

  // AK改造状态筛选
  if (searchForm.ak_status) {
    result = result.filter(app => app.ak_status === searchForm.ak_status)
  }

  // 云原生改造状态筛选
  if (searchForm.cloud_native_status) {
    result = result.filter(app => app.cloud_native_status === searchForm.cloud_native_status)
  }

  // 延期状态筛选
  if (searchForm.is_delayed !== undefined) {
    result = result.filter(app => app.is_delayed === searchForm.is_delayed)
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

// Table max height - 让水平滚动条始终在可视区域内
const tableMaxHeight = computed(() => {
  // 使用视口高度的 60% 作为表格最大高度
  // 这样可以确保水平滚动条始终可见，不需要滚动到页面底部
  return window.innerHeight * 0.6
})

// SubTask 相关计算属性
const filteredSubTasks = computed(() => {
  let result = [...allSubTasks.value]

  // Apply favorites filter if viewing favorites
  if (subtaskViewType.value === 'favorites') {
    result = result.filter(task => favoriteSubTaskIds.value.has(task.id))
  }
  // Apply monthly filter if viewing monthly plans
  else if (subtaskViewType.value === 'currentMonth') {
    result = filterSubTasksByMonth(result, currentYear, currentMonth)
  } else if (subtaskViewType.value === 'nextMonth') {
    result = filterSubTasksByMonth(result, nextMonthYear, nextMonth)
  }

  // 关键词搜索 - 搜索 L2 ID 或应用名称
  if (subtaskSearchForm.keyword) {
    const keyword = subtaskSearchForm.keyword.toLowerCase()
    result = result.filter(task => {
      const l2Id = String(task.l2_id || '').toLowerCase()
      const appName = getApplicationNameByL2Id(task.l2_id).toLowerCase()
      return l2Id.includes(keyword) || appName.includes(keyword)
    })
  }

  // 版本名称筛选
  if (subtaskSearchForm.version_name) {
    result = result.filter(task => task.version_name === subtaskSearchForm.version_name)
  }

  // 改造目标筛选
  if (subtaskSearchForm.sub_target) {
    result = result.filter(task => task.sub_target === subtaskSearchForm.sub_target)
  }

  // 开发负责人筛选
  if (subtaskSearchForm.dev_owner) {
    result = result.filter(task => task.dev_owner === subtaskSearchForm.dev_owner)
  }

  // 运维负责人筛选
  if (subtaskSearchForm.ops_owner) {
    result = result.filter(task => task.ops_owner === subtaskSearchForm.ops_owner)
  }

  // 状态筛选（保留旧字段兼容性）
  if (subtaskSearchForm.status) {
    result = result.filter(task => task.task_status === subtaskSearchForm.status)
  }

  // 资源是否申请筛选
  if (subtaskSearchForm.resource_applied !== undefined) {
    result = result.filter(task => task.resource_applied === subtaskSearchForm.resource_applied)
  }

  // 运营需求提交筛选
  if (subtaskSearchForm.ops_requirement_submitted !== undefined) {
    result = result.filter(task => {
      const hasSubmitted = task.ops_requirement_submitted !== null && task.ops_requirement_submitted !== undefined
      return hasSubmitted === subtaskSearchForm.ops_requirement_submitted
    })
  }

  // 运营测试状态筛选
  if (subtaskSearchForm.ops_testing_status) {
    result = result.filter(task => task.ops_testing_status === subtaskSearchForm.ops_testing_status)
  }

  // 上线检查状态筛选
  if (subtaskSearchForm.launch_check_status) {
    result = result.filter(task => task.launch_check_status === subtaskSearchForm.launch_check_status)
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

    // Sync is_favorite field with localStorage
    syncFavoritesWithApplications()

    // 生成动态筛选选项
    updateFilterOptions()
  } catch (error) {
    console.error('Failed to load applications:', error)
    ElMessage.error('加载应用列表失败，请检查网络连接')
    allApplications.value = []
  } finally {
    loading.value = false
  }
}

// Load all subtasks from all applications
const loadAllSubTasks = async () => {
  try {
    subtaskLoading.value = true
    // Fetch all subtasks with maximum allowed limit
    const response = await SubTasksAPI.getSubTasks({
      skip: 0,
      limit: 1000 // Get first 1000 subtasks (API maximum)
    })
    allSubTasks.value = response.items || []

    // Sync is_favorite field with localStorage
    syncFavoritesWithSubTasks()

    // Update subtask filter options
    updateSubtaskFilterOptions()
  } catch (error) {
    console.error('Failed to load subtasks:', error)
    ElMessage.error('加载子任务列表失败，请检查网络连接')
    allSubTasks.value = []
  } finally {
    subtaskLoading.value = false
  }
}

// Update subtask filter options from loaded data
const updateSubtaskFilterOptions = () => {
  const versionSet = new Set<string>()
  const devOwnerSet = new Set<string>()
  const opsOwnerSet = new Set<string>()

  allSubTasks.value.forEach(task => {
    if (task.version_name) versionSet.add(task.version_name)
    if (task.dev_owner) devOwnerSet.add(task.dev_owner)
    if (task.ops_owner) opsOwnerSet.add(task.ops_owner)
  })

  subtaskVersionOptions.value = Array.from(versionSet)
    .sort()
    .map(version => ({ label: version, value: version }))

  subtaskDevOwnerOptions.value = Array.from(devOwnerSet)
    .sort()
    .map(owner => ({ label: owner, value: owner }))

  subtaskOpsOwnerOptions.value = Array.from(opsOwnerSet)
    .sort()
    .map(owner => ({ label: owner, value: owner }))
}

// Load favorites from localStorage
const loadFavoritesFromStorage = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (stored) {
      const ids = JSON.parse(stored) as number[]
      favoriteIds.value = new Set(ids)
    }
  } catch (error) {
    console.error('Failed to load favorites from localStorage:', error)
    favoriteIds.value = new Set()
  }
}

// Save favorites to localStorage
const saveFavoritesToStorage = () => {
  try {
    const ids = Array.from(favoriteIds.value)
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids))
  } catch (error) {
    console.error('Failed to save favorites to localStorage:', error)
  }
}

// Sync is_favorite field with favoriteIds
const syncFavoritesWithApplications = () => {
  allApplications.value.forEach(app => {
    app.is_favorite = favoriteIds.value.has(app.id)
  })
}

// Toggle favorite status
const toggleFavorite = (app: Application) => {
  if (favoriteIds.value.has(app.id)) {
    favoriteIds.value.delete(app.id)
    app.is_favorite = false
    ElMessage.success('已取消关注')
  } else {
    favoriteIds.value.add(app.id)
    app.is_favorite = true
    ElMessage.success('已添加到关注')
  }

  // Save to localStorage
  saveFavoritesToStorage()
}

// Load subtask favorites from localStorage
const loadSubTaskFavoritesFromStorage = () => {
  try {
    const stored = localStorage.getItem(SUBTASK_FAVORITES_STORAGE_KEY)
    if (stored) {
      const ids = JSON.parse(stored) as number[]
      favoriteSubTaskIds.value = new Set(ids)
    }
  } catch (error) {
    console.error('Failed to load subtask favorites from localStorage:', error)
    favoriteSubTaskIds.value = new Set()
  }
}

// Save subtask favorites to localStorage
const saveSubTaskFavoritesToStorage = () => {
  try {
    const ids = Array.from(favoriteSubTaskIds.value)
    localStorage.setItem(SUBTASK_FAVORITES_STORAGE_KEY, JSON.stringify(ids))
  } catch (error) {
    console.error('Failed to save subtask favorites to localStorage:', error)
  }
}

// Sync is_favorite field with favoriteSubTaskIds
const syncFavoritesWithSubTasks = () => {
  allSubTasks.value.forEach(task => {
    // Note: SubTask might not have is_favorite field, but we set it for consistency
    (task as any).is_favorite = favoriteSubTaskIds.value.has(task.id)
  })
}

// Toggle subtask favorite status
const toggleSubTaskFavorite = (task: SubTask) => {
  if (favoriteSubTaskIds.value.has(task.id)) {
    favoriteSubTaskIds.value.delete(task.id)
    ;(task as any).is_favorite = false
    ElMessage.success('已取消关注')
  } else {
    favoriteSubTaskIds.value.add(task.id)
    ;(task as any).is_favorite = true
    ElMessage.success('已添加到关注')
  }

  // Save to localStorage
  saveSubTaskFavoritesToStorage()
}

// 根据实际数据更新筛选选项
const updateFilterOptions = () => {
  // 提取唯一的状态值
  const statusSet = new Set<string>()
  const departmentSet = new Set<string>()
  const targetSet = new Set<string>()
  const l1Set = new Set<string>()
  const projectSet = new Set<string>()
  const devModeSet = new Set<string>()
  const opsModeSet = new Set<string>()
  const devOwnerSet = new Set<string>()
  const devTeamSet = new Set<string>()
  const opsOwnerSet = new Set<string>()
  const opsTeamSet = new Set<string>()
  const kpiSet = new Set<string>()

  allApplications.value.forEach(app => {
    // 收集状态
    if (app.current_status) {
      statusSet.add(app.current_status)
    }

    // 收集部门（从dev_team和ops_team中提取）
    if (app.dev_team) {
      departmentSet.add(app.dev_team)
    }
    if (app.ops_team && app.ops_team !== app.dev_team) {
      departmentSet.add(app.ops_team)
    }

    // 收集改造目标
    if (app.overall_transformation_target) {
      targetSet.add(app.overall_transformation_target)
    }

    // 收集新增字段
    if (app.belonging_l1_name) l1Set.add(app.belonging_l1_name)
    if (app.belonging_projects) projectSet.add(app.belonging_projects)
    if (app.dev_mode) devModeSet.add(app.dev_mode)
    if (app.ops_mode) opsModeSet.add(app.ops_mode)
    if (app.dev_owner) devOwnerSet.add(app.dev_owner)
    if (app.dev_team) devTeamSet.add(app.dev_team)
    if (app.ops_owner) opsOwnerSet.add(app.ops_owner)
    if (app.ops_team) opsTeamSet.add(app.ops_team)
    if (app.belonging_kpi) kpiSet.add(app.belonging_kpi)
  })

  // 转换为选项数组并排序
  statusOptions.value = Array.from(statusSet)
    .sort()
    .map(status => ({ label: status, value: status }))

  departmentOptions.value = Array.from(departmentSet)
    .sort()
    .map(dept => ({ label: dept, value: dept }))

  targetOptions.value = Array.from(targetSet)
    .sort()
    .map(target => ({ label: target, value: target }))

  l1Options.value = Array.from(l1Set)
    .sort()
    .map(l1 => ({ label: l1, value: l1 }))

  projectOptions.value = Array.from(projectSet)
    .sort()
    .map(project => ({ label: project, value: project }))

  devModeOptions.value = Array.from(devModeSet)
    .sort()
    .map(mode => ({ label: mode, value: mode }))

  opsModeOptions.value = Array.from(opsModeSet)
    .sort()
    .map(mode => ({ label: mode, value: mode }))

  devOwnerOptions.value = Array.from(devOwnerSet)
    .sort()
    .map(owner => ({ label: owner, value: owner }))

  devTeamOptions.value = Array.from(devTeamSet)
    .sort()
    .map(team => ({ label: team, value: team }))

  opsOwnerOptions.value = Array.from(opsOwnerSet)
    .sort()
    .map(owner => ({ label: owner, value: owner }))

  opsTeamOptions.value = Array.from(opsTeamSet)
    .sort()
    .map(team => ({ label: team, value: team }))

  kpiOptions.value = Array.from(kpiSet)
    .sort()
    .map(kpi => ({ label: kpi, value: kpi }))

  // 如果没有数据，提供默认选项
  if (statusOptions.value.length === 0) {
    statusOptions.value = [
      { label: '待启动', value: '待启动' },
      { label: '研发进行中', value: '研发进行中' },
      { label: '业务上线中', value: '业务上线中' },
      { label: '全部完成', value: '全部完成' }
    ]
  }

  if (targetOptions.value.length === 0) {
    targetOptions.value = [
      { label: 'AK', value: 'AK' },
      { label: '云原生', value: '云原生' }
    ]
  }
}

// Backend now calculates all transformation progress and status
// No need for frontend calculation anymore

// No longer need to load subtasks for progress calculation
// Backend returns all calculated statistics

// Initialize data
onMounted(async () => {
  // Load favorites from localStorage first
  loadFavoritesFromStorage()
  loadSubTaskFavoritesFromStorage()

  // 检查URL查询参数，优先级最高
  const searchQuery = route.query.search as string
  if (searchQuery) {
    searchForm.keyword = searchQuery
    debouncedKeyword.value = searchQuery
    // 清除URL参数，避免刷新时重复搜索
    router.replace({ query: {} })
  } else {
    // 只在没有search参数时才恢复保存的页面状态
    const savedState = sessionStorage.getItem('applicationListState')
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        currentPage.value = state.currentPage || 1
        pageSize.value = state.pageSize || 20
        if (state.searchForm) {
          searchForm.keyword = state.searchForm.keyword || ''
          searchForm.status = state.searchForm.status || undefined
          searchForm.department = state.searchForm.department || undefined
          searchForm.target = state.searchForm.target || undefined
          debouncedKeyword.value = state.searchForm.keyword || ''
        }
        // 清除已恢复的状态
        sessionStorage.removeItem('applicationListState')
      } catch (error) {
        console.error('Failed to restore page state:', error)
      }
    }
  }

  await loadApplications()

  // Load delay data after applications are loaded
  if (allApplications.value.length > 0) {
    // Load first batch of delay data for visible applications with delays
    const visibleApps = applications.value.slice(0, 10)
    for (const app of visibleApps) {
      // Only load for apps that are actually delayed
      if (app.is_delayed) {
        loadDelayDataForApp(app)
      }
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
watch([
  // Main filters
  () => searchForm.target,
  () => searchForm.progress_status,
  () => searchForm.acceptance_year,
  // Group 1 advanced filters
  () => searchForm.belonging_l1,
  () => searchForm.app_tier,
  () => searchForm.belonging_project,
  () => searchForm.dev_mode,
  () => searchForm.ops_mode,
  () => searchForm.dev_owner,
  () => searchForm.dev_team,
  () => searchForm.ops_owner,
  () => searchForm.ops_team,
  () => searchForm.belonging_kpi,
  () => searchForm.domain_completed,
  () => searchForm.dbpm_completed,
  () => searchForm.acceptance_status,
  // Group 2 time filters (multi-select)
  () => searchForm.planned_req_months,
  () => searchForm.planned_release_months,
  () => searchForm.planned_tech_months,
  () => searchForm.planned_biz_months,
  // Backward compatibility filters
  () => searchForm.status,
  () => searchForm.department,
  () => searchForm.ak_status,
  () => searchForm.cloud_native_status,
  () => searchForm.is_delayed
], () => {
  currentPage.value = 1
})

// Note: getStatusType, getProgressColor, formatDate, formatYearMonth, and formatShortDate
// are imported from composables and should not be redeclared here

const resetSearch = () => {
  // Reset main filters
  searchForm.keyword = ''
  searchForm.target = undefined
  searchForm.progress_status = undefined
  searchForm.acceptance_year = undefined

  // Reset Group 1 advanced filters
  searchForm.belonging_l1 = undefined
  searchForm.app_tier = undefined
  searchForm.belonging_project = undefined
  searchForm.dev_mode = undefined
  searchForm.ops_mode = undefined
  searchForm.dev_owner = undefined
  searchForm.dev_team = undefined
  searchForm.ops_owner = undefined
  searchForm.ops_team = undefined
  searchForm.belonging_kpi = undefined
  searchForm.domain_completed = undefined
  searchForm.dbpm_completed = undefined
  searchForm.acceptance_status = undefined

  // Reset Group 2 time filters (multi-select)
  searchForm.planned_req_months = []
  searchForm.planned_release_months = []
  searchForm.planned_tech_months = []
  searchForm.planned_biz_months = []

  // Reset backward compatibility filters
  searchForm.status = undefined
  searchForm.department = undefined
  searchForm.ak_status = ''
  searchForm.cloud_native_status = ''
  searchForm.is_delayed = undefined

  debouncedKeyword.value = ''
  currentPage.value = 1
}

const handleSelectionChange = (selection: Application[]) => {
  selectedApplications.value = selection
}

const editApplication = (row: Application) => {
  editingId.value = row.id
  // Set data for edit dialog
  editApplicationData.value = { ...row }
  showEditDialog.value = true
}

const handleUpdate = async (formData: any) => {
  if (!formData.app_name || !editingId.value) {
    ElMessage.error('请填写必填字段')
    return
  }

  try {
    const updatedApp = await ApplicationsAPI.updateApplication(editingId.value, formData)
    ElMessage.success('应用更新成功')
    showEditDialog.value = false

    // 更新本地数据
    const index = allApplications.value.findIndex(app => app.id === editingId.value)
    if (index !== -1) {
      allApplications.value[index] = updatedApp
    }

    // 更新筛选选项
    updateFilterOptions()
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
    
    // 更新筛选选项
    updateFilterOptions()
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
  // 保存当前页面状态到 sessionStorage
  sessionStorage.setItem('applicationListState', JSON.stringify({
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    searchForm: {
      keyword: searchForm.keyword,
      status: searchForm.status,
      department: searchForm.department,
      target: searchForm.target
    }
  }))
  
  router.push(`/subtasks/${row.id}`)
}


const handleCreate = async (formData: CreateApplicationRequest) => {
  if (!formData.l2_id || !formData.app_name) {
    ElMessage.error('请填写必填字段')
    return
  }

  try {
    loading.value = true
    const newApp = await ApplicationsAPI.createApplication(formData)
    ElMessage.success('应用创建成功')
    showCreateDialog.value = false

    // 直接添加到本地数据
    allApplications.value.unshift(newApp)

    // 更新筛选选项
    updateFilterOptions()
  } catch (error) {
    console.error('Failed to create application:', error)
    ElMessage.error('创建应用失败')
  } finally {
    loading.value = false
  }
}

const handleViewTypeChange = (tab: string) => {
  // Reset pagination when changing view type
  currentPage.value = 1
}

// Handle subtask view type change
const handleSubtaskViewTypeChange = (tab: string) => {
  // Reset pagination when changing view type
  subtaskCurrentPage.value = 1
}

// Handle main tab change
const handleMainTabChange = async (tab: string) => {
  // Load subtasks when switching to subtasks tab
  if (tab === 'subtasks' && allSubTasks.value.length === 0) {
    await loadAllSubTasks()
  }
}

// Note: getSubTaskStatusType is imported from useStatusHelpers composable

const exportMonthlyPlan = async () => {
  try {
    // Get filtered applications for the selected month
    let targetApps: Application[] = []
    let fileName = ''
    
    if (viewType.value === 'currentMonth') {
      targetApps = filterApplicationsByMonth(allApplications.value, currentYear, currentMonth)
      fileName = `${currentYear}年${currentMonth}月计划应用清单.xlsx`
    } else if (viewType.value === 'nextMonth') {
      targetApps = filterApplicationsByMonth(allApplications.value, nextMonthYear, nextMonth)
      fileName = `${nextMonthYear}年${nextMonth}月计划应用清单.xlsx`
    }
    
    if (targetApps.length === 0) {
      ElMessage.warning('当前月份没有计划应用')
      return
    }

    const columns = [
      'l2_id',
      'app_name',
      'current_status',
      'planned_requirement_date',
      'planned_release_date',
      'planned_tech_online_date',
      'planned_biz_online_date',
      'dev_team',
      'dev_owner',
      'ops_team',
      'ops_owner',
      'is_delayed',
      'delay_days'
    ]

    // Export specific app IDs
    await ExcelAPI.exportAndDownloadApplications({
      filters: {
        ids: targetApps.map(app => app.id)
      },
      columns,
      filename: fileName
    })

    ElMessage.success(`月度计划导出成功`)
  } catch (error) {
    console.error('Failed to export monthly plan:', error)
    ElMessage.error('导出失败，请稍后重试')
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

// Export subtasks to Excel
const exportSubTasksExcel = async () => {
  try {
    const filters = {
      ...(subtaskSearchForm.status && { status: subtaskSearchForm.status }),
      ...(subtaskSearchForm.version_name && { version_name: subtaskSearchForm.version_name }),
      ...(subtaskSearchForm.resource_applied !== undefined && { resource_applied: subtaskSearchForm.resource_applied }),
      ...(subtaskSearchForm.ops_requirement_submitted !== undefined && { ops_requirement_submitted: subtaskSearchForm.ops_requirement_submitted }),
      ...(subtaskSearchForm.ops_testing_status && { ops_testing_status: subtaskSearchForm.ops_testing_status }),
      ...(subtaskSearchForm.launch_check_status && { launch_check_status: subtaskSearchForm.launch_check_status })
    }

    const columns = [
      'l2_id',
      'version_name',
      'sub_target',
      'dev_owner',
      'ops_owner',
      'task_status',
      'progress_percentage',
      'planned_requirement_date',
      'actual_requirement_date',
      'planned_release_date',
      'actual_release_date',
      'planned_tech_online_date',
      'actual_tech_online_date',
      'planned_biz_online_date',
      'actual_biz_online_date',
      'is_blocked',
      'blocking_reason',
      'resource_applied',
      'ops_requirement_submitted',
      'ops_testing_status',
      'launch_check_status'
    ]

    // Use the ExcelAPI export method for subtasks
    await ExcelAPI.exportAndDownloadSubTasks({
      filters,
      columns
    })

    ElMessage.success(`子任务Excel文件导出成功`)
  } catch (error) {
    console.error('Failed to export subtasks Excel:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// Export monthly subtask plan
const exportSubTaskMonthlyPlan = async () => {
  try {
    // Get filtered subtasks for the selected month
    let targetTasks: SubTask[] = []
    let fileName = ''

    if (subtaskViewType.value === 'currentMonth') {
      targetTasks = filterSubTasksByMonth(allSubTasks.value, currentYear, currentMonth)
      fileName = `${currentYear}年${currentMonth}月计划子任务清单.xlsx`
    } else if (subtaskViewType.value === 'nextMonth') {
      targetTasks = filterSubTasksByMonth(allSubTasks.value, nextMonthYear, nextMonth)
      fileName = `${nextMonthYear}年${nextMonth}月计划子任务清单.xlsx`
    }

    if (targetTasks.length === 0) {
      ElMessage.warning('当前月份没有计划子任务')
      return
    }

    const columns = [
      'l2_id',
      'version_name',
      'sub_target',
      'dev_owner',
      'ops_owner',
      'task_status',
      'planned_requirement_date',
      'planned_release_date',
      'planned_tech_online_date',
      'planned_biz_online_date',
      'resource_applied',
      'ops_requirement_submitted',
      'ops_testing_status',
      'launch_check_status'
    ]

    // Export specific subtask IDs
    await ExcelAPI.exportAndDownloadSubTasks({
      filters: {
        ids: targetTasks.map(task => task.id)
      },
      columns,
      filename: fileName
    })

    ElMessage.success(`月度子任务计划导出成功`)
  } catch (error) {
    console.error('Failed to export monthly subtask plan:', error)
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

// Get application info by L2 ID (string)
const getApplicationNameByL2Id = (l2Id: string | number) => {
  // Convert both to string for comparison to handle type mismatches
  const app = allApplications.value.find(app => String(app.l2_id) === String(l2Id))
  return app ? (app.app_name || app.application_name || '-') : '-'
}

const getApplicationL2IdDisplay = (l2Id: string | number) => {
  // Since l2Id is already the L2 ID, just return it
  return l2Id ? String(l2Id) : '-'
}

// Note: getSubTaskProgressColor, calculateSubTaskProgress, getSubTaskWorkingDays,
// getSubTaskDelayInfo, and getDateComparisonClass are imported from composables

const showSubTaskDelayDetails = (row: SubTask) => {
  const delayInfo = getSubTaskDelayInfo(row)

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

const resetSubtaskSearch = () => {
  subtaskSearchForm.keyword = ''
  subtaskSearchForm.status = undefined
  subtaskSearchForm.version_name = undefined
  subtaskSearchForm.sub_target = undefined
  subtaskSearchForm.dev_owner = undefined
  subtaskSearchForm.ops_owner = undefined
  subtaskSearchForm.resource_applied = undefined
  subtaskSearchForm.ops_requirement_submitted = undefined
  subtaskSearchForm.ops_testing_status = undefined
  subtaskSearchForm.launch_check_status = undefined
  subtaskCurrentPage.value = 1
}

const handleSubTaskSelectionChange = (selection: SubTask[]) => {
  selectedSubTasks.value = selection
}

const editSubTask = (row: SubTask) => {
  router.push(`/subtasks/${row.l2_id}`)
}

// Show subtask detail
const showSubTaskDetail = (row: SubTask) => {
  subTaskDetailData.value = { ...row }
  activeSubTaskDetailTab.value = 'basic'
  showSubTaskDetailDialog.value = true
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

// Note: getOperationType, getOperationText, getFieldLabel, and formatFieldValue
// are imported from composables

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
          const monthsDiff = calculateMonthsDiff(oldDate, newDate)

          details.push({
            adjusted_at: audit.created_at,
            adjusted_by: audit.user_full_name || '系统',
            field: field,
            old_date: oldDate,
            new_date: newDate,
            delay_days: monthsDiff,
            reason: audit.new_values?.adjustment_reason || '未说明'
          })
        }
      }
    })
  })

  return details.sort((a, b) => new Date(b.adjusted_at).getTime() - new Date(a.adjusted_at).getTime())
}

// Note: calculateDaysDiff, calculateMonthsDiff, and getAdjustmentFieldLabel
// are imported from composables

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

// Note: getDelayType, getPhaseStatusClass, getDetailedPhaseText, getPhaseColorClass,
// getPhaseStatusText, getStatusTagType, and getDelayPhaseLabel are imported from composables

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
          delayUnit: '月',
          reason: '当前延期状态',
          operator: '系统',
          type: row.delay_days > 3 ? 'danger' : row.delay_days > 1 ? 'warning' : 'primary'
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
          delayUnit: '月',
          reason: '当前延期状态',
          operator: '系统',
          type: (row.delay_days || 0) > 3 ? 'danger' : (row.delay_days || 0) > 1 ? 'warning' : 'primary'
        }],
        phaseStatistics: [],
        reasonAnalysis: [{ reason: '当前延期状态', count: 1 }],
        currentDelayStatus: `延期${row.delay_days}月`
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

  // Subtask audit records are no longer available in this view
  // Reasons should now come from application audit records
  const subtaskAudits: AuditLog[] = []

  // Filter and process audit records for plan date changes
  audits.forEach(audit => {
    if (!audit.changed_fields) return

    audit.changed_fields.forEach(field => {
      if (planFields.includes(field)) {
        const oldDate = audit.old_values?.[field]
        const newDate = audit.new_values?.[field]

        if (oldDate || newDate) {
          // Handle both date changes and additions
          const actualOldDate = oldDate || null
          const actualNewDate = newDate || null
          
          let delayMonths = 0
          if (actualOldDate && actualNewDate) {
            delayMonths = calculateMonthsDiff(actualOldDate, actualNewDate)
          } else if (actualNewDate && !actualOldDate) {
            // New date added
            delayMonths = 0
          } else if (actualOldDate && !actualNewDate) {
            // Date removed (unusual case)
            const today = new Date()
            const oldDateObj = new Date(actualOldDate)
            const yearDiff = today.getFullYear() - oldDateObj.getFullYear()
            const monthDiff = today.getMonth() - oldDateObj.getMonth()
            delayMonths = yearDiff * 12 + monthDiff
          }

          // Try to find reason from audit notes or related subtask audits
          let reason = audit.new_values?.notes || audit.new_values?.plan_change_reason || audit.new_values?.adjustment_reason
          
          // If no reason in application audit, try to find from subtask audits around the same time
          if (!reason && subtaskAudits.length > 0) {
            const auditTime = new Date(audit.created_at).getTime()
            const relatedSubAudit = subtaskAudits.find(sa => {
              const saTime = new Date(sa.created_at).getTime()
              return Math.abs(saTime - auditTime) < 60000 // Within 1 minute
            })
            if (relatedSubAudit) {
              reason = relatedSubAudit.new_values?.notes || relatedSubAudit.new_values?.plan_change_reason
              if (reason && reason.includes('[计划变更')) {
                // Extract the reason from the formatted note
                const match = reason.match(/\[计划变更[^\]]+\]\s*(.+)/)
                if (match && match[1]) {
                  reason = match[1]
                }
              }
            }
          }
          
          reason = reason || '计划调整'

          delayHistory.push({
            date: audit.created_at,
            phase: field,
            originalDate: actualOldDate,
            newDate: actualNewDate,
            delayDays: Math.abs(delayMonths),
            delayUnit: '月',
            reason: reason,
            operator: audit.user_full_name || '系统',
            type: delayMonths > 3 ? 'danger' : delayMonths > 1 ? 'warning' : 'primary',
            isDelay: delayMonths > 0  // true for delay, false for advance
          })
        }
      }
    })
  })

  // Add current delay status if application is delayed
  if (app.is_delayed && app.delay_days > 0) {
    // Check if we don't already have a recent delay record
    const hasRecentRecord = delayHistory.some(item => {
      const recordDate = new Date(item.date).getTime()
      const now = Date.now()
      return (now - recordDate) < 86400000 // Within last 24 hours
    })
    
    if (!hasRecentRecord) {
      // Find which date is causing the delay
      const today = new Date()
      let delayedField = null
      let delayedDate = null
      
      planFields.forEach(field => {
        const dateValue = (app as any)[field]
        if (dateValue) {
          const date = new Date(dateValue)
          const actualField = field.replace('planned', 'actual')
          const actualValue = (app as any)[actualField]
          if (date < today && !actualValue) {
            if (!delayedDate || date < delayedDate) {
              delayedField = field
              delayedDate = date
            }
          }
        }
      })
      
      if (delayedField && delayedDate) {
        delayHistory.unshift({
          date: new Date().toISOString(),
          phase: delayedField,
          originalDate: delayedDate.toISOString().split('T')[0],
          newDate: null, // No new date yet
          delayDays: app.delay_days,
          delayUnit: '月',
          reason: '当前延期（待更新计划）',
          operator: '系统',
          type: app.delay_days > 3 ? 'danger' : app.delay_days > 1 ? 'warning' : 'primary',
          isDelay: true
        })
      }
    }
  }

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

// Note: calculateTotalDelayDays is imported from composables

// Load delay data when page changes
const handlePageChange = async () => {
  // Load delay data for newly visible applications
  const visibleApps = applications.value
  for (const app of visibleApps) {
    // Only load if not already in cache and app is delayed
    if (!planAdjustmentCache.value.has(app.id) && app.is_delayed) {
      loadDelayDataForApp(app)
    }
  }
}

// Watch page changes but prevent continuous triggering
let pageChangeTimer: ReturnType<typeof setTimeout> | null = null
watch([currentPage, pageSize], () => {
  if (pageChangeTimer) clearTimeout(pageChangeTimer)
  pageChangeTimer = setTimeout(() => {
    handlePageChange()
  }, 100) // Debounce to prevent rapid calls
}, { immediate: false })

// Watch subtask filters to reset pagination
watch([
  () => subtaskSearchForm.keyword,
  () => subtaskSearchForm.status,
  () => subtaskSearchForm.version_name,
  () => subtaskSearchForm.sub_target,
  () => subtaskSearchForm.dev_owner,
  () => subtaskSearchForm.ops_owner,
  () => subtaskSearchForm.resource_applied,
  () => subtaskSearchForm.ops_requirement_submitted,
  () => subtaskSearchForm.ops_testing_status,
  () => subtaskSearchForm.launch_check_status,
  () => subtaskViewType.value
], () => {
  subtaskCurrentPage.value = 1
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

.app-name-link {
  font-weight: 500;
  transition: all 0.3s;
}

.app-name-link:hover {
  color: #667eea !important;
  text-decoration: underline !important;
}

.header h2 {
  margin: 0;
  color: #2d3748;
}

.actions {
  display: flex;
  gap: 10px;
}

/* Content Container - Unified Card Style */
.content-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Filter Section - No Border (inside content container) */
.filter-section {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.filter-content {
  margin-top: 20px;
}

.main-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.search-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  border-radius: 8px;
  transition: all 0.2s;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e0 inset;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #667eea inset;
}

.filter-select {
  width: 160px;
}

.filter-select :deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  border-radius: 8px;
  transition: all 0.2s;
}

.filter-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e0 inset;
}

.filter-select :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 2px #667eea inset;
}

.toggle-filters-btn {
  white-space: nowrap;
  border-color: #e2e8f0;
  color: #374151;
}

.toggle-filters-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.toggle-filters-btn .el-icon {
  margin-right: 6px;
}

.reset-btn {
  white-space: nowrap;
  color: #64748b;
  border-color: transparent;
}

.reset-btn:hover {
  color: #334155;
  background: #f1f5f9;
}

/* Advanced Filters Grid */
.advanced-filters {
  margin-top: 16px;
  padding: 20px;
  background: rgba(248, 250, 252, 0.5);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.filter-item .el-select {
  width: 100%;
}

.filter-item .el-select :deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  border-radius: 8px;
  transition: all 0.2s;
}

.filter-item .el-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e0 inset;
}

.filter-item .el-select :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 2px #667eea inset;
}

/* Time filters - separate row (4 selects in one row) */
.time-filters {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

/* Responsive adjustments for time filters */
@media (max-width: 1200px) {
  .time-filters {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .time-filters {
    grid-template-columns: 1fr;
  }
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
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

/* 横向滚动提示 */
.scroll-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px dashed #7dd3fc;
  border-radius: 8px;
  color: #0369a1;
  font-size: 13px;
  font-weight: 500;
  animation: subtle-pulse 3s ease-in-out infinite;
  cursor: pointer;
  transition: all 0.3s;
}

.scroll-hint:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #38bdf8;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(2, 132, 199, 0.15);
}

.scroll-hint .el-icon {
  font-size: 16px;
  color: #0284c7;
  animation: arrow-bounce 2s ease-in-out infinite;
}

.scroll-hint .el-icon:first-child {
  animation-delay: 0s;
}

.scroll-hint .el-icon:last-child {
  animation-delay: 0.1s;
}

@keyframes subtle-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(0.98);
  }
}

@keyframes arrow-bounce {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

/* 移动端隐藏滚动提示 */
@media (max-width: 768px) {
  .scroll-hint {
    display: none;
  }
}

/* 移动端响应式设计 */
/* 表格样式优化 */
.el-table {
  font-size: 13px;
  position: relative;
}

/* 表格固定高度时的滚动优化 */
.el-table :deep(.el-table__body-wrapper) {
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.el-table :deep(.el-table__body-wrapper)::-webkit-scrollbar {
  height: 12px;
  width: 12px;
}

.el-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 6px;
}

.el-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 6px;
  border: 2px solid #f7fafc;
}

.el-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* 横向滚动提示 */
.el-table::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to left, rgba(247, 250, 252, 0.95), transparent);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 2;
}

.el-table:hover::after {
  opacity: 1;
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

/* Phase badges - compact badge display with custom colors */
.phase-badges {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px;
  font-size: 12px;
}

.phase-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.phase-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.phase-badge:active {
  transform: translateY(-1px);
}

/* Professional color scheme for phase badges */
.phase-badge.status-not_started {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.phase-badge.status-not_started:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #475569;
}

.phase-badge.status-in_progress {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.phase-badge.status-in_progress:hover {
  background: #dbeafe;
  border-color: #60a5fa;
  color: #1e3a8a;
}

.phase-badge.status-completed {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #86efac;
}

.phase-badge.status-completed:hover {
  background: #dcfce7;
  border-color: #4ade80;
  color: #166534;
}

.phase-badge.status-blocked {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fdba74;
}

.phase-badge.status-blocked:hover {
  background: #ffedd5;
  border-color: #fb923c;
  color: #9a3412;
}

.no-tasks {
  color: #909399;
  font-size: 12px;
}

/* Phase-specific color schemes - distinct professional colors for each transformation phase */
.phase-badge.phase-requirement {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #c4b5fd;
}

.phase-badge.phase-requirement:hover {
  background: #ede9fe;
  border-color: #a78bfa;
  color: #5b21b6;
}

.phase-badge.phase-release {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.phase-badge.phase-release:hover {
  background: #dbeafe;
  border-color: #60a5fa;
  color: #1e3a8a;
}

.phase-badge.phase-tech {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fcd34d;
}

.phase-badge.phase-tech:hover {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #92400e;
}

.phase-badge.phase-biz {
  background: #f0fdfa;
  color: #0f766e;
  border: 1px solid #5eead4;
}

.phase-badge.phase-biz:hover {
  background: #ccfbf1;
  border-color: #2dd4bf;
  color: #0d5e54;
}

/* Phase-specific colors for completion states */
.phase-badge.phase-completed {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #86efac;
}

.phase-badge.phase-completed:hover {
  background: #dcfce7;
  border-color: #4ade80;
  color: #166534;
}

.phase-badge.phase-blocked {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.phase-badge.phase-blocked:hover {
  background: #fee2e2;
  border-color: #f87171;
  color: #991b1b;
}

.phase-badge.phase-not-started {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.phase-badge.phase-not-started:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #475569;
}

/* Main Data Type Tabs - Full Width */
.main-data-tabs {
  margin-bottom: 20px;
}

.main-data-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.main-data-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
}

.main-data-tabs :deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
}

.main-data-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  padding: 12px 20px;
  transition: all 0.3s;
}

.main-data-tabs :deep(.el-tabs__item:hover) {
  color: #667eea;
}

.main-data-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
  font-weight: 600;
}

/* Monthly plan view styles */
.monthly-plan-summary {
  margin: 20px 0;
}

.monthly-plan-summary .summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.monthly-plan-summary .plan-statistics {
  display: flex;
  gap: 30px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.monthly-plan-summary .stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #606266;
}

.monthly-plan-summary .stat-item strong {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
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

  .filter-section {
    padding: 16px;
  }

  .main-filters {
    flex-direction: column;
    gap: 10px;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .toggle-filters-btn,
  .reset-btn {
    width: 100%;
  }

  .filter-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 640px) {
  .filter-grid {
    grid-template-columns: 1fr !important;
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

/* Favorite icon styles */
.favorite-icon {
  font-size: 18px;
  cursor: pointer;
  color: #cbd5e0;
  transition: all 0.3s;
}

.favorite-icon:hover {
  color: #fbbf24;
  transform: scale(1.2);
}

.favorite-icon.is-favorite {
  color: #fbbf24;
}

.favorite-icon.is-favorite:hover {
  color: #f59e0b;
}

/* Enhanced tab styles */
.view-tabs {
  margin-bottom: 20px;
}

.view-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: none;
}

.view-tabs :deep(.el-tabs__nav-wrap) {
  background: #f8fafc;
  border-radius: 8px;
  padding: 6px;
}

.view-tabs :deep(.el-tabs__nav) {
  border: none;
}

.view-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  padding: 10px 20px;
  transition: all 0.3s;
  border-radius: 6px;
  border: none;
  height: auto;
  line-height: 1.5;
}

.view-tabs :deep(.el-tabs__item:hover) {
  color: #667eea;
  background: rgba(102, 126, 234, 0.08);
}

.view-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  font-weight: 600;
}

.view-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.tab-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-with-icon .el-icon {
  font-size: 16px;
}

.tab-badge {
  margin-left: 4px;
}

.tab-badge :deep(.el-badge__content) {
  background-color: #667eea;
  border: none;
  font-weight: 600;
}
</style>