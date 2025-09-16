# MainLayout 通知组件错误修复

## 问题描述
MainLayout.vue 中出现 `Cannot read properties of undefined (reading 'length')` 错误，发生在尝试访问 `notifications.length` 时。

## 错误原因
在模板渲染时，`notifications` 数组可能尚未初始化或为 `undefined`，导致访问其 `length` 属性时抛出错误。

## 修复方案

### 1. 添加空值检查
在模板中所有访问 `notifications` 的地方添加空值检查：

```vue
<!-- 修复前 -->
<div v-if="notifications.length === 0">

<!-- 修复后 -->
<div v-if="!notifications || notifications.length === 0">
```

### 2. 使用可选链和默认值
在 v-for 循环中使用默认空数组：

```vue
<!-- 修复前 -->
v-for="notification in notifications.slice(0, 5)"

<!-- 修复后 -->
v-for="notification in (notifications || []).slice(0, 5)"
```

### 3. API响应处理
确保API响应始终返回数组：

```javascript
// 修复前
notifications.value = response.items
notificationCount.value = response.unread_count

// 修复后
notifications.value = response.items || []
notificationCount.value = response.unread_count || 0
```

## 修改文件
- `src/layouts/MainLayout.vue` - 行 31、34、41，添加空值检查
- `src/layouts/MainLayout.vue` - 行 253-254，确保响应数据为数组

## 测试验证
1. 开发服务器已启动在 http://localhost:3001
2. 访问应用，点击通知图标
3. 确认不再出现 undefined 错误
4. 通知下拉菜单正常显示

## 预防措施
1. 始终为数组类型的响应式数据设置默认值
2. 在模板中访问对象属性前进行空值检查
3. API响应处理时使用默认值兜底

---
**修复状态**: ✅ 已完成
**测试地址**: http://localhost:3001