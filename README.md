# NaviBatch Website

NaviBatch官方网站，包含产品介绍、隐私政策和使用条款。

## 🌐 网站功能

- **产品介绍页面** - 展示NaviBatch应用功能
- **多语言支持** - 支持20+种语言
- **隐私政策** - 符合App Store要求
- **使用条款** - 法律合规文档
- **联系支持** - 用户反馈渠道

## 📁 项目结构

```
├── index.html              # 主页
├── privacy.html            # 隐私政策（英文）
├── terms.html              # 使用条款
├── support.html            # 支持页面
├── css/                    # 样式文件
├── js/                     # JavaScript文件
├── images/                 # 图片资源
├── privacy-*.html          # 多语言隐私政策
├── support-*.html          # 多语言支持页面
└── navibatch-*-worker/     # Cloudflare Workers
```

## 🚀 部署

网站部署在Cloudflare Pages上：
- **生产环境**: https://navibatch.com
- **自动部署**: 推送到main分支自动部署

## 🔧 开发

### 本地开发
```bash
# 启动本地服务器
python -m http.server 8000
# 或使用Node.js
npx serve .
```

### 性能优化
```bash
# 运行性能优化脚本
./optimize-performance.sh
```

## 📱 相关项目

- **iOS应用**: [NaviBatch](https://github.com/jasonkwok2018/NaviBatch)
- **App Store**: [下载NaviBatch](https://apps.apple.com/app/navibatch/id6738243468)

## 📄 许可证

版权所有 © 2024 NaviBatch. 保留所有权利。
