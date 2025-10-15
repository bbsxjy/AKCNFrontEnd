# 后端API需求文档 - 双周报功能

## 概述

前端已完成双周报功能的实现，包括：
- 双周报页面布局（类似示例sample3-1.png和sample3-2.png）
- 导出图片功能（HTML2Canvas）
- Excel导出接口调用（需要后端实现）

## 需要后端实现的API

### 1. 双周报Excel导出API

**端点**: `POST /api/v1/reports/export/bi-weekly`

**功能**: 导出双周报数据为Excel文件，支持两种模板格式

**请求参数**:
```json
{
  "template_type": "sample1" | "sample2",
  "report_data": {
    "report_date": "2025年10月15日",
    "total_applications": 258,
    "status_stats": [
      {
        "label": "需求阶段",
        "count": 0,
        "type": "requirement"
      },
      {
        "label": "研发阶段",
        "count": 83,
        "type": "development"
      },
      {
        "label": "已完成",
        "count": 69,
        "type": "completed"
      },
      {
        "label": "上线阶段",
        "count": 23,
        "type": "online"
      },
      {
        "label": "业务下线",
        "count": 6,
        "type": "offline"
      },
      {
        "label": "未启动",
        "count": 63,
        "type": "not-started"
      },
      {
        "label": "阻塞",
        "count": 2,
        "type": "blocked",
        "detail": "（技术原因-Python版本不兼容）"
      }
    ],
    "key_indicators": [
      {
        "name": "2025年AK验收目标（仅含云原生）",
        "percentage": 31,
        "completed": 19,
        "total": 61
      },
      {
        "name": "2025年技术条线OKR",
        "percentage": 91,
        "completed": 32,
        "total": 35
      },
      {
        "name": "2024&2025年项目目标进度",
        "percentage": 61,
        "completed": 69,
        "total": 114
      }
    ],
    "delayed_apps": [
      {
        "id": "xxx",
        "appName": "统一密钥管理应用",
        "team": "未填写",
        "plannedDate": "2025-05-31",
        "delayMonths": 1,
        "delayReason": "未填写",
        "expectedDate": "2025-06-30"
      }
    ],
    "potential_risk_apps": []
  },
  "export_format": "excel"
}
```

**响应**:
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- 返回Excel文件的二进制数据（Blob）

### 2. Template Type 说明

#### sample1 - 双追踪表格式

**文件结构**:
- Sheet 1: "AK" - 包含AK改造的应用数据
- Sheet 2: "云原生" - 包含云原生改造的应用数据

**列字段**（参考sample1.xlsx）:
```
序、L2应用编号、L2应用名称（全称）、计划改造完成、实施进度、
详细进展及进展、当前实施阶段、...各阶段计划完成时间和实际完成时间...、备注
```

**字段映射**:
- L2应用编号 → `l2_id`
- L2应用名称（全称） → `app_name`
- 计划改造完成 → `ak_supervision_acceptance_year`
- 实施进度 → `progress_percentage`
- 当前实施阶段 → `current_status`
- 各阶段的计划/实际完成时间 → `planned_*_date` / `actual_*_date`

**实现要求**:
1. 根据 `overall_transformation_target` 字段分成两个Sheet（"AK" 和 "云原生"）
2. 按照sample1.xlsx的格式生成Excel文件
3. 包含中文列名
4. 日期格式：YYYY-MM-DD 或 Excel日期格式

#### sample2 - 详细追踪表格式

**文件结构**:
- Sheet 1: "Sheet1" - 包含所有应用的详细追踪数据

**列字段**（参考sample2.xlsx）:
```
归属单位、年、AK标签、入股票系、应用ID、应用名称、是否为核心应用、
所属L1、负责单位、负责单位联系人、开发单位、开发单位联系人、
开发模式、涉及项目、是否云原生、改造层、
更新计划说明、前期实施计划概况/进度备注、...月度进展跟踪（3月、4月、5月、6月）...、
是否已完成采购、完成计划、计划改造完成
```

**字段映射**:
- 归属单位 → `owning_department` 或自定义
- 年 → `ak_supervision_acceptance_year`
- AK标签 → `overall_transformation_target`
- 应用ID → `id`
- 应用名称 → `app_name`
- 负责单位 → `responsible_team`
- 涉及项目 → `belonging_projects`
- 是否云原生 → `overall_transformation_target === '云原生'`
- ...月度进展跟踪 → 需要从subtasks的月度完成数据中汇总

**实现要求**:
1. 单个Sheet包含所有应用
2. 按照sample2.xlsx的格式生成Excel文件
3. 包含月度进展跟踪列（每个月一组列）
4. 需要汇总应用和子任务的数据
5. 包含中文列名

### 3. 数据来源

后端应该从以下数据源获取数据：
1. **Applications表** - 获取应用基本信息
2. **SubTasks表** - 获取子任务和进度信息
3. **计算的统计数据** - 使用report_data中提供的汇总数据

