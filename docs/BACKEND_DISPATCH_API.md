# 后端API实现文档 - 应用派发功能

## 概述

前端已实现完整的派发功能UI，使用Mock模式可以测试。后端需要实现派发API接口以支持完整功能。

## 当前状态

- ✅ 前端UI已完成
- ✅ 前端使用Mock模式测试（临时）
- ⚠️ 后端API待实现
- 📝 Token: `token_1_admin_full_access_test_2024`
- 👤 默认测试用户: `测试管理员`

## 需要实现的API端点

### 1. 派发应用接口

**端点**: `POST /api/v1/applications/dispatch`

**请求头**:
```
Authorization: Bearer token_1_admin_full_access_test_2024
Content-Type: application/json
```

**请求体**:
```json
{
  "application_ids": [1, 2, 3],
  "assignee_name": "测试管理员",
  "assignee_type": "dev",  // "dev" 或 "ops"
  "message": "请尽快完成改造任务"  // 可选
}
```

**响应**:
```json
{
  "success": 3,
  "failed": 0,
  "notification_sent": true,
  "dispatched_applications": [
    {
      "id": 1,
      "l2_id": "CI001",
      "app_name": "支付系统",
      "dev_owner": "测试管理员",  // 已更新
      "ops_owner": "待分配",
      // ... 其他字段
    },
    // ... 更多应用
  ]
}
```

**错误响应**:
```json
{
  "detail": "错误信息",
  "error_code": "DISPATCH_FAILED"
}
```

**HTTP状态码**:
- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 404: 应用不存在
- 500: 服务器错误

## 后端实现逻辑

### Python FastAPI 实现示例

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/applications", tags=["applications"])

# ==================== 数据模型 ====================

class DispatchRequest(BaseModel):
    application_ids: List[int]
    assignee_name: str
    assignee_type: str  # "dev" or "ops"
    message: str = None

class DispatchResponse(BaseModel):
    success: int
    failed: int
    notification_sent: bool
    dispatched_applications: List[dict]

# ==================== API端点 ====================

@router.post("/dispatch", response_model=DispatchResponse)
async def dispatch_applications(
    request: DispatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    派发应用给指定人员

    功能：
    1. 更新applications表的dev_owner或ops_owner
    2. 更新相关subtasks表的assigned_to
    3. 创建审计日志
    4. 发送系统通知
    """

    # 1. 参数验证
    if request.assignee_type not in ["dev", "ops"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="assignee_type必须是'dev'或'ops'"
        )

    if not request.application_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="application_ids不能为空"
        )

    # 2. 查询应用是否存在
    applications = db.query(Application).filter(
        Application.id.in_(request.application_ids)
    ).all()

    if not applications:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到指定的应用"
        )

    dispatched_apps = []
    failed_count = 0

    # 3. 批量更新应用负责人
    for app in applications:
        try:
            # 记录旧值（用于审计）
            old_owner = app.dev_owner if request.assignee_type == "dev" else app.ops_owner

            # 更新负责人
            if request.assignee_type == "dev":
                app.dev_owner = request.assignee_name
            else:
                app.ops_owner = request.assignee_name

            app.updated_by = current_user.id
            app.updated_at = datetime.utcnow()

            # 4. 更新相关子任务的负责人
            subtasks = db.query(SubTask).filter(
                SubTask.application_id == app.id
            ).all()

            for subtask in subtasks:
                subtask.assigned_to = request.assignee_name
                subtask.updated_by = current_user.id
                subtask.updated_at = datetime.utcnow()

            # 5. 创建审计日志
            audit_log = AuditLog(
                table_name="applications",
                operation="UPDATE",
                record_id=app.id,
                old_values={
                    "dev_owner" if request.assignee_type == "dev" else "ops_owner": old_owner
                },
                new_values={
                    "dev_owner" if request.assignee_type == "dev" else "ops_owner": request.assignee_name
                },
                user_id=current_user.id,
                action_type="DISPATCH",
                description=f"派发应用给{request.assignee_name}（{request.assignee_type}）"
            )
            db.add(audit_log)

            dispatched_apps.append(app)

        except Exception as e:
            print(f"Failed to dispatch application {app.id}: {e}")
            failed_count += 1
            continue

    # 6. 提交数据库事务
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库更新失败: {str(e)}"
        )

    # 7. 发送通知
    notification_sent = False
    try:
        notification = Notification(
            type="task_assignment",
            title="您有新的任务派发",
            message=request.message or f"您被分配了 {len(dispatched_apps)} 个应用的{'开发' if request.assignee_type == 'dev' else '运维'}任务，请及时查看并填写进展。",
            severity="medium",
            user_name=request.assignee_name,
            is_read=False,
            data={
                "application_ids": [app.id for app in dispatched_apps],
                "assignee_type": request.assignee_type,
                "dispatcher": current_user.username
            }
        )
        db.add(notification)
        db.commit()
        notification_sent = True
    except Exception as e:
        print(f"Failed to send notification: {e}")

    # 8. 返回结果
    return DispatchResponse(
        success=len(dispatched_apps),
        failed=failed_count,
        notification_sent=notification_sent,
        dispatched_applications=[
            app.to_dict() for app in dispatched_apps
        ]
    )


@router.get("/{application_id}/dispatch-history")
async def get_dispatch_history(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取应用的派发历史记录
    """

    # 查询审计日志
    history = db.query(AuditLog).filter(
        AuditLog.table_name == "applications",
        AuditLog.record_id == application_id,
        AuditLog.action_type == "DISPATCH"
    ).order_by(AuditLog.created_at.desc()).all()

    return [log.to_dict() for log in history]
```

## 数据库更新

### 1. Applications表

```sql
-- 更新负责人字段
UPDATE applications
SET
  dev_owner = '测试管理员',  -- 如果assignee_type = 'dev'
  -- 或
  ops_owner = '测试管理员',  -- 如果assignee_type = 'ops'
  updated_by = 1,
  updated_at = NOW()
WHERE id IN (1, 2, 3);
```

### 2. SubTasks表

```sql
-- 更新所有相关子任务的负责人
UPDATE subtasks
SET
  assigned_to = '测试管理员',
  updated_by = 1,
  updated_at = NOW()
WHERE application_id IN (1, 2, 3);
```

### 3. AuditLogs表

```sql
-- 创建审计日志
INSERT INTO audit_logs (
  table_name, operation, record_id,
  old_values, new_values, user_id,
  action_type, description, created_at
) VALUES (
  'applications', 'UPDATE', 1,
  '{"dev_owner": "张三"}',
  '{"dev_owner": "测试管理员"}',
  1,
  'DISPATCH',
  '派发应用给测试管理员（dev）',
  NOW()
);
```

### 4. Notifications表

```sql
-- 创建通知记录
INSERT INTO notifications (
  type, title, message, severity,
  user_name, is_read, data, created_at
) VALUES (
  'task_assignment',
  '您有新的任务派发',
  '您被分配了 3 个应用的开发任务，请及时查看并填写进展。',
  'medium',
  '测试管理员',
  false,
  '{"application_ids": [1, 2, 3], "assignee_type": "dev", "dispatcher": "admin"}',
  NOW()
);
```

## 权限控制

### 派发权限要求

```python
def check_dispatch_permission(user: User, applications: List[Application]):
    """
    检查用户是否有派发权限

    规则：
    1. 管理员可以派发所有应用
    2. 项目经理可以派发自己负责的项目
    3. 普通用户不能派发
    """

    if user.role in ["admin", "manager"]:
        return True

    # 检查是否是项目负责人
    for app in applications:
        if app.dev_owner != user.username and app.ops_owner != user.username:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"您没有权限派发应用: {app.app_name}"
            )

    return True
