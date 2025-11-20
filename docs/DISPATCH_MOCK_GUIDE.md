# 应用派发Mock功能 - 使用说明

## 📋 概述

这是一个**临时Mock解决方案**，用于在后端接口完善前，先让派发功能能够演示完整的流程：
- ✅ 派发应用
- ✅ 任务出现在"我的任务"中
- ✅ 显示派发通知提醒

## 🎯 工作原理

### 数据存储
使用浏览器的 `localStorage` 临时存储派发记录：
```javascript
localStorage.getItem('mock_dispatches')  // 获取派发记录
localStorage.setItem('mock_dispatches')  // 保存派发记录
```

### 数据流程

```
1. 用户在"应用管理"中点击"批量派发"
   ↓
2. dispatch.ts 保存派发记录到 localStorage:
   {
     id: "mock_1234567890_0.123",
     appId: "CI012473604",
     appName: "人工智能金融行业创新服务展示应用",
     taskName: "派发任务",
     status: "研发进行中" 或 "业务上线中",
     assigneeName: "测试管理员",
     dispatchedAt: "2025-10-31T10:30:00.000Z",
     ...
   }
   ↓
3. "我的任务"页面加载时:
   - 读取 localStorage 中的派发记录
   - 过滤出属于当前用户的记录
   - 转换为任务格式
   - 与后端返回的真实任务合并
   ↓
4. 显示在任务列表中（带 isMock: true 标记）
   ↓
5. 同时转换为通知格式，显示在页面顶部
```

## ✨ 功能特性

### 1. 自动过滤当前用户
只显示派发给当前登录用户（测试管理员）的任务和通知

### 2. 区分派发类型
- **开发负责人**: 任务状态显示为"研发进行中"
- **运维负责人**: 任务状态显示为"业务上线中"

### 3. 自动计算时间
- 默认计划完成时间：派发后7天
- 自动计算剩余天数
- 自动判断是否紧急（3天内）或逾期

### 4. 持久化存储
- 派发记录保存在localStorage，刷新页面不会丢失
- 自动保留最近10条派发记录

### 5. 通知管理
- 自动生成派发通知
- 点击"标记已读"可删除通知和对应任务

## 🚀 使用步骤

### 测试完整流程

1. **派发应用**
   ```
   1. 进入"应用管理"页面
   2. 勾选1个应用
   3. 点击"批量派发"
   4. 选择派发方式（开发/运维负责人）
   5. 派发给：测试管理员
   6. 确认派发
   ```

2. **查看任务**
   ```
   1. 点击左侧菜单"我的任务"
   2. 立即能看到新派发的任务
   3. 任务卡片显示：
      - 应用L2 ID 和名称
      - 任务名称："派发任务"
      - 状态：研发进行中/业务上线中
      - 计划完成时间：7天后
   ```

3. **查看通知**
   ```
   1. 页面顶部显示蓝色通知框
   2. 显示"您有 1 条新的任务派发通知"
   3. 内容包含：
      - 标题："您有新的任务派发"
      - 消息：应用名称和派发类型
      - 时间戳
   4. 点击"标记已读"可删除通知
   ```

4. **删除Mock记录**
   ```
   方式1: 点击通知的"标记已读"按钮
   方式2: 在浏览器控制台执行：
          localStorage.removeItem('mock_dispatches')
          然后刷新页面
   ```

## 📊 数据结构

### Mock派发记录
```typescript
interface MockDispatch {
  id: string                 // 如: "mock_1730371800000_0.123"
  appId: string             // 应用L2 ID
  appName: string           // 应用名称
  taskName: string          // 固定为"派发任务"
  status: string            // "研发进行中" 或 "业务上线中"
  progress: number          // 进度（默认0）
  plannedDate: string       // 计划完成日期（7天后）
  assigneeType: string      // 'dev' 或 'ops'
  assigneeName: string      // 受派人姓名
  message: string           // 派发说明
  dispatchedAt: string      // 派发时间（ISO格式）
  applicationId: number     // 应用数据库ID
}
```

### Mock通知
```typescript
interface MockNotification {
  id: string                // 如: "notif_mock_1730371800000_0.123"
  type: 'task_assignment'   // 固定类型
  title: string             // "您有新的任务派发"
  message: string           // 详细消息
  severity: 'medium'        // 固定为中等
  is_read: false            // 未读
  created_at: string        // 创建时间
  data: {
    appId: string
    appName: string
    assigneeType: string
  }
  isMock: true             // Mock标记
}
```

## 🔍 调试

### 查看Mock数据
在浏览器控制台执行：
```javascript
// 查看所有派发记录
JSON.parse(localStorage.getItem('mock_dispatches'))

// 查看第1条记录
JSON.parse(localStorage.getItem('mock_dispatches'))[0]

// 查看记录数量
JSON.parse(localStorage.getItem('mock_dispatches')).length
```

### 清空Mock数据
```javascript
// 清空所有派发记录
localStorage.removeItem('mock_dispatches')

// 然后刷新页面
location.reload()
```

