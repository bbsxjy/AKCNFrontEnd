# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProjectCollaborationManagement is the frontend application for the IT Engineering Project Collaboration Platform (项目协同管理应用). This system manages and tracks the progress of various IT projects including cloud-native transformation, subsidiary governance, system decommissioning, integration, and other engineering initiatives.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Lint and fix code
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

## Architecture

### Technology Stack
- **Framework**: Vue 3 (Composition API)
- **UI Components**: Element Plus
- **State Management**: Pinia
- **Router**: Vue Router 4
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Language**: TypeScript
- **CSS**: SCSS/Sass

### Project Structure
```
src/
├── api/              # API service modules
├── assets/           # Static assets
├── components/       # Reusable components
│   ├── common/      # Generic UI components
│   └── business/    # Business-specific components
├── composables/     # Vue composition functions
├── layouts/         # Layout components
├── router/          # Route definitions
├── stores/          # Pinia state stores
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── views/           # Page components
```

### Core Features

1. **Application Management**
   - CRUD operations for applications
   - L2 ID unique identifier system
   - Supervision year tracking
   - Transformation target (AK/Cloud-Native)

2. **Sub-task Tracking**
   - Module-level task management
   - Progress percentage tracking
   - Date management (planned vs actual)
   - Blocking status with reasons

3. **Progress Monitoring**
   - Automatic status calculation
   - Real-time progress updates
   - Department-wise tracking
   - Delay detection and alerts

4. **Data Import/Export**
   - Excel file import/export (✅ 已修复 - 直接文件下载)
   - Sample.xlsx format support with client-side transformation
   - Two-sheet processing: 总追踪表（勿动）for applications, 子追踪表 for subtasks
   - Chinese field mapping with automatic transformation
   - Batch operations with validation
   - Import history tracking

5. **Audit System**
   - Complete operation logging
   - Data rollback capability
   - User action tracking
   - Change history with old/new values

### API Integration

- **Base URL**: Configured via environment variables (default: `http://localhost:8000/api/v1`)
- **Authentication**: Fixed test token for development: `Bearer token_1_admin_full_access_test_2024`
- **Content-Type**: `application/json` (except for file uploads: `multipart/form-data`)

#### Authentication Endpoints
- `POST /auth/login` - User login (currently bypassed in test mode)
- `POST /auth/sso/callback` - SSO callback handler
- `POST /auth/refresh` - Refresh authentication token
- `GET /auth/me` - Get current user information
- `GET /auth/permissions` - Get user permissions
- `POST /auth/logout` - User logout

#### Application Management
- `GET /applications` - List applications with filtering and pagination
- `GET /applications/{id}` - Get single application details
- `POST /applications` - Create new application
- `PUT /applications/{id}` - Update application
- `DELETE /applications/{id}` - Delete application
- `POST /applications/batch` - Batch operations on applications

#### Sub-task Management
- `GET /subtasks` - List subtasks with filtering
- `GET /subtasks/{id}` - Get single subtask details
- `POST /subtasks` - Create new subtask
- `PUT /subtasks/{id}` - Update subtask
- `PATCH /subtasks/{id}/progress` - Update subtask progress
- `DELETE /subtasks/{id}` - Delete subtask

#### Excel Import/Export
- `POST /excel/import/applications` - Import applications from Excel (direct file upload)
- `POST /excel/import/subtasks` - Import subtasks from Excel (direct file upload)
- `POST /excel/export/applications` - Export applications to Excel
- `POST /excel/export/subtasks` - Export subtasks to Excel
- `GET /excel/template/{type}` - Download Excel template (applications/subtasks)

#### Reports
- `GET /reports/progress-summary` - Get progress summary report
- `GET /reports/delayed-projects` - Get delayed projects report
- `GET /reports/team-performance` - Get team performance report
- `POST /reports/export` - Export reports

#### Audit System
- `GET /audit/logs` - Get audit logs with filtering
- `POST /audit/export` - Export audit logs
- `POST /audit/{id}/rollback` - Rollback to previous state

#### Notifications
- `GET /notifications` - Get notifications list
- `PATCH /notifications/{id}/read` - Mark notification as read
- `POST /notifications/mark-all-read` - Mark all notifications as read
- `POST /notifications/send` - Send notification

#### Calculation
- `POST /calculation/calculate` - Calculate progress and status

### MCP Server Integration

The backend provides a comprehensive **Model Context Protocol (MCP)** server with 27 tools across 8 categories, enabling powerful automation, AI-enhanced analysis, and intelligent assistance.

#### MCP API Endpoints
- `POST /api/v1/mcp/tools/execute` - Execute a single MCP tool
- `POST /api/v1/mcp/query` - Natural language query with AI enhancement
- `GET /api/v1/mcp/tools` - List all available MCP tools
- `GET /api/v1/mcp/health` - MCP server health check

#### MCP Tools Categories

##### 1. Database Query Tools (2 tools)

**db_query** - Execute read-only SQL queries
- Parameters:
  - `query` (string, required) - SQL SELECT statement
  - `limit` (int, optional) - Maximum rows to return (default: 1000)
- Returns: Query results as array of objects
- Security: Read-only, prevents INSERT/UPDATE/DELETE/DROP operations
- Use cases: Custom data analysis, complex reporting, data validation

**db_get_schema** - Get database table structure
- Parameters:
  - `table_name` (string, optional) - Specific table name, or all tables if omitted
- Returns: Schema information including column names, types, constraints
- Use cases: Database exploration, query building assistance, schema documentation

##### 2. Application Management Tools (4 tools)

**app_list** - List applications with filtering
- Parameters:
  - `status` (string, optional) - Filter by status: "待启动" | "进行中" | "已完成" | "阻塞中"
  - `team` (string, optional) - Filter by team/department name
  - `limit` (int, optional) - Maximum results (default: 100)
  - `offset` (int, optional) - Pagination offset
- Returns: Array of application objects with metadata

**app_get** - Get single application details
- Parameters:
  - `application_id` (string, optional) - Application UUID
  - `l2_id` (string, optional) - L2 identifier (either application_id or l2_id required)
- Returns: Complete application details including subtasks
- Use cases: Detailed inspection, data verification

**app_create** - Create new application
- Parameters:
  - `l2_id` (string, required) - Unique L2 identifier
  - `app_name` (string, required) - Application name
  - `supervision_year` (int, required) - Year of supervision
  - `target` (string, required) - "AK" or "云原生"
  - Additional optional fields for team, contacts, etc.
