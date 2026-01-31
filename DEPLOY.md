# GitHub Pages 部署指南

本项目已配置 GitHub Actions 自动部署到 GitHub Pages。

## 快速开始

### 1. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 **Settings** → **Pages**
3. 在 **Source** 部分，选择 **GitHub Actions**

### 2. 推送代码

将代码推送到 `main` 或 `master` 分支：

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 3. 查看部署状态

1. 进入仓库的 **Actions** 标签页
2. 查看 "Deploy to GitHub Pages" 工作流的运行状态
3. 等待部署完成（通常需要 1-2 分钟）

### 4. 访问网站

部署完成后，你的网站将在以下地址可用：

- **子路径部署**：`https://<username>.github.io/<repository-name>/`
- **根路径部署**：`https://<username>.github.io/`（需要特殊配置）

## 配置说明

### Base 路径配置

根据你的 GitHub Pages 部署方式，可能需要调整 base 路径：

#### 部署到子路径（默认）

如果你的仓库名是 `wx-mp-article`，网站地址是 `https://username.github.io/wx-mp-article/`

工作流已自动配置，无需修改。

#### 部署到根路径

如果你的 GitHub 用户名是 `username`，网站地址是 `https://username.github.io/`

需要修改 `.github/workflows/deploy.yml` 文件：

```yaml
BASE_PATH: /  # 改为根路径
```

### 手动触发部署

如果需要手动触发部署：

1. 进入仓库的 **Actions** 标签页
2. 选择 **Deploy to GitHub Pages** 工作流
3. 点击 **Run workflow** 按钮
4. 选择分支并点击 **Run workflow**

## 工作流说明

### 触发条件

- 推送到 `main` 或 `master` 分支时自动触发
- 手动触发（workflow_dispatch）

### 构建步骤

1. **Checkout** - 检出代码
2. **Setup pnpm** - 设置 pnpm 包管理器
3. **Setup Node.js** - 设置 Node.js 环境（版本 20）
4. **Install dependencies** - 安装项目依赖
5. **Build** - 构建生产版本
6. **Setup Pages** - 配置 GitHub Pages
7. **Upload artifact** - 上传构建产物
8. **Deploy** - 部署到 GitHub Pages

### 构建产物

- 输出目录：`dist`
- 包含 `.nojekyll` 文件，确保 GitHub Pages 正确处理 SPA 应用

## 故障排除

### 部署失败

1. 检查 **Actions** 标签页中的错误信息
2. 确保已启用 GitHub Pages（Settings → Pages）
3. 确保 Source 设置为 "GitHub Actions"
4. 检查仓库权限设置

### 网站无法访问

1. 检查部署是否成功完成
2. 确认网站地址是否正确
3. 等待几分钟后重试（DNS 可能需要时间传播）
4. 检查浏览器控制台是否有错误

### 资源加载失败

如果图片或 CSS 无法加载：

1. 检查 `vite.config.js` 中的 `base` 配置
2. 确保 base 路径与 GitHub Pages 地址匹配
3. 检查构建产物中的资源路径

## 自定义域名

如果需要使用自定义域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为你的域名，例如：`example.com`
3. 在你的域名 DNS 设置中添加 CNAME 记录指向 `username.github.io`
4. 重新部署后生效

## 注意事项

- 首次部署可能需要几分钟时间
- 每次推送代码到主分支都会自动触发部署
- 部署过程中，网站可能会短暂不可用
- 建议在部署前先在本地测试构建：`pnpm run build`
