# TODO_AKCN_FRONTEND_CONFIGURATION.md

## 📋 待办事项和配置清单

**项目**: AK云原生改造管理系统 - 前端  
**创建日期**: 2025年1月15日  
**状态**: 开发完成，等待生产部署配置  

---

## 🚀 部署前必须配置项

### **1. 环境变量配置**
#### ⚠️ **生产环境 (.env.production)**
```bash
# 需要配置真实的生产环境值
VITE_API_BASE_URL=https://ak-transform.company.com/api/v1
VITE_SSO_BASE_URL=https://sso.company.com
VITE_WS_BASE_URL=wss://ak-transform.company.com/ws

# ❗ 重要：需要填入真实的API密钥
VITE_API_KEY=【待配置】
VITE_SSO_CLIENT_ID=akcn_frontend_prod
VITE_SSO_CLIENT_SECRET=【待配置】

VITE_ENABLE_MOCK=false
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_DEBUG_LOG=false
```

#### **测试环境 (.env.test)**
```bash
# 测试环境API地址
VITE_API_BASE_URL=https://test-ak-transform.company.com/api/v1
VITE_SSO_BASE_URL=https://test-sso.company.com

# ❗ 需要测试环境的API密钥
VITE_API_KEY=【待配置】
VITE_SSO_CLIENT_ID=akcn_frontend_test
VITE_SSO_CLIENT_SECRET=【待配置】
```

---

## 🔧 后端集成配置

### **2. API端点确认清单**
需要后端团队确认以下API端点是否已实现：

#### **认证相关**
- [ ] `POST /sso/verify` - SSO令牌验证
- [ ] `POST /sso/refresh` - 令牌刷新
- [ ] `POST /sso/logout` - 退出登录

#### **应用管理**  
- [ ] `GET /applications` - 获取应用列表
- [ ] `GET /applications/:id` - 获取单个应用
- [ ] `POST /applications` - 创建应用
- [ ] `PUT /applications/:id` - 更新应用
- [ ] `DELETE /applications/:id` - 删除应用

#### **子任务管理**
- [ ] `GET /applications/:id/subtasks` - 获取子任务
- [ ] `POST /applications/:id/subtasks` - 创建子任务
- [ ] `PUT /subtasks/:id` - 更新子任务
- [ ] `DELETE /subtasks/:id` - 删除子任务

#### **审计日志**
- [ ] `GET /audit/logs` - 获取审计日志
- [ ] `POST /audit/rollback/:id` - 回滚操作

#### **批量操作**
- [ ] `POST /batch/import` - 批量导入
- [ ] `GET /batch/import/:id/status` - 导入状态
- [ ] `GET /reports/export` - 数据导出

---

## 📦 npm 依赖安装

### **3. 安装命令清单**
```bash
# 安装所有依赖
npm install

# 验证关键依赖
npm list vue element-plus pinia vue-router axios

# 开发依赖验证
npm list vitest cypress eslint prettier
```

### **4. 构建和部署验证**
```bash
# 类型检查
npm run type-check

# 代码规范检查
npm run lint

# 生产构建
npm run build

# 构建预览
npm run preview
```

---

## 🌐 Nginx 部署配置

### **5. Nginx 配置示例**
```nginx
server {
    listen 80;
    server_name ak-frontend.company.com;
    
    # 静态文件服务
    location / {
        root /var/www/akcn-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理配置
    location /api/ {
        proxy_pass https://ak-transform.company.com/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket代理
    location /ws/ {
        proxy_pass wss://ak-transform.company.com/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔐 SSL/HTTPS 配置

### **6. SSL 证书配置**
```nginx
server {
    listen 443 ssl http2;
    server_name ak-frontend.company.com;
    
    # ❗ 需要配置SSL证书路径
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 其他配置同上...
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name ak-frontend.company.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🧪 测试配置

### **7. 测试环境搭建**
```bash
# 单元测试运行
npm run test:unit

# E2E测试配置（需要先启动开发服务器）
npm run dev &
npm run test:e2e

# 测试覆盖率报告
npm run test:coverage
```

### **8. 测试用例待补充**
需要编写以下测试用例：
- [ ] 用户认证流程测试
- [ ] 应用CRUD操作测试  
- [ ] "我的任务"功能测试
- [ ] 审计日志功能测试
- [ ] 批量导入流程测试
- [ ] 数据导出功能测试

---

## 📊 监控和性能

### **9. 性能监控配置**
需要集成以下监控工具：
- [ ] **错误监控**: Sentry 或类似服务
- [ ] **性能监控**: Web Vitals 收集
- [ ] **用户行为**: Google Analytics 或内部统计
- [ ] **API监控**: 接口响应时间和成功率

### **10. 性能优化清单**
- [ ] 启用 Gzip 压缩
- [ ] 配置 CDN 加速静态资源
- [ ] 实现图片懒加载
- [ ] 添加 Service Worker 缓存策略

---

## 🔄 CI/CD 流水线

### **11. 自动化部署配置**
需要配置以下流水线：

#### **GitHub Actions 示例**
```yaml
name: Deploy AKCN Frontend
on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run type-check
      - run: npm run lint  
      - run: npm run build
      - run: npm run test:unit
      # 部署到生产环境
```

---

## 👥 团队协作配置

### **12. 开发团队设置**
需要配置的权限和访问：
- [ ] **代码仓库权限**: 开发团队成员访问权限
- [ ] **部署权限**: DevOps团队部署权限  
- [ ] **监控权限**: 运维团队监控访问权限
- [ ] **API文档访问**: 前后端团队共享文档

### **13. 代码审查流程**
- [ ] 设置PR模板
- [ ] 配置代码审查规则
- [ ] 设置自动化检查（lint, test, build）
- [ ] 配置分支保护策略

---

## 🚨 安全配置

### **14. 安全配置清单**
- [ ] **内容安全策略** (CSP)
- [ ] **跨域资源共享** (CORS)
- [ ] **XSS防护** 配置
- [ ] **敏感信息过滤** 验证
- [ ] **API密钥轮换** 策略

---

## 📞 技术支持联系

### **15. 关键联系人**
- **前端开发**: Claude Code AI Assistant
- **后端API**: 【待指定】
- **DevOps**: 【待指定】  
- **产品负责人**: 【待指定】

### **16. 紧急问题处理**
- 生产环境问题处理流程
- 回滚策略和步骤
- 监控告警联系人
- 24/7支持联系方式

---

## ✅ 配置完成验证

完成上述配置后，请验证以下检查点：
- [ ] 生产环境可正常访问
- [ ] SSO认证流程正常
- [ ] 所有API接口连通
- [ ] 数据导入导出功能正常
- [ ] 审计日志记录正常
- [ ] 性能监控数据收集正常
- [ ] SSL证书有效且自动续期

---

**最后更新**: 2025年1月15日  
**状态**: 等待配置完成  
**优先级**: 高 - 生产部署前必须完成

*🚀 Generated with Claude Code (claude.ai/code)*  
*Co-Authored-By: Claude <noreply@anthropic.com>*