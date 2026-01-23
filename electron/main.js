const { app, BrowserWindow } = require('electron')
const path = require('path')
const { existsSync } = require('fs')

// 开发环境判断
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#667eea',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    }
  })

  // 加载应用
  if (isDev) {
    // 开发环境：加载 Vite 开发服务器
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境：加载打包后的文件
    // 在打包后的应用中，dist 文件夹会被复制到 resources 目录
    const indexPath = path.join(process.resourcesPath, 'dist', 'index.html')
    
    if (existsSync(indexPath)) {
      mainWindow.loadFile(indexPath)
    } else {
      // 备用路径：尝试从应用目录加载
      const altPath = path.join(app.getAppPath(), 'dist', 'index.html')
      if (existsSync(altPath)) {
        mainWindow.loadFile(altPath)
      } else {
        // 最后尝试相对路径（开发测试用）
        const devPath = path.join(__dirname, '..', 'dist', 'index.html')
        if (existsSync(devPath)) {
          mainWindow.loadFile(devPath)
        } else {
          console.error('无法找到 index.html 文件，请确保已运行 npm run build')
        }
      }
    }
  }

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 窗口准备好后
  mainWindow.webContents.once('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS 点击 dock 图标时重新创建窗口
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