- Returns: Created application object with generated ID

**app_update** - Update existing application
- Parameters:
  - `application_id` (string, required) - Target application UUID
  - `update_data` (object, required) - Fields to update
- Returns: Updated application object
- Note: Automatically creates audit log entry

##### 3. Sub-task Management Tools (3 tools)

**task_list** - List subtasks with filtering
- Parameters:
  - `application_id` (string, optional) - Filter by parent application
  - `status` (string, optional) - Filter by task status
  - `assigned_to` (string, optional) - Filter by assignee
  - `limit` (int, optional) - Maximum results
- Returns: Array of subtask objects

**task_create** - Create new subtask
- Parameters:
  - `application_id` (string, required) - Parent application ID
  - `module_name` (string, required) - Module/component name
  - `sub_target` (string, optional) - Sub-target description
  - `task_status` (string, optional) - Initial status
  - `assigned_to` (string, optional) - Assignee name
  - Date fields: `plan_start_date`, `plan_end_date`, etc.
- Returns: Created subtask object

**task_batch_update** - Batch update multiple subtasks
- Parameters:
  - `task_ids` (array<string>, required) - Array of subtask IDs to update
  - `update_data` (object, required) - Fields to apply to all tasks
- Returns: Batch operation summary (success/failure counts)
- Use cases: Bulk status changes, reassignment, date adjustments

##### 4. Excel Operations Tools (2 tools)

**excel_import** - Import data from Excel file
- Parameters:
  - `file_path` (string, required) - Path to Excel file
  - `import_type` (string, required) - "applications" or "subtasks"
- Returns: Import statistics (success/failure counts, error details)
- Supports: Chinese column names, two-sheet format (总追踪表 + 子追踪表)

**excel_export** - Export data to Excel file
- Parameters:
  - `export_type` (string, required) - "applications" | "subtasks" | "reports"
  - `filters` (object, optional) - Filter criteria for export
  - `output_path` (string, optional) - Target file path
- Returns: Export file path and statistics
- Use cases: Backup, reporting, data sharing

##### 5. Calculation Service Tools (2 tools)

**calc_progress** - Calculate application progress
- Parameters:
  - `application_ids` (array<string>, optional) - Specific apps to recalculate
  - `recalculate_all` (boolean, optional) - Recalculate all applications
- Returns: Updated progress percentages and statuses
- Logic: Aggregates subtask progress, updates parent application status

**calc_delays** - Analyze project delays
- Parameters:
  - `include_details` (boolean, optional) - Include detailed delay breakdown
- Returns: Delay statistics and list of delayed projects
- Identifies: Projects past planned end date, blocked tasks, at-risk projects

##### 6. Audit Operations Tools (2 tools)

**audit_get_logs** - Retrieve audit log entries
- Parameters:
  - `table_name` (string, optional) - Filter by table (applications, subtasks)
  - `operation` (string, optional) - Filter by operation (INSERT, UPDATE, DELETE)
  - `user_id` (string, optional) - Filter by user
  - `start_date` (string, optional) - ISO date range start
  - `end_date` (string, optional) - ISO date range end
  - `limit` (int, optional) - Maximum records (default: 100, no maximum limit)
  - `offset` (int, optional) - Pagination offset
- Returns: Array of audit log entries with old/new values
- Use cases: Change tracking, compliance auditing, troubleshooting

**audit_rollback** - Rollback changes to previous state
- Parameters:
  - `audit_log_id` (string, required) - Audit log entry ID to rollback
- Returns:
  - `success` (boolean) - Rollback success status
  - `restored_values` - Data restored to previous state
  - `rollback_audit_id` - New audit entry for the rollback operation
- How it works:
  1. Reads `old_values` from specified audit log
  2. Restores record to pre-modification state
  3. Creates new audit log for the rollback action
- Use cases: Undo mistakes, emergency recovery, data restoration
- Security: Only supports rollback of UPDATE/DELETE operations (prevents INSERT conflicts)

##### 7. CMDB System Catalog Tools (7 tools)

The CMDB (Configuration Management Database) system stores and manages information about enterprise systems and applications in 3 tables: L2 Applications table, 156L1 Systems table, and 87L1 Systems table. Each record has a unique Configuration Item ID, with relationships established between applications and systems.

**CMDB Data Structure:**
- **L2 Applications Table**: Records all L2 applications with various lifecycle statuses (立项通过/Approved, 建设中/Under Construction, 运行中/In Operation, etc.). See `system_status` field for complete status list.
- **156L1 Systems Table**: Contains 156 L1 systems plus 9 virtual collections (EC应用集, 代建应用集, 国际应用集, etc.). "其他" represents commercial products. This is the **current classification** used for external reporting.
- **87L1 Systems Table**: Contains 87 L1 systems plus 9 virtual collections. This is the **planned target state** that will replace 156L1 by the end of 2027.
- **Configuration Item ID**: Unique identifier for each record, used to establish relationships between L2 applications and L1 systems.

**L2 Application Fields:**
The CMDB maintains comprehensive information for each L2 application:
- **规范名称 (Canonical Name)**: Official short name in the master table
- **其他名称 (Other Names)**: Alternative names and aliases
- **配置项ID (Configuration Item ID)**: Unique identifier
- **业务主管单位 (Business Supervising Department)**: Business owner department
- **联系人 (Contact Person)**: Primary contact
- **系统开发单位 (System Development Unit)**: Development organization
- **系统开发接口人 (Development Interface Person)**: Development contact
- **应用软件层运维单位 (Application Operations Unit)**: Operations organization
- **应用软件层运维接口人 (Operations Interface Person)**: Operations contact
- **管理级别 (Management Level)**: Classification level (集团级/Group Level, 156一级部门级/156 L1 Department Level, 二级部门级/L2 Department Level)
- **系统状态 (System Status)**: Lifecycle status
- **所属156L1系统 (Belongs to 156L1 System)**: Parent 156L1 system
- **所属87L1系统 (Belongs to 87L1 System)**: Parent 87L1 system (future)

**L2 ↔ L1 System Relationship Rules:**
1. **Unique Association**: Based on application architecture review, each L2 application is typically uniquely associated with one 156L1 system.
2. **Virtual Collections**: L2 applications that don't fit into specific L1 systems are associated with virtual collections (代建应用集/Commissioned Apps, 国际应用集/International Apps, etc.).
3. **Dual Classification**: Each L2 application can be associated with both 156L1 (current) and 87L1 (future) systems.
4. **Management Level Inheritance**: The management level of an L1 system is derived from the highest management level among all its child L2 applications.

