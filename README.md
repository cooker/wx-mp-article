# 图片批量上传自动排版网站

一个基于 Vue 3 的现代化图片批量上传和自动排版工具，支持多种精美的排版布局。

## 功能特性

- 🖼️ **批量上传** - 支持拖拽上传和点击选择，一次上传多张图片
- 🎨 **自动排版** - 四种排版模式：瀑布流、网格、马赛克、轮播
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🔍 **图片预览** - 点击图片可全屏预览，支持键盘导航
- ✨ **精美 UI** - 现代化的渐变背景和毛玻璃效果
- ⚡ **性能优化** - 图片懒加载，流畅的动画效果

## 技术栈

- Vue 3 (Composition API)
- Vite
- CSS3 (现代特性：backdrop-filter, grid layout)

## 快速开始

### 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

项目将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## GitHub Pages 部署

项目已配置 GitHub Actions 自动部署到 GitHub Pages。

### 部署步骤

1. **启用 GitHub Pages**：
   - 进入仓库的 Settings → Pages
   - Source 选择 "GitHub Actions"

2. **推送代码**：
   - 推送到 `main` 或 `master` 分支
   - GitHub Actions 会自动构建并部署

3. **访问网站**：
   - 部署完成后，访问 `https://<username>.github.io/<repository-name>/`

### 手动触发部署

如果需要手动触发部署，可以：
- 进入仓库的 Actions 页面
- 选择 "Deploy to GitHub Pages" 工作流
- 点击 "Run workflow"

### 配置说明

- 工作流文件位于 `.github/workflows/deploy.yml`
- 构建输出目录：`dist`
- Base 路径自动设置为 `/<repository-name>/`

### 打包为桌面应用

#### 开发模式运行 Electron

```bash
npm run electron:dev
```

#### 打包所有平台

```bash
npm run electron:build
```

#### 仅打包 Windows

```bash
npm run electron:build:win
```

#### 仅打包 macOS

```bash
npm run electron:build:mac
```

打包后的文件会在 `dist-electron` 目录中。

## 使用说明

1. **上传图片**：将图片拖拽到上传区域，或点击选择文件
2. **选择排版**：上传后，选择你喜欢的排版模式
3. **预览图片**：点击任意图片可全屏预览
4. **键盘操作**：在预览模式下，使用左右箭头键切换图片，ESC 键关闭预览

## 排版模式

- **瀑布流**：根据图片宽高比自动调整，呈现自然的瀑布流效果
- **网格**：整齐统一的网格布局，所有图片大小一致
- **马赛克**：创意马赛克布局，部分图片放大突出显示
- **轮播**：横向滚动轮播，适合展示精选图片

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 项目结构

```
wx-mp-article/
├── src/
│   ├── components/
│   │   ├── ImageUploader.vue    # 图片上传组件
│   │   └── ImageLayout.vue      # 自动排版组件
│   ├── App.vue                  # 主应用组件
│   ├── main.js                  # 应用入口
│   └── style.css                # 全局样式
├── index.html                   # HTML 模板
├── vite.config.js               # Vite 配置
└── package.json                 # 项目配置
```

## 许可证

MIT
