#!/bin/bash

# 云原生改造成果板块验证脚本
# 此脚本用于验证所有配置是否正确

echo "========================================"
echo "云原生改造成果板块配置验证"
echo "========================================"
echo ""

# 检查 1: 组件文件存在
echo "✓ 检查 1: 组件文件"
if [ -f "src/views/CloudNativeView.vue" ]; then
    echo "  ✅ CloudNativeView.vue 存在"
    LINE_COUNT=$(wc -l < "src/views/CloudNativeView.vue")
    echo "     文件行数: $LINE_COUNT"
else
    echo "  ❌ CloudNativeView.vue 不存在"
fi
echo ""

# 检查 2: 路由配置
echo "✓ 检查 2: 路由配置"
if grep -q "cloud-native" "src/router/index.ts"; then
    echo "  ✅ 路由已配置"
    grep -A 3 "cloud-native" "src/router/index.ts" | head -4 | sed 's/^/     /'
else
    echo "  ❌ 路由未配置"
fi
echo ""

# 检查 3: 权限配置
echo "✓ 检查 3: 权限配置"
if grep -q "'CloudNative'" "src/utils/permissions.ts"; then
    echo "  ✅ 权限已配置"
    grep "CloudNative" "src/utils/permissions.ts" | sed 's/^/     /'
else
    echo "  ❌ 权限未配置"
fi
echo ""

# 检查 4: 菜单配置
echo "✓ 检查 4: 菜单配置"
if grep -q "CloudNative" "src/layouts/MainLayout.vue"; then
    echo "  ✅ 菜单已配置"
    MENU_COUNT=$(grep -c "CloudNative" "src/layouts/MainLayout.vue")
    echo "     CloudNative 引用次数: $MENU_COUNT"
else
    echo "  ❌ 菜单未配置"
fi
echo ""

# 检查 5: 图标导入
echo "✓ 检查 5: 图标导入"
if grep -q "TrendCharts" "src/layouts/MainLayout.vue"; then
    echo "  ✅ TrendCharts 图标已导入"
    grep "import.*TrendCharts" "src/layouts/MainLayout.vue" | sed 's/^/     /'
else
    echo "  ⚠️  TrendCharts 图标未找到，检查其他图标..."
    grep "import.*from '@element-plus/icons-vue'" "src/layouts/MainLayout.vue" | sed 's/^/     /'
fi
echo ""

# 检查 6: 文档
echo "✓ 检查 6: 文档"
if [ -f "docs/CLOUD_NATIVE_INTEGRATION.md" ]; then
    echo "  ✅ 集成文档存在"
fi
if [ -f "docs/CLOUD_NATIVE_TROUBLESHOOTING.md" ]; then
    echo "  ✅ 故障排查文档存在"
fi
echo ""

# 总结
echo "========================================"
echo "验证完成！"
echo "========================================"
echo ""
echo "下一步操作："
echo "1. 重启开发服务器: npm run dev"
echo "2. 清除浏览器缓存（Ctrl + Shift + R）"
echo "3. 访问: http://localhost:5173/cloud-native"
echo "4. 检查侧边栏"数据管理"分组下是否有"云原生改造成果"菜单项"
echo ""
echo "如果仍然无法显示，请查看："
echo "- docs/CLOUD_NATIVE_TROUBLESHOOTING.md"
echo ""