**Management Level (管理级别):**
The management level is evaluated according to "中国银联系统及应用分类分级管理办法" (China UnionPay System and Application Classification Management Measures). It is used in:
- Disaster recovery planning
- Change management processes
- Security incident handling
- IT outsourcing management
- Network security level protection

Management levels are reviewed quarterly by the Technical Department for dynamic adjustments. Application owners can proactively submit adjustment requests through the "办公流程 - 系统备案及域名申请" (Office Process - System Registration and Domain Application) workflow.

**System and Application Query Channels:**
- **OA Portal**: Access via "系统及应用" (Systems & Applications) icon on OA homepage for online queries
- **Bulk Operations**: Contact Technical Department Qi Lingtao (技术部祁凌涛) for batch filtering, downloads, or access issues
- **Offline Applications**: Applications that have been decommissioned are not displayed in OA directory but remain in the backend database. Query via MCP assistant or contact Technical Department for lists.

**Interface Person Adjustment Process:**
1. **Within Department**: Send email to Technical Department Qi Lingtao, cc new interface person, specify which L2 application and which role's interface person is being adjusted.
2. **Cross-Department**: Submit information change through "办公流程 - 系统备案及域名申请" (Office Process - System Registration and Domain Application).

**L2-L1 Relationship Adjustment Process:**
- Submit information change through "办公流程 - 系统备案及域名申请" (Office Process - System Registration and Domain Application)
- Provide justification and undergo cross-department review
- Focus on reviewing reasonability and impact on existing Xinchuang (信创) and cloud-native transformation plans

**156L1 vs 87L1 Systems:**
- **156L1**: Current classification system with 156 L1 systems, also used for external reporting
- **87L1**: Planned target state with 87 L1 systems, expected to transition from 156L1 by the end of 2027
- Both include 9 virtual collections for special categories (EC应用集, 代建应用集, etc.)

---

**cmdb_search_l2** - Search L2 applications in CMDB
- Parameters:
  - `keyword` (string, optional) - Search in canonical name (规范名称) and other names (其他名称)
  - `status` (string, optional) - Filter by lifecycle status (立项通过/建设中/运行中/etc.)
  - `management_level` (string, optional) - Filter by management level: "集团级" | "156一级部门级" | "二级部门级"
  - `belongs_to_156l1` (string, optional) - Filter by 156L1 parent system
  - `belongs_to_87l1` (string, optional) - Filter by 87L1 parent system (future)
  - `limit` (int, optional) - Maximum results
- Returns: Array of L2 application records with all fields (规范名称, 配置项ID, 联系人, 开发接口人, 运维接口人, etc.)
- Use cases:
  - Query canonical name, ID, contacts, and interface persons for an L2 application
  - Find all applications belonging to a specific 156L1 or 87L1 system
  - Search by management level or system status

**cmdb_get_l2** - Get single L2 application details by L2 ID
- Parameters:
  - `l2_id` (string, required) - L2 identifier (规范名称)
- Returns: Complete L2 application details including:
  - Configuration Item ID (配置项ID)
  - Canonical and other names (规范名称, 其他名称)
  - Business supervising department (业务主管单位)
  - Contact person (联系人)
  - Development unit and interface person (系统开发单位, 系统开发接口人)
  - Operations unit and interface person (应用软件层运维单位, 应用软件层运维接口人)
  - Management level (管理级别)
  - System status (系统状态)
  - Associated 156L1 and 87L1 systems (所属156L1系统, 所属87L1系统)
- Use cases: Get comprehensive information for a specific L2 application

**cmdb_create_l2** - Create new L2 application in CMDB
- Parameters:
  - `l2_id` (string, required) - Unique L2 identifier (规范名称)
  - `l2_name` (string, required) - Application canonical name
  - `configuration_item_id` (string, auto-generated) - Unique configuration item ID
  - `management_level` (string, required) - Management level classification
  - `system_status` (string, optional) - Initial lifecycle status (default: 立项通过)
  - `belongs_to_156l1` (string, optional) - 156L1 parent system
  - `belongs_to_87l1` (string, optional) - 87L1 parent system
  - `contact_person` (string, optional) - Contact person
  - `dev_unit` (string, optional) - Development unit
  - `dev_interface_person` (string, optional) - Development interface person
  - `ops_unit` (string, optional) - Operations unit
  - `ops_interface_person` (string, optional) - Operations interface person
  - Additional metadata fields
- Returns: Created L2 record with generated Configuration Item ID
- Note: Configuration Item ID is unique and auto-generated

**cmdb_update_l2** - Update L2 application
- Parameters:
  - `l2_id` (string, required) - L2 identifier
  - `update_data` (object, required) - Fields to update (can include any L2 application fields)
- Returns: Updated L2 record
- Use cases: Update contact persons, interface persons, management level, system status, etc.

**cmdb_search_156l1** - Search 156L1 systems (current classification for external reporting)
- Parameters:
  - `keyword` (string, optional) - Search in system name
  - `limit` (int, optional) - Maximum results
- Returns: Array of 156L1 system records
- Note: Includes 156 L1 systems + 9 virtual collections (EC应用集, 代建应用集, 国际应用集, etc.)

**cmdb_get_156l1_with_l2s** - Get 156L1 system with all child L2 applications
- Parameters:
  - `l1_156_id` (string, required) - 156L1 system identifier
- Returns:
  - 156L1 system details
  - Array of all child L2 applications with full details
  - Calculated management level (highest among all child L2s)
- Use cases: View all applications under a specific 156L1 system

**cmdb_search_87l1** - Search 87L1 systems (future target state, planned for 2027 transition)
- Parameters:
  - `keyword` (string, optional) - Search in system name
  - `limit` (int, optional) - Maximum results
- Returns: Array of 87L1 system records
- Note: Includes 87 L1 systems + 9 virtual collections, will replace 156L1 by end of 2027

