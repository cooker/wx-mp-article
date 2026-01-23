# Electron 打包说明

## 安装依赖

首先安装项目依赖和 Electron 相关依赖：

```bash
npm install
```

## 开发模式

在开发模式下运行 Electron 应用：

```bash
npm run electron:dev
```

这会先构建 Vue 应用，然后启动 Electron 窗口。

## 打包应用

### 打包所有平台

```bash
npm run electron:build
```

### 仅打包 Windows

```bash
npm run electron:build:win
```

打包后会生成 Windows 安装程序（.exe），位于 `dist-electron` 目录。

### 仅打包 macOS

```bash
npm run electron:build:mac
```

打包后会生成 macOS 安装包（.dmg），位于 `dist-electron` 目录。

## 打包输出

打包后的文件会输出到 `dist-electron` 目录：

- **Windows**: `dist-electron/图片批量上传自动排版 Setup x.x.x.exe`
- **macOS**: `dist-electron/图片批量上传自动排版-x.x.x.dmg`

## 注意事项

1. **Windows 打包**：需要在 Windows 系统或支持 Windows 交叉编译的环境中进行
2. **macOS 打包**：需要在 macOS 系统上进行，且可能需要代码签名
3. **图标文件**：如果需要自定义应用图标，请将图标文件放在 `build/` 目录：
   - Windows: `build/icon.ico` (256x256)
   - macOS: `build/icon.icns` (512x512)

## 应用配置

应用配置在 `package.json` 的 `build` 字段中，可以修改：
- 应用名称
- 应用 ID
- 窗口大小
- 安装选项等

## 故障排除

如果打包失败，请检查：
1. 是否已运行 `npm run build` 生成 dist 目录
2. 是否正确安装了所有依赖
3. 系统是否满足 Electron Builder 的要求
