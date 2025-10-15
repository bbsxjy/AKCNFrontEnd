<template>
  <el-table
    :data="applications"
    style="width: 100%"
    :max-height="tableMaxHeight"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="50" />

    <!-- 关注 -->
    <el-table-column label="关注" width="60" align="center" fixed="left">
      <template #default="{ row }">
        <el-icon
          class="favorite-icon"
          :class="{ 'is-favorite': row.is_favorite }"
          @click.stop="emit('toggle-favorite', row)"
        >
          <star-filled v-if="row.is_favorite" />
          <star v-else />
        </el-icon>
      </template>
    </el-table-column>

    <!-- 核心标识 -->
    <el-table-column prop="l2_id" label="L2 ID" min-width="120" fixed="left">
      <template #default="{ row }">
        <strong>{{ row.l2_id }}</strong>
      </template>
    </el-table-column>

    <el-table-column prop="app_name" label="应用名称" min-width="180" show-overflow-tooltip>
      <template #default="{ row }">
        <el-link type="primary" @click="emit('show-detail', row)" :underline="false" class="app-name-link">
          {{ row.app_name || row.application_name }}
        </el-link>
      </template>
    </el-table-column>

    <!-- 管理信息 -->
    <el-table-column prop="ak_supervision_acceptance_year" label="监管年份" width="85" align="center">
      <template #default="{ row }">
        {{ row.ak_supervision_acceptance_year ? row.ak_supervision_acceptance_year + '年' : '-' }}
      </template>
    </el-table-column>

    <el-table-column prop="overall_transformation_target" label="改造目标" width="90" align="center">
      <template #default="{ row }">
        <el-tag :type="row.overall_transformation_target === 'AK' ? 'primary' : 'success'" size="small">
          {{ row.overall_transformation_target || 'AK' }}
        </el-tag>
      </template>
    </el-table-column>

    <!-- 当前阶段描述 -->
    <el-table-column prop="current_phase_description" label="当前阶段" min-width="180" align="center">
      <template #default="{ row }">
        <div class="phase-badges">
          <!-- 如果没有AK子任务但有云原生且完成，显示合并状态 -->
          <template v-if="row.ak_subtask_count === 0 && row.cloud_native_subtask_count > 0 && row.cloud_native_status === 'COMPLETED'">
            <el-tooltip placement="top">
              <template #content>
                <div style="line-height: 1.8">
                  <div><strong>云原生改造详情</strong></div>
                  <div>总计：{{ row.cloud_native_subtask_count }} 个子任务</div>
                  <div style="color: #67c23a">已完成：{{ row.cloud_native_completed_count }} 个</div>
                  <div style="margin-top: 8px; color: #a0aec0; font-size: 12px;">
                    云原生已完成，AK改造同步完成
                  </div>
                  <div style="margin-top: 8px; color: #667eea; font-size: 12px;">
                    点击查看子任务详情 →
                  </div>
                </div>
              </template>
              <span
                class="phase-badge status-completed"
                @click="emit('view-subtasks', row)"
              >
                AK云原生已完成
              </span>
            </el-tooltip>
          </template>

          <!-- 正常显示AK和云原生状态 -->
          <template v-else>
            <!-- AK改造状态 - 可点击进入子任务 -->
            <el-tooltip v-if="row.ak_subtask_count > 0" placement="top">
              <template #content>
                <div style="line-height: 1.8">
                  <div><strong>AK改造详情</strong></div>
                  <div>总计：{{ row.ak_subtask_count }} 个子任务</div>
                  <div style="color: #67c23a">已完成：{{ row.ak_completed_count }} 个</div>
                  <div style="color: #409eff">进行中：{{ row.ak_in_progress_count }} 个</div>
                  <div style="color: #909399">待启动：{{ row.ak_not_started_count }} 个</div>
                  <div v-if="row.ak_blocked_count > 0" style="color: #f56c6c">阻塞：{{ row.ak_blocked_count }} 个</div>
                  <div style="margin-top: 8px; color: #667eea; font-size: 12px;">
                    点击查看子任务详情 →
                  </div>
                </div>
              </template>
              <span
                :class="['phase-badge', getPhaseColorClass(row.ak_status === 'COMPLETED' ? '已完成' : row.ak_status === 'BLOCKED' ? '阻塞' : row.ak_status === 'NOT_STARTED' ? '未开始' : getDetailedPhaseText(row), row.ak_status.toLowerCase())]"
                @click="emit('view-subtasks', row)"
              >
                AK·{{ row.ak_status === 'COMPLETED' ? '已完成' : row.ak_status === 'BLOCKED' ? '阻塞' : row.ak_status === 'NOT_STARTED' ? '未开始' : getDetailedPhaseText(row) }}
              </span>
            </el-tooltip>

            <!-- 云原生改造状态 - 可点击进入子任务 -->
            <el-tooltip v-if="row.cloud_native_subtask_count > 0" placement="top">
              <template #content>
                <div style="line-height: 1.8">
                  <div><strong>云原生改造详情</strong></div>
                  <div>总计：{{ row.cloud_native_subtask_count }} 个子任务</div>
                  <div style="color: #67c23a">已完成：{{ row.cloud_native_completed_count }} 个</div>
                  <div style="color: #409eff">进行中：{{ row.cloud_native_in_progress_count }} 个</div>
                  <div style="color: #909399">待启动：{{ row.cloud_native_not_started_count }} 个</div>
                  <div v-if="row.cloud_native_blocked_count > 0" style="color: #f56c6c">阻塞：{{ row.cloud_native_blocked_count }} 个</div>
                  <div style="margin-top: 8px; color: #667eea; font-size: 12px;">
                    点击查看子任务详情 →
                  </div>
                </div>
              </template>
              <span
                :class="['phase-badge', getPhaseColorClass(row.cloud_native_status === 'COMPLETED' ? '已完成' : row.cloud_native_status === 'BLOCKED' ? '阻塞' : row.cloud_native_status === 'NOT_STARTED' ? '未开始' : getDetailedPhaseText(row), row.cloud_native_status.toLowerCase())]"
                @click="emit('view-subtasks', row)"
              >
                云原生·{{ row.cloud_native_status === 'COMPLETED' ? '已完成' : row.cloud_native_status === 'BLOCKED' ? '阻塞' : row.cloud_native_status === 'NOT_STARTED' ? '未开始' : getDetailedPhaseText(row) }}
              </span>
            </el-tooltip>

            <!-- 如果两者都没有子任务 -->
            <span v-if="row.ak_subtask_count === 0 && row.cloud_native_subtask_count === 0" class="no-tasks">
              暂无子任务
            </span>
          </template>
        </div>
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
    <el-table-column label="延期状态" width="130" align="center">
      <template #default="{ row }">
        <div v-if="getDelayCount(row) > 0" class="delay-button-wrapper">
          <el-button
            size="small"
            :type="row.is_delayed ? 'danger' : 'warning'"
            @click="emit('show-delay-details', row)"
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
    <el-table-column label="操作" width="80" fixed="right" align="center">
      <template #default="{ row }">
        <el-button size="small" @click="emit('edit', row)">编辑</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import {
  Warning as ElIconWarning,
  CircleCheck as ElIconCircleCheck,
  ArrowRight as ElIconArrowRight,
  StarFilled,
  Star
} from '@element-plus/icons-vue'
import type { Application } from '@/api/applications'
import { useFormatters } from '@/composables/applications/useFormatters'
import { useStatusHelpers } from '@/composables/applications/useStatusHelpers'

interface Props {
  applications: Application[]
  tableMaxHeight: number
  hasDateAdjustment: (row: Application, phase: string) => boolean
  getDelayCount: (row: Application) => number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'selection-change': [selection: Application[]]
  'toggle-favorite': [app: Application]
  'show-detail': [app: Application]
  'view-subtasks': [app: Application]
  'show-delay-details': [app: Application]
  'edit': [app: Application]
}>()

const { formatYearMonth } = useFormatters()
const { getDetailedPhaseText, getPhaseColorClass } = useStatusHelpers()

const handleSelectionChange = (selection: Application[]) => {
  emit('selection-change', selection)
}
</script>

<style scoped>
.app-name-link {
  font-weight: 500;
  transition: all 0.3s;
}

.app-name-link:hover {
  color: #667eea !important;
  text-decoration: underline !important;
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
</style>