### 控制台日志
派发时：
```
✅ [Mock] 已保存派发记录到本地: 1 条
```

加载任务时：
```
🔍 [Mock] 从本地加载派发记录: 1 条
✅ [Mock] 找到 1 个属于当前用户的mock任务
✅ [我的任务] 最终显示 1 个任务 (1 mock + 0 真实)
```

加载通知时：
```
✅ [Mock] 找到 1 条mock通知
✅ [通知] 最终显示 1 条任务派发通知 (1 mock + 0 真实)
```

## ⚠️ 限制和注意事项

### 1. 仅用于演示
这是临时方案，真实环境需要后端支持：
- 真实的派发API (`POST /api/v1/applications/dispatch`)
- 子任务的 `dev_owner` 和 `ops_owner` 字段正确返回
- 通知API正确实现 (`POST /api/v1/notifications/send`)

### 2. 数据不会同步
- Mock数据只存在浏览器本地
- 其他用户看不到
- 清空浏览器缓存会丢失

### 3. 最多保留10条
自动保留最近10条派发记录，旧记录会被删除

### 4. 任务数据简化
Mock任务的数据比真实任务简化：
- 没有实际的子任务ID
- 没有完整的子任务详情
- 点击"查看所有子任务"可能找不到对应数据

### 5. 通知限制
- Mock通知不会真正发送（404错误可以忽略）
- 标记已读会同时删除任务和通知
- 不支持邮件通知

## 🔄 切换到真实API

当后端准备好后，执行以下步骤：

### 步骤1: 禁用Mock模式
修改 `src/api/dispatch.ts`:
```typescript
// 第21行
const USE_MOCK = false  // 改为 false
```

### 步骤2: 清空Mock数据
```javascript
localStorage.removeItem('mock_dispatches')
```

### 步骤3: 移除Mock代码
搜索 `🔧 临时Mock` 注释，移除相关代码：
- `dispatch.ts` 第90-118行
- `MyTasksView.vue` 第413-449行
- `MyTasksView.vue` 第525-553行
- `MyTasksView.vue` 第571-584行

### 步骤4: 验证后端接口
确保后端实现：
```
POST /api/v1/applications/dispatch
  - 更新应用的 dev_owner / ops_owner
  - 更新所有子任务的 dev_owner / ops_owner
  - 发送通知

GET /api/v1/subtasks
  - 返回数据包含 dev_owner 和 ops_owner 字段

POST /api/v1/notifications/send
  - 创建通知记录

GET /api/v1/notifications
  - 返回格式: {total, unread_count, items: [...]}
```

## 📝 测试清单

- [ ] 派发开发负责人 → 任务显示为"研发进行中"
- [ ] 派发运维负责人 → 任务显示为"业务上线中"
- [ ] 派发后立即在"我的任务"中看到
- [ ] 页面顶部显示蓝色通知框
- [ ] 通知内容正确（应用名称、派发类型）
- [ ] 点击"标记已读"后通知和任务都消失
- [ ] 刷新页面后任务和通知仍然存在
- [ ] 只显示派发给当前用户的任务
- [ ] 控制台日志显示mock标记
- [ ] 清空localStorage后任务消失

## 📚 相关文档

- `docs/DISPATCH_TEST_GUIDE.md` - 完整测试指南
- `docs/DISPATCH_QUICK_TEST.md` - 快速测试步骤
- `docs/DISPATCH_IMPROVEMENTS_SUMMARY.md` - 改动总结
- `docs/DISPATCH_FEATURE_SUMMARY.md` - 功能总结

## 🎯 常见问题

### Q: 为什么要用Mock而不是真实数据？
A: 因为后端返回的子任务数据中 `dev_owner` 和 `ops_owner` 是 `undefined`，导致无法正确过滤任务。Mock方案可以先让流程跑通，演示效果。

### Q: Mock数据会影响真实数据吗？
A: 不会。Mock数据只存在浏览器localStorage中，不会发送到后端，也不会影响数据库。

### Q: 可以派发给其他用户吗？
A: 可以选择其他人员名称，但只有当前登录用户（测试管理员）能看到派发给自己的mock任务。

### Q: Mock任务可以编辑吗？
A: 不建议编辑。点击"编辑"按钮可能找不到对应的真实子任务数据。建议只用于查看和演示。

### Q: 如何知道是Mock任务还是真实任务？
A: 查看控制台日志，会显示 "X mock + Y 真实"。也可以在数据对象中看到 `isMock: true` 字段。

## 🚧 已知问题

1. **通知API 404错误**: 后端未实现，可以忽略
2. **子任务字段undefined**: 后端返回的数据缺少owner字段
3. **点击编辑可能失败**: Mock任务没有真实的子任务ID
4. **数据不同步**: 仅本地存储，多用户无法共享

这些问题将在后端完善后自动解决。

---

**最后更新**: 2025-10-31
**版本**: v1.0 (临时Mock方案)
**状态**: ✅ 可用于演示
