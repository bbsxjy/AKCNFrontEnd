# 项目更名记录

## 变更概要

**更名日期**: 2025-10-21

**旧名称**: AK云原生改造管理系统 (AK Cloud-Native Transformation Management System)

**新名称**: 项目协同管理应用 (IT Engineering Project Collaboration Platform)

## 更名原因

原名称"AK云原生改造管理系统"过于聚焦于特定场景（AK改造），不适应平台的多场景定位。

该平台实际用途包括但不限于：
- ✅ AK云原生改造项目
- ✅ 分公司治理项目
- ✅ 系统下线跟踪
- ✅ 系统整合工程
- ✅ 信创改造项目
- ✅ 其他IT工程项目

新名称"项目协同管理应用"更通用、更符合平台的实际定位。

## 已更新的文件清单

### 核心配置文件
- ✅ `package.json` - 项目名称、版本、描述
- ✅ `index.html` - 网页标题
- ✅ `CLAUDE.md` - 项目文档概述

### 环境配置文件
- ✅ `.env.development` - 开发环境配置
- ✅ `.env.production` - 生产环境配置
- ✅ `.env.test` - 测试环境配置

### UI组件
- ✅ `src/layouts/MainLayout.vue` - 主布局页面标题
  - 桌面端：项目协同管理应用
  - 移动端：项目协同管理

### 文档文件
- ✅ `docs/PROJECT_RENAME.md` - 本文档

## 具体变更内容

### 1. package.json

```diff
- "name": "akcn-frontend",
- "version": "0.0.0",
+ "name": "project-collaboration-management",
+ "version": "1.0.0",
+ "description": "项目协同管理应用 - IT Engineering Project Collaboration Platform",
```

### 2. index.html

```diff
- <title>AK云原生改造管理系统</title>
+ <title>项目协同管理应用</title>
```

### 3. CLAUDE.md

```diff
- AKCNFrontEnd is the frontend application for the AK Cloud-Native
- Transformation Management System (AK云原生改造管理系统).
+ ProjectCollaborationManagement is the frontend application for the
+ IT Engineering Project Collaboration Platform (项目协同管理应用).
```

### 4. 环境变量 (.env.*)

```diff
- VITE_APP_TITLE=AK云原生改造管理系统
- VITE_SSO_CLIENT_ID=akcn_frontend_*
- VITE_API_BASE_URL=https://ak-transform.company.com/api/v1
+ VITE_APP_TITLE=项目协同管理应用
+ VITE_SSO_CLIENT_ID=project_collab_frontend_*
+ VITE_API_BASE_URL=https://project-collab.company.com/api/v1
```

### 5. MainLayout.vue

```diff
- <span>AK云原生改造管理应用</span>
+ <span>项目协同管理应用</span>（桌面端）
+ <span>项目协同管理</span>（移动端）
```

## 英文标识符变更

| 旧标识符 | 新标识符 | 说明 |
|---------|---------|------|
| `akcn-frontend` | `project-collaboration-management` | NPM包名 |
| `akcn_frontend_dev` | `project_collab_frontend_dev` | SSO客户端ID（开发）|
| `akcn_frontend_test` | `project_collab_frontend_test` | SSO客户端ID（测试）|
| `akcn_frontend_prod` | `project_collab_frontend_prod` | SSO客户端ID（生产）|
| `ak-transform.company.com` | `project-collab.company.com` | 域名（生产）|
| `test-ak-transform.company.com` | `test-project-collab.company.com` | 域名（测试）|

## 后续需要配置的事项

### 1. 服务器/基础设施
- [ ] 更新域名配置：`project-collab.company.com`
- [ ] 更新DNS记录
- [ ] 更新SSL证书（如果域名变更）
- [ ] 更新Nginx配置

### 2. SSO集成
- [ ] 在SSO系统中注册新的客户端ID：
  - `project_collab_frontend_dev`
  - `project_collab_frontend_test`
  - `project_collab_frontend_prod`
- [ ] 更新回调URL配置
- [ ] 更新退出URL配置

### 3. 后端配置
- [ ] 更新CORS白名单（新域名）
- [ ] 更新API文档中的系统名称
- [ ] 更新数据库注释/文档
- [ ] 更新日志系统中的应用标识

### 4. 监控/日志系统
- [ ] 更新APM应用名称
- [ ] 更新日志聚合系统的应用标识
- [ ] 更新告警规则中的应用名称

### 5. 文档更新
- [ ] 更新用户手册
- [ ] 更新运维文档
- [ ] 更新架构图/流程图
- [ ] 更新培训材料

### 6. Git仓库（可选）
- [ ] 考虑是否需要更新仓库名称
- [ ] 更新README.md（当前不存在）
- [ ] 更新Git描述信息

## 注意事项

1. **向后兼容性**:
   - 旧的客户端ID（`akcn_frontend_*`）可能仍在使用中
   - 建议保留一段时间的双配置，逐步迁移

2. **通信计划**:
   - 提前通知所有用户系统名称变更
   - 更新帮助文档和支持材料
   - 准备FAQ应对用户疑问

3. **测试验证**:
   - 在测试环境完整验证所有功能
   - 确认SSO登录流程正常
   - 确认API调用正常
   - 确认WebSocket连接正常

## 版本历史

| 版本 | 日期 | 说明 |
|-----|------|------|
| 0.x.x | 2024-09 至 2025-10 | AK云原生改造管理系统 |
| 1.0.0 | 2025-10-21 | 更名为"项目协同管理应用" |

---

**更新人**: Claude Code
**审核人**: [待填写]
**批准人**: [待填写]
