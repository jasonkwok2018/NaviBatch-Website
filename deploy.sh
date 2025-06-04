#!/bin/bash

# NaviBatch Homepage 自动部署脚本
# 使用方法: ./deploy.sh

echo "🚀 开始部署 NaviBatch Homepage..."

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 请在 navibatch_homepage 目录中运行此脚本"
    exit 1
fi

# 部署到 Cloudflare Pages
echo "📤 正在部署到 Cloudflare Pages..."
wrangler pages deploy . --project-name="navibatch-homepage" --commit-dirty=true

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo "🌐 网站地址: https://navibatch-homepage.pages.dev"
    echo "🌐 自定义域名: https://www.navibatch.com"
    
    echo ""
    echo "🔄 等待5秒后测试性能..."
    sleep 5
    
    echo "📊 正在测试移动端性能..."
    # 这里可以添加性能测试命令
    
else
    echo "❌ 部署失败，请检查错误信息"
    exit 1
fi