**CMDB Key Features:**
- **Dual Classification Support**: 156L1 (current) and 87L1 (future target state)
- **Complete L2 ↔ L1 Relationship Mapping**: Each L2 uniquely associates with L1 systems or virtual collections
- **Configuration Item ID**: Unique identifier for each record, establishes relationships
- **Comprehensive Contact Management**: Tracks business contacts, development interface persons, operations interface persons
- **Management Level Tracking**: Classification levels used across disaster recovery, change management, security, etc.
- **Lifecycle Status Management**: Tracks applications from approval through construction to operation
- **Multi-dimensional Search and Filtering**: By name, status, management level, parent system, etc.
- **Interface Person Adjustment Workflows**: Documented processes for within-department and cross-department changes
- **Virtual Collection Support**: For applications that don't fit specific L1 systems (代建应用集, 国际应用集, etc.)
- **Excel Bulk Import Capability**: Batch operations for system and application data

##### 8. Dashboard & Analytics Tools (2 tools)

**dashboard_stats** - Get dashboard statistics
- Parameters:
  - `stat_type` (string, required) - "summary" | "progress_trend" | "department" | "delayed"
  - `date_range` (object, optional) - Time range filter with start/end dates
- Returns: Aggregated statistics based on type
- Use cases: Executive dashboards, team reports, progress monitoring

**dashboard_export** - Export dashboard data
- Parameters:
  - `format` (string, required) - "json" | "csv" | "excel"
  - `include_charts` (boolean, optional) - Include chart data (default: false)
- Returns: Export file path or data object
- Use cases: Report generation, data archival, external sharing

#### AI-Enhanced Features

The MCP server includes **3 core AI capabilities** powered by LLM integration:

##### 1. Natural Language Report Generation

**Function:** `generate_report(data: Dict[str, Any]) -> str`

Converts structured data into professional natural language reports with automatic analysis and key insight extraction.

**Example:**
```python
report_data = {
    "total_applications": 258,
    "completed": 69,
    "in_progress": 83,
    "delayed": 23
}
report = await ai_assistant.generate_report(report_data)
# Output: "本期项目进展报告显示，总计258个应用中，已完成69个（26.7%），
#          正在进行中的有83个，延期项目23个需要重点关注..."
```

**Use cases:**
- Executive summary generation
- Automated progress reports
- Status update emails
- Management presentations

##### 2. AI Intelligent Suggestions

**Function:** `suggest_next_actions(context: Dict[str, Any]) -> List[str]`

Analyzes current context and recommends 3-5 prioritized next actions with specific tool names.

**Example:**
```python
context = {
    "delayed_projects": 23,
    "blocked_tasks": 5,
    "recent_changes": [...]
}
suggestions = await ai_assistant.suggest_next_actions(context)
# Output: [
#   "使用 calc_delays 分析延期项目根本原因",
#   "使用 task_list 检查阻塞任务详情",
#   "使用 audit_get_logs 查看最近变更记录",
#   ...
# ]
```

**Use cases:**
- Project management decision support
- Workflow automation recommendations
- Risk warning and mitigation
- Resource allocation optimization

##### 3. SQL Query Analysis

**Function:** `analyze_query(query: str) -> Dict[str, Any]`

AI-powered deep analysis of SQL queries with optimization suggestions and security checks.

**Analysis includes:**
1. **Query Explanation** - Natural language description of query logic
2. **Performance Issues** - Identifies potential bottlenecks:
   - Missing indexes
   - Unnecessary full table scans
   - N+1 query problems
   - Excessive result sets
3. **Optimization Suggestions** - Specific improvements:
   - Index recommendations
   - Query rewrite options
   - JOIN optimization
   - Subquery optimization
4. **Security Checks** - SQL injection risk assessment:
   - Parameterization recommendations
   - Permission checks
   - Sensitive data access warnings

**Example:**
```python
query = "SELECT * FROM applications WHERE status = 'IN_PROGRESS'"
analysis = await ai_assistant.analyze_query(query)
# Output: {
#   "explanation": "查询所有进行中的应用，返回全部字段",
#   "performance_issues": ["使用SELECT *，建议指定具体字段"],
#   "optimization": "建议在status字段上添加索引",
#   "security": "参数化处理，防止SQL注入"
# }
```

**Use cases:**
- Development-stage SQL optimization
- Production slow query analysis
- Database performance tuning
- Security auditing

#### AI Configuration

The MCP server supports **4 LLM providers**:

1. **OpenAI (GPT-3.5/GPT-4)**
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4
   OPENAI_BASE_URL=https://api.openai.com/v1  # Optional: for proxy/Azure
   ```

2. **Anthropic Claude**
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-3-opus-20240229
   ```

3. **Azure OpenAI**
   ```env
   AZURE_OPENAI_API_KEY=...
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   ```

4. **Local LLM (Ollama/LlamaCpp)**
   ```env
   LOCAL_LLM_BASE_URL=http://localhost:11434
   LOCAL_LLM_MODEL=llama2
   ```

**Enable AI Features:**
```env
MCP_ENABLE_AI_TOOLS=true
```

**Performance & Security:**
- Async calls, non-blocking execution
- 60-second timeout
- Error fallback: AI failure doesn't affect core functionality
- Optional toggle: Can completely disable AI features
- API key secure storage (environment variables)
- Local LLM option (data stays on-premises)
- Sensitive data anonymization
- All AI calls are logged for auditing

#### MCP Usage Examples

**Execute a Tool:**
```typescript
// Frontend API call
import { mcpApi } from '@/api/mcp'

// Example 1: Get audit logs
const logs = await mcpApi.executeTool('audit_get_logs', {
  limit: 100,
  table_name: 'applications'
})

// Example 2: Batch update tasks
const result = await mcpApi.executeTool('task_batch_update', {
  task_ids: ['task-1', 'task-2', 'task-3'],
  update_data: { status: '已完成' }
})

// Example 3: Rollback changes
const rollback = await mcpApi.executeTool('audit_rollback', {
  audit_log_id: 'log-456'
})
```

**Natural Language Query (AI-Enhanced):**
```typescript
// AI-powered query
const response = await mcpApi.query(
  "列出所有延期超过7天的应用，并分析原因"
)
// AI automatically:
// 1. Determines which tools to use (calc_delays, app_list, etc.)
// 2. Executes the tools
// 3. Analyzes the results
// 4. Generates natural language report
```

**Dashboard Statistics:**
```typescript
// Get summary stats
const stats = await mcpApi.executeTool('dashboard_stats', {
  stat_type: 'summary'
})

// Get delayed projects
const delayed = await mcpApi.executeTool('dashboard_stats', {
  stat_type: 'delayed',
  date_range: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
})
```

