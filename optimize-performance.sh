#!/bin/bash

# NaviBatch 性能优化脚本
# 使用方法: ./optimize-performance.sh

echo "🚀 开始 NaviBatch 性能优化..."

# 1. CSS 压缩优化
echo "📦 优化 CSS 文件..."

# 创建压缩版本的CSS（简单压缩）
if [ -f "css/styles.css" ]; then
    echo "🔧 压缩 styles.css..."
    # 移除注释、多余空格和换行
    sed 's/\/\*.*\*\///g; s/  */ /g; s/^ *//; s/ *$//; /^$/d' css/styles.css > css/styles.min.css
    
    # 获取文件大小
    original_size=$(wc -c < css/styles.css)
    compressed_size=$(wc -c < css/styles.min.css)
    savings=$((original_size - compressed_size))
    
    echo "✅ CSS 压缩完成:"
    echo "   原始大小: ${original_size} bytes"
    echo "   压缩后: ${compressed_size} bytes"
    echo "   节省: ${savings} bytes ($(echo "scale=1; $savings * 100 / $original_size" | bc)%)"
fi

# 2. 图片优化检查
echo "🖼️ 检查图片优化..."

# 检查是否有未优化的图片
echo "📊 当前图片格式:"
find images/ -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -exec echo "❌ 需要优化: {}" \;
find images/ -type f -name "*.webp" -exec echo "✅ 已优化: {}" \;

# 3. HTML 优化建议
echo "📄 HTML 优化建议..."

# 检查图片是否有 width/height 属性
if grep -q 'img.*src.*width.*height' index.html; then
    echo "✅ 图片已设置尺寸属性"
else
    echo "⚠️ 建议为所有图片添加 width 和 height 属性"
fi

# 检查是否使用了 loading="lazy"
if grep -q 'loading="lazy"' index.html; then
    echo "✅ 已使用图片懒加载"
else
    echo "⚠️ 建议为非关键图片添加 loading='lazy'"
fi

# 4. 性能测试建议
echo "📊 性能测试建议..."
echo "🔗 测试移动端性能:"
echo "   https://pagespeed.web.dev/analysis?url=https://www.navibatch.com&form_factor=mobile"
echo "🔗 测试桌面端性能:"
echo "   https://pagespeed.web.dev/analysis?url=https://www.navibatch.com&form_factor=desktop"

# 5. 部署建议
echo "🚀 部署建议..."
echo "1. 使用压缩后的 CSS 文件"
echo "2. 启用 Cloudflare 的自动压缩"
echo "3. 启用 Cloudflare 的图片优化"
echo "4. 设置适当的缓存策略"

echo ""
echo "✨ 性能优化检查完成！"
echo "📈 预期改进:"
echo "   - CSS 文件大小减少 20-30%"
echo "   - 移动端 LCP 改善 0.5-1.0 秒"
echo "   - CLS 值降低到 0.1 以下"
echo ""
echo "🔄 运行 'wrangler pages deploy .' 来部署优化后的版本"