### 4. 实现建议

```python
# 伪代码示例
@router.post("/reports/export/bi-weekly")
async def export_bi_weekly_report(request: BiWeeklyReportExportRequest):
    template_type = request.template_type
    report_data = request.report_data

    # 从数据库获取完整的应用和子任务数据
    applications = await get_all_applications()
    subtasks = await get_all_subtasks()

    if template_type == "sample1":
        # 生成双追踪表格式
        workbook = create_sample1_workbook(applications, subtasks, report_data)
    elif template_type == "sample2":
        # 生成详细追踪表格式
        workbook = create_sample2_workbook(applications, subtasks, report_data)

    # 保存到BytesIO
    output = BytesIO()
    workbook.save(output)
    output.seek(0)

    # 返回Excel文件
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=bi_weekly_report_{template_type}.xlsx"
        }
    )
```

### 5. 字段映射参考

#### Sample1 中文字段映射

| 中文字段名 | 数据库字段 | 说明 |
|----------|----------|------|
| 序 | - | 行号，从1开始 |
| L2应用编号 | `l2_id` | 应用的L2标识 |
| L2应用名称（全称） | `app_name` | 应用名称 |
| 计划改造完成 | `ak_supervision_acceptance_year` | 计划验收年份 |
| 实施进度 | `progress_percentage` | 百分比 |
| 详细进展及进展 | - | 从subtasks汇总 |
| 当前实施阶段 | `current_status` | 映射为中文状态 |
| 计划需求完成 | `planned_requirement_date` | 来自subtasks |
| 实际需求完成 | `actual_requirement_date` | 来自subtasks |
| 计划发版完成 | `planned_release_date` | 来自subtasks |
| 实际发版完成 | `actual_release_date` | 来自subtasks |
| 计划技术上线 | `planned_tech_online_date` | 来自subtasks |
| 实际技术上线 | `actual_tech_online_date` | 来自subtasks |
| 计划业务上线 | `planned_biz_online_date` | 来自subtasks |
| 实际业务上线 | `actual_biz_online_date` | 来自subtasks |
| 备注 | `notes` 或 `block_reason` | 备注信息 |

#### Sample2 中文字段映射

| 中文字段名 | 数据库字段 | 说明 |
|----------|----------|------|
| 归属单位 | `owning_department` | 所属部门 |
| 年 | `ak_supervision_acceptance_year` | 年份 |
| AK标签 | `overall_transformation_target` | AK/云原生 |
| 应用ID | `id` | 应用ID |
| 应用名称 | `app_name` | 应用名称 |
| 负责单位 | `responsible_team` | 负责团队 |
| 涉及项目 | `belonging_projects` | 所属项目 |
| 是否云原生 | - | 基于`overall_transformation_target`计算 |
| 改造层 | - | 需要定义 |
| 前期实施计划概况 | - | 从subtasks汇总 |
| 3月实施状态 | - | 从subtasks按月汇总 |
| 3月实施阶段 | - | 从subtasks按月汇总 |
| 3月完成日期 | - | 从subtasks按月汇总 |
| ...（4月、5月、6月同理） | - | - |

### 6. 测试数据

前端已经在双周报页面实现了数据的收集和展示，后端可以使用以下测试场景：

1. **测试场景1**: 导出sample1格式
   - 验证两个Sheet（AK和云原生）是否正确生成
   - 验证列名和数据映射是否正确

2. **测试场景2**: 导出sample2格式
   - 验证单个Sheet包含所有应用
   - 验证月度进展列是否正确生成

### 7. 前端调用示例

```typescript
// 前端调用代码（已实现）
import { ExcelAPI } from '@/api/reports'

// 导出sample1格式
await ExcelAPI.exportBiWeeklyReport('sample1', reportData)

// 导出sample2格式
await ExcelAPI.exportBiWeeklyReport('sample2', reportData)
```

### 8. 注意事项

1. **日期格式**: Excel日期应该使用Excel的日期格式（数字），而不是字符串
2. **中文列名**: 必须使用中文列名，与示例文件保持一致
3. **Sheet名称**:
   - Sample1: "AK" 和 "云原生"
   - Sample2: "Sheet1"
4. **数据完整性**: 确保所有必填字段都有值，空值应显示为空字符串或"-"
5. **性能优化**: 对于大量数据，考虑分批处理或异步生成
6. **错误处理**: 返回清晰的错误信息，前端会捕获并显示

## 时间估算

- Sample1格式实现: 2-3天
- Sample2格式实现: 3-4天
- 测试和优化: 1-2天
- **总计**: 约6-9天

## 优先级

1. **高优先级**: Sample1格式（双追踪表格式） - 更简单，更常用
2. **中优先级**: Sample2格式（详细追踪表格式） - 更复杂，包含月度数据

## 联系方式

如有任何问题或需要前端配合，请联系前端开发团队。