```

## 测试用例

### 测试1: 成功派发单个应用

```bash
curl -X POST "http://localhost:8000/api/v1/applications/dispatch" \
  -H "Authorization: Bearer token_1_admin_full_access_test_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "application_ids": [1],
    "assignee_name": "测试管理员",
    "assignee_type": "dev",
    "message": "请尽快完成"
  }'
```

**期望结果**:
- HTTP 200
- success: 1, failed: 0
- application的dev_owner已更新为"测试管理员"
- 相关subtasks的assigned_to已更新
- 创建了审计日志
- 创建了通知记录

### 测试2: 批量派发多个应用

```bash
curl -X POST "http://localhost:8000/api/v1/applications/dispatch" \
  -H "Authorization: Bearer token_1_admin_full_access_test_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "application_ids": [1, 2, 3, 4, 5],
    "assignee_name": "测试管理员",
    "assignee_type": "ops"
  }'
```

### 测试3: 错误处理 - 应用不存在

```bash
curl -X POST "http://localhost:8000/api/v1/applications/dispatch" \
  -H "Authorization: Bearer token_1_admin_full_access_test_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "application_ids": [999999],
    "assignee_name": "测试管理员",
    "assignee_type": "dev"
  }'
```

**期望结果**:
- HTTP 404
- 错误消息: "未找到指定的应用"

### 测试4: 查询派发历史

```bash
curl -X GET "http://localhost:8000/api/v1/applications/1/dispatch-history" \
  -H "Authorization: Bearer token_1_admin_full_access_test_2024"
```

## 前端Mock模式切换

当后端API实现完成后，修改前端代码：

**文件**: `src/api/dispatch.ts`

```typescript
// 第20行，将USE_MOCK改为false
const USE_MOCK = false // ✅ 切换为真实API
```

## 验证清单

后端实现完成后，请验证：

- [ ] `/applications/dispatch` 端点返回正确响应
- [ ] `dev_owner` 或 `ops_owner` 字段正确更新
- [ ] 相关 `subtasks` 的 `assigned_to` 字段正确更新
- [ ] 创建了审计日志记录
- [ ] 创建了通知记录
- [ ] 前端可以正常派发并显示成功消息
- [ ] "我的任务"页面显示派发的任务
- [ ] 通知系统显示派发通知

## 常见问题

**Q: 派发后任务不在"我的任务"中显示？**
A: 检查以下内容：
1. subtasks的assigned_to字段是否正确更新
2. 用户名是否完全匹配（注意空格和大小写）
3. 任务状态是否为"已完成"（已完成任务不显示）

**Q: 通知没有发送？**
A: 检查：
1. notifications表是否有记录
2. type字段是否为"task_assignment"
3. user_name是否正确
4. is_read字段是否为false

**Q: 批量派发时部分失败？**
A: 这是正常的，API会返回success和failed数量。检查日志了解失败原因。

## 技术支持

- 前端代码: `src/api/dispatch.ts`
- 前端文档: `docs/DISPATCH_FEATURE_SUMMARY.md`
- Token: `token_1_admin_full_access_test_2024`
- 测试用户: `测试管理员`

---

**文档版本**: 1.0.0
**最后更新**: 2024-10-31
**维护人员**: 后端开发团队