**CMDB Operations:**
```typescript
// Example 1: Query L2 application details (对应需求 #1)
// 某个L2应用的规范名称是什么？ID是什么？联系人？开发单位接口人？运维单位接口人？
const appDetails = await mcpApi.executeTool('cmdb_get_l2', {
  l2_id: '支付系统'
})
// Returns: 规范名称, 配置项ID, 联系人, 系统开发接口人, 应用软件层运维接口人, etc.

// Example 2: Search L2 applications by keyword (对应需求 #3)
// XX应用的管理级别是多少？其所属156L1系统是什么？
const searchResults = await mcpApi.executeTool('cmdb_search_l2', {
  keyword: '支付',
  limit: 10
})
// If exact match found, returns management level and 156L1 system
// If no exact match, returns all L2 applications matching the keyword

// Example 3: Get all L2 applications under a 156L1 system
const l1WithApps = await mcpApi.executeTool('cmdb_get_156l1_with_l2s', {
  l1_156_id: '核心业务系统'
})
// Returns 156L1 system details + all child L2 applications

// Example 4: Filter by management level
const highLevelApps = await mcpApi.executeTool('cmdb_search_l2', {
  management_level: '集团级',
  limit: 100
})

// Example 5: Update L2 application interface person (对应需求 #4)
// 系统的接口人调整流程
const updated = await mcpApi.executeTool('cmdb_update_l2', {
  l2_id: '支付系统',
  update_data: {
    dev_interface_person: '张三',
    ops_interface_person: '李四'
  }
})
// Note: For within-department changes, email Technical Department Qi Lingtao
// For cross-department changes, submit via "办公流程 - 系统备案及域名申请"

// Example 6: Query applications in different lifecycle status
const inConstructionApps = await mcpApi.executeTool('cmdb_search_l2', {
  status: '建设中',
  limit: 50
})

const operationalApps = await mcpApi.executeTool('cmdb_search_l2', {
  status: '运行中',
  limit: 50
})

// Example 7: Search 87L1 systems (future target state, planned for 2027)
// 对应需求 #7: 156L1系统与87L1系统有什么区别？
const future87L1 = await mcpApi.executeTool('cmdb_search_87l1', {
  keyword: '核心',
  limit: 10
})
```

**CMDB Natural Language Queries:**
```typescript
// AI-enhanced CMDB queries matching requirements from 需求.xlsx

// 对应需求 #1: 某个L2应用的规范名称是什么？ID是什么？联系人？开发单位接口人？运维单位接口人？
const response1 = await mcpApi.query(
  "支付系统的规范名称是什么？配置项ID是什么？联系人是谁？开发接口人和运维接口人是谁？"
)

// 对应需求 #3: XX应用的管理级别是多少？其所属156L1系统是什么？
const response2 = await mcpApi.query(
  "账户管理系统的管理级别是多少？它属于哪个156L1系统？"
)

// 对应需求 #6: XX系统在OA上的系统及应用目录查询不到，是什么原因？
const response3 = await mcpApi.query(
  "为什么旧版报表系统在OA上查询不到？它是否已经下线？"
)
// AI will check system status and explain if application is offline

// 对应需求 #7: 156L1系统与87L1系统有什么区别？
const response4 = await mcpApi.query(
  "156L1系统和87L1系统有什么区别？什么时候会过渡到87L1？"
)
// AI explains: 156L1 is current, 87L1 is future target state, transition by end of 2027

// 对应需求 #9: L2应用的管理级别与L1系统的管理级别是什么关系？
const response5 = await mcpApi.query(
  "L2应用的管理级别和L1系统的管理级别有什么关系？如何确定？"
)
// AI explains management level inheritance rules

// 对应需求 #10: L2应用的管理级别有什么用处？有哪些具体管理要求？
const response6 = await mcpApi.query(
  "L2应用的管理级别在哪些方面会用到？有什么管理要求？"
)
// AI lists: disaster recovery, change management, security, IT outsourcing, etc.
```

#### MCP Tools Summary

| Category | Tool Count | Prefix | Key Features |
|----------|-----------|--------|--------------|
| 1. Database Query | 2 | `db_*` | Read-only SQL, schema inspection |
| 2. Application Mgmt | 4 | `app_*` | CRUD operations, filtering |
| 3. Sub-task Mgmt | 3 | `task_*` | Task operations, batch updates |
| 4. Excel Operations | 2 | `excel_*` | Import/export with validation |
| 5. Calculation | 2 | `calc_*` | Progress, delay analysis |
| 6. Audit Operations | 2 | `audit_*` | Logging, rollback capability |
| 7. CMDB System | 7 | `cmdb_*` | L2/L1 management, search |
| 8. Dashboard | 2 | `dashboard_*` | Statistics, export |
| **AI Enhancement** | **3** | N/A (internal) | **Report, suggestions, SQL analysis** |
| **Total** | **24 tools + 3 AI capabilities** | | |

#### Frontend Integration Recommendations

1. **Create MCP API Module** (`src/api/mcp.ts`):
   ```typescript
   import request from './index'

   export const mcpApi = {
     // Execute MCP tool
     executeTool(toolName: string, params: any) {
       return request.post('/mcp/tools/execute', {
         tool_name: toolName,
         parameters: params
       })
     },

     // AI-enhanced query
     query(query: string) {
       return request.post('/mcp/query', { query })
     },

     // List available tools
     listTools() {
       return request.get('/mcp/tools')
     }
   }
   ```

2. **MCP Store** (`src/stores/mcp.ts`) - ✅ Implemented:
   - **State Management**:
     - `availableTools` - Cached tool definitions (27 tools)
     - `executionHistory` - Last 100 tool executions with results
     - `aiEnabled` - AI feature toggle
     - `lastAISuggestions` - AI-generated action suggestions
     - `mcpHealthy` - MCP server health status

   - **Tool Execution Methods**:
     - Database: `dbQuery()`, `dbGetSchema()`
     - Application: `appList()`, `appGet()`, `appCreate()`, `appUpdate()`
     - Subtask: `taskList()`, `taskCreate()`, `taskBatchUpdate()`
     - Calculation: `calcProgress()`, `calcDelays()`
     - Audit: `auditGetLogs()`, `auditRollback()`
     - CMDB: `cmdbSearchL2()`, `cmdbGetL2()`, `cmdbCreateL2()`, `cmdbUpdateL2()`, `cmdbSearch156L1()`, `cmdbGet156L1WithL2s()`, `cmdbSearch87L1()`
     - Dashboard: `dashboardStats()`, `dashboardExport()`
     - Excel: `excelImport()`, `excelExport()`

   - **Core Actions**:
     - `checkHealth()` - Verify MCP server connectivity
     - `loadTools()` - Fetch available tool definitions
     - `executeTool(name, params)` - Generic tool execution
     - `query(text, context)` - Natural language AI query
     - `clearHistory()` - Clear execution history
     - `initialize()` - Auto-initialize on app startup

3. **MCP Type Definitions** (`src/types/mcp.ts`) - ✅ Implemented:
   - 560+ lines of comprehensive TypeScript types
   - All 27 tool request/response types
   - AI feature types (report generation, action suggestions, query analysis)
   - Execution history and state management types
   - Helper types and union types for type safety

4. **UI Components** - ✅ Implemented:
   - `ApplicationDataRenderer.vue` - Renders application data with schema awareness
   - `MarkdownRenderer.vue` - Renders AI-generated markdown reports
   - `TemplateFillResultRenderer.vue` - Displays template fill results
   - `MCPAgentView.vue` - Complete MCP agent interface with tool execution
   - Enhanced `AuditView.vue` with rollback functionality
   - Enhanced `ReportsView.vue` with AI-powered insights

4. **Use Cases in Existing Views**:
   - **Audit Log View**: Add rollback buttons using `audit_rollback`
   - **Dashboard**: Use `dashboard_stats` for real-time metrics
   - **Application List**: Add "AI Analyze" button for suggestions
   - **Reports**: Generate AI reports using `generate_report`

### Excel Import Notes

The system now sends original Excel files directly to the backend without client-side transformation. The backend is expected to handle:

1. **Chinese column names** in Excel files
2. **Two-sheet format**:
   - 总追踪表（勿动） - Applications data
   - 子追踪表 - Subtasks data
3. **Date format conversion** from Excel serial numbers to ISO dates
4. **Field mapping** from Chinese to English field names

If the backend cannot process Chinese column names, it should implement its own mapping logic or notify the frontend team to restore the transformation functionality.

### State Management (Pinia)

Key stores:
- `useAuthStore` - User authentication and SSO
- `useApplicationStore` - Application data and operations
- `useSubTaskStore` - Sub-task management
- `useAuditStore` - Audit log operations
- `useMCPStore` - ✅ MCP tool execution, AI features, and execution history (Implemented)

### Component Guidelines

1. **Naming Convention**
   - PascalCase for component files
   - Prefix business components with domain name
   - Use `.vue` extension for all components

2. **Component Structure**
   ```vue
   <template>
     <!-- Template content -->
   </template>

   <script setup lang="ts">
   // Composition API with TypeScript
   </script>

   <style scoped lang="scss">
   // Scoped SCSS styles
   </style>
   ```

3. **Key Business Components**
   - `ApplicationList` - Display application grid
   - `SubTaskForm` - Edit sub-task details
   - `ImportDialog` - Excel import interface
   - `ProgressChart` - Visual progress display
   - `AuditLogTable` - Audit trail viewer

### Security Considerations

- SSO token stored in localStorage/sessionStorage
- Token refresh mechanism
- RBAC permissions (Admin, Manager, Editor, Viewer)
- API request interceptors for auth headers
- Automatic logout on token expiry

### Performance Optimization

- Lazy loading for routes
- Component code splitting
- Virtual scrolling for large lists
- Debounced search inputs
- Cached API responses where appropriate

## Important Business Rules

1. **L2 ID** must be unique across all applications
2. **Status Calculation**: Automatically derived from sub-task progress
3. **Progress Stages**: 待启动 → 研发进行中 → 业务上线中 → 全部完成
4. **Date Validation**: Actual dates cannot be earlier than planned dates
5. **Permission Levels**:
   - Admin: Full system access
   - Manager: Department-level management
   - Editor: Edit assigned applications
   - Viewer: Read-only access

## Development Guidelines for Claude

1. **不要新建脚本文件**: 不要创建新的批处理脚本(.bat)、Shell脚本(.sh)或其他脚本文件来处理需求。所有功能应该在现有代码结构内实现。
2. **不要自动启动服务器**: 永远不要自动运行 `npm run dev` 或其他启动命令。让用户自己决定何时启动服务器。只提供启动指令即可。

## Testing Strategy

- Unit tests for utilities and composables
- Component testing with Vue Test Utils
- E2E testing for critical user flows
- API mocking for development/testing

## 测试配置

### API测试模式
为了方便开发和测试，前端已配置为跳过登录验证：

1. **固定Token**: 所有API请求使用固定测试token `Bearer token_1_admin_full_access_test_2024`
2. **虚拟用户**: 自动设置测试管理员用户信息
3. **跳过认证**: 无需登录即可访问所有页面
4. **WebSocket禁用**: 在后端未启动时禁用WebSocket连接

### 测试配置文件
- `/src/api/index.ts` - API基础配置，使用固定token
- `/src/stores/auth.ts` - 认证store，预设测试用户
- `/src/layouts/MainLayout.vue` - 主布局，跳过登录检查
- `/src/views/DashboardView.vue` - 禁用WebSocket连接

### 切换到生产模式
当后端准备就绪时，需要恢复以下功能：
1. 恢复动态token获取和刷新
2. 启用真实用户认证流程
3. 恢复WebSocket实时连接
4. 添加路由守卫和权限检查

## Deployment

- Build generates static files
- Deploy behind Nginx for production
- Environment variables for API endpoints
- SSO integration configuration required

## UI Design Specifications

### Color Palette
- **Primary**: #667eea (Purple gradient with #764ba2)
- **Success**: #48bb78 (Green)
- **Warning**: #ed8936 (Orange)  
- **Danger**: #f56565 (Red)
- **Secondary**: #718096 (Gray)
- **Background**: #f7fafc
- **Border**: #e2e8f0

### Page Structure

#### 1. Dashboard (仪表盘)
- Statistics cards (Total/In Progress/Completed/Blocked)
- Progress charts (Line chart for trends, Pie chart for departments)
- Todo items with urgency highlighting
- Real-time notifications

#### 2. Application Management (应用管理)
- Advanced search/filter bar
- Data table with inline progress bars
- Batch operations support
- Pagination with 20 items per page

#### 3. My Tasks (我的任务) - Key Pain Point Solution
- Auto-filtered to current user's tasks only
- Urgency indicators (red/yellow/green)
- Quick update buttons
- Confirmation dialogs to prevent mis-operations

#### 4. Sub-task Management (子任务管理)
- Master-detail view
- Progress tracking per module
- Blocking status management
- Batch update capabilities

#### 5. Audit Log (审计日志) - Unlimited Records
- No 1000-record limitation
- Advanced filtering (table/operation/user/date)
- Diff view for changes
- Rollback functionality

#### 6. Batch Import (批量导入)
- Step-by-step wizard (4 steps)
- Drag & drop file upload
- Data validation preview
- Import modes: Append/Replace/Update

#### 7. Reports Center (报表中心)
- Multiple report types (Summary/Progress/Delay/Department)
- Interactive charts
- Export to Excel/PDF
- Custom date ranges

### UI Components

#### Status Badges
- 待启动 (Pending): Gray background
- 进行中 (In Progress): Blue background
- 已完成 (Completed): Green background
- 阻塞中 (Blocked): Red background

#### Button Styles
- Primary: Gradient background (#667eea → #764ba2)
- Secondary: Gray (#e2e8f0)
- Success: Green (#48bb78)
- Warning: Orange (#ed8936)
- Danger: Red (#f56565)

#### Form Elements
- Rounded corners (6px)
- Border color: #cbd5e0
- Focus state: Primary color border
- Consistent padding: 10px

## Implementation Work Plan

### Phase 1: Project Setup & Core Infrastructure (Week 1)
1. **Initialize Vue 3 + Vite project**
   - Setup TypeScript configuration
   - Configure path aliases
   - Setup ESLint & Prettier

2. **Install and configure dependencies**
   - Element Plus UI library
   - Pinia for state management
   - Vue Router for navigation
   - Axios for API calls
   - Day.js for date handling
   - XLSX.js for Excel operations

3. **Setup base architecture**
   - Create folder structure
   - Configure router with lazy loading
   - Setup Pinia stores structure
   - Create API service layer
   - Setup authentication interceptors

### Phase 2: Layout & Navigation (Week 1)
1. **Create layout components**
   - MainLayout with header/sidebar/content
   - Navigation menu component
   - User profile dropdown
   - Notification center

2. **Implement routing structure**
   - Public routes (login)
   - Protected routes with guards
   - Role-based route access

### Phase 3: Core Features Implementation (Weeks 2-3)

#### Dashboard Page
- Statistics cards component
- Charts integration (ECharts/Chart.js)
- Todo list component
- Real-time data updates

#### Application Management
- ApplicationList component with table
- Search/filter functionality
- CRUD operations
- Excel export feature

#### My Tasks Feature (Priority)
- Auto-filter by current user
- Task cards with urgency levels
- Quick update forms
- Confirmation dialogs

#### Sub-task Management
- Master-detail layout
- Progress tracking
- Status update forms
- Batch operations

### Phase 4: Advanced Features (Week 4)

#### Audit Log System
- Infinite scroll or pagination
- Advanced filtering
- Diff viewer component
- Rollback confirmation dialog

#### Batch Import
- File upload component
- Step wizard component
- Data preview table
- Validation results display

#### Reports Module
- Chart components
- Export functionality
- Custom date range picker
- Report templates

### Phase 5: Integration & Testing (Week 5)
1. **API Integration**
   - Connect all endpoints
   - Error handling
   - Loading states
   - Retry mechanisms

2. **SSO Integration**
   - Token management
   - Auto-refresh mechanism
   - Session timeout handling

3. **Testing**
   - Unit tests for utilities
   - Component testing
   - E2E test scenarios
   - Performance testing

### Phase 6: Optimization & Deployment (Week 6)
1. **Performance Optimization**
   - Code splitting
   - Lazy loading
   - Virtual scrolling for large lists
   - API response caching

2. **Production Build**
   - Environment configurations
   - Build optimization
   - Bundle size analysis

3. **Deployment**
   - Docker configuration
   - Nginx setup
   - CI/CD pipeline
   - Monitoring setup

## Key Implementation Notes

### Pain Points to Address
1. **User Task Confusion**: Implement smart filtering to show only relevant tasks
2. **Audit Log Limitations**: Use database instead of Excel, no record limits
3. **Data Entry Errors**: Add confirmation dialogs and validation
4. **Progress Tracking**: Real-time calculation and visual indicators

### Technical Decisions
- Use Composition API for all components
- Implement virtual scrolling for tables > 100 rows
- Use WebSocket for real-time updates (optional)
- Cache API responses with 5-minute TTL
- Implement optimistic UI updates

### Development Priorities
1. Core CRUD operations
2. My Tasks feature (pain point solution)
3. Audit logging system
4. Excel import/export
5. Advanced reporting

## Git Workflow

### Repository Status
- **Current Branch**: `feature/initial-implementation`
- **Main Branch**: `master`
- **Latest Commit**: All core features implemented with pain point solutions

### Commit History
1. **Initial Setup** (`5189c4c`): Vue 3 + TypeScript + Element Plus project structure
2. **Core Architecture** (`7bf179c`): API service layer, Pinia stores, MainLayout, Dashboard
3. **Complete Implementation** (`20017bd`): All 7 main features with UI matching design specs

### Development Commands (Updated)
```bash
# Install dependencies (run first)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Key Implementation Notes

#### Pain Points Successfully Addressed
1. **✅ User Task Confusion**: My Tasks view auto-filters to current user only
2. **✅ Audit Log Limitations**: Database-based with unlimited records and rollback
3. **✅ Data Entry Errors**: Confirmation dialogs with change summaries
4. **✅ Progress Tracking**: Real-time visual progress indicators

#### Core Features Implemented
- **Dashboard**: Statistics cards, charts placeholders, todo items
- **Application Management**: Full CRUD, search/filter, progress tracking
- **My Tasks**: Smart filtering, urgency indicators, confirmation dialogs
- **Sub-task Management**: Master-detail view, progress tracking, blocking
- **Audit Log**: Unlimited records, diff view, rollback functionality
- **Batch Import**: 4-step wizard, validation, error reporting
- **Reports**: Multiple chart types, export options, department comparison

#### Latest Updates

**2025-10-20: MCP 功能完整实现**:
1. **✅ MCP Store 完整实现** (`src/stores/mcp.ts`):
   - 27个MCP工具的完整封装
   - 执行历史管理（最近100条记录）
   - AI功能状态管理
   - 健康检查和自动初始化
   - 完整的错误处理和用户反馈

2. **✅ MCP 类型定义完成** (`src/types/mcp.ts`):
   - 560+行完整的TypeScript类型定义
   - 所有27个工具的请求/响应类型
   - AI功能类型（报表生成、行动建议、查询分析）
   - 执行历史和状态管理类型

3. **✅ MCP UI 组件实现**:
   - `ApplicationDataRenderer.vue` - 应用数据渲染器（支持schema感知）
   - `MarkdownRenderer.vue` - Markdown渲染器（AI生成报告展示）
   - `TemplateFillResultRenderer.vue` - 模板填充结果显示
   - `MCPAgentView.vue` - MCP Agent完整界面（工具执行、自然语言查询）

4. **✅ 增强现有视图**:
   - `AuditView.vue` - 添加回滚功能，与MCP audit工具集成
   - `ReportsView.vue` - 添加AI洞察功能，支持自然语言报表生成
   - MCP API全面重构，支持所有27个工具

5. **✅ 文档完善**:
   - `docs/MCP_STREAMING_API_USAGE.md` - MCP流式API使用指南
   - `docs/汇报PPT内容.md` - 项目汇报材料
   - `docs/评委问答准备.md` - 答辩准备材料

**2025-09-17: Excel导入功能重大调整**:
1. **✅ 改为直接上传原始文件**: 不再进行客户端转换，直接发送原始Excel文件给后端
2. **✅ 保留中文列名**: 后端需要处理中文列名的映射
3. **✅ 双表支持**: 支持总追踪表（应用数据）和子追踪表（子任务数据）
4. **✅ 修复编译错误**: 解决TypeScript类型检查问题
5. **✅ 优化错误处理**: 改进导入失败时的错误提示

**Excel导出功能修复完成**:
1. **✅ 修复Excel导出下载问题**: 适配后端直接返回Excel文件数据
2. **✅ API字段映射修复**: 统一前后端字段命名规范
3. **✅ Blob下载优化**: 使用正确的MIME类型和文件处理
4. **✅ 移除Mock数据**: 完全使用真实API数据，无fallback

**API文档更新**:
- **新增详细API端点列表**: 包含所有实际使用的API端点和方法
- **更新认证说明**: 测试环境使用固定token
- **添加Excel导入说明**: 后端需要处理中文列名
- **文件下载优化**: 正确的blob处理和MIME类型设置
- **错误处理增强**: 改进API错误处理和用户反馈

#### Next Steps for Production
1. ✅ ~~Connect to real API endpoints~~ (已完成 - 使用真实API数据)
2. Add authentication guards and SSO integration
3. Implement real-time WebSocket updates
4. Add unit and E2E tests
5. Performance optimization for large datasets
6. Deploy to staging environment

#### Technical Stack Verified
- ✅ Vue 3 with Composition API
- ✅ TypeScript for type safety
- ✅ Element Plus UI components
- ✅ Pinia for state management
- ✅ Vue Router with lazy loading
- ✅ Axios for API calls
- ✅ Responsive design implementation

#### Ready for Review
The current implementation provides a fully functional frontend that addresses all identified pain points and includes all features specified in the UI design mockup. The codebase is ready for code review and further development.

## 开发流程规范

### 阶段1：Automate（自动化执行）
**目标**: 按节点执行 → 编写测试 → 实现代码 → 文档同步

#### 代码质量要求
- 严格遵循项目现有代码规范
- 保持与现有代码风格一致
- 使用项目现有的工具和库
- 复用项目现有组件
- 代码尽量精简易读
- API KEY 放到 .env 文件中

#### 逐步实施流程
每个子任务执行流程：

1. **执行前检查**：验证输入契约、环境准备、依赖满足
2. **实现核心逻辑**：按设计文档编写代码
3. **编写单元测试**：覆盖边界条件、异常情况
4. **运行验证测试**：确保功能正确
5. **更新相关文档**：保持文档同步

### 阶段2：Assess（评估阶段）
**目标**: 执行结果 → 质量评估 → 文档更新 → 交付确认

#### 质量评估指标
- **代码质量**：规范、可读性、复杂度
- **测试质量**：覆盖率、用例有效性
- **文档质量**：完整性、准确性、一致性
- **系统集成**：与现有系统良好集成
- **技术债务**：未引入新的技术债务

#### 最终交付物
- **FINAL_[任务名].md**：项目总结报告
- **TODO_[任务名].md**：待办事项和配置清单

## 开发规范与约定

### 代码风格统一
- 使用 Vue 3 Composition API
- TypeScript 严格类型检查
- Element Plus 组件优先
- SCSS 样式预处理器
- ESLint + Prettier 代码格式化

### 测试策略
```bash
# 单元测试
npm run test:unit

# 组件测试  
npm run test:component

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

### 文档维护
- 每个新功能必须更新 CLAUDE.md
- API 变更必须更新接口文档
- 组件库更新必须同步组件文档
- 部署流程变更必须更新部署文档

### 环境配置
```bash
# 开发环境
.env.development

# 测试环境
.env.test

# 生产环境
.env.production
```

### Git 工作流
1. 从 `master` 创建功能分支：`feature/任务名`
2. 按阶段1流程完成开发
3. 按阶段2流程完成评估
4. 提交PR请求代码审查
5. 合并到 `master` 分支

### 任务交付标准
每个任务完成后必须提供：
- ✅ 功能代码实现
- ✅ 单元测试用例
- ✅ 功能验证测试
- ✅ 相关文档更新
- ✅ FINAL_[任务名].md 总结报告
- ✅ TODO_[任务名].md 配置清单

## 测试配置

### API测试模式
为了方便开发和测试，前端已配置为跳过登录验证：

1. **固定Token**: 所有API请求使用固定测试token `Bearer token_1_admin_full_access_test_2024`
2. **虚拟用户**: 自动设置测试管理员用户信息
3. **跳过认证**: 无需登录即可访问所有页面
4. **WebSocket禁用**: 在后端未启动时禁用WebSocket连接

### 测试配置文件
- `/src/api/index.ts` - API基础配置，使用固定token
- `/src/stores/auth.ts` - 认证store，预设测试用户
- `/src/layouts/MainLayout.vue` - 主布局，跳过登录检查
- `/src/views/DashboardView.vue` - 禁用WebSocket连接

### 切换到生产模式
当后端准备就绪时，需要恢复以下功能：
1. 恢复动态token获取和刷新
2. 启用真实用户认证流程
3. 恢复WebSocket实时连接
4. 添加路由守卫和权限检查