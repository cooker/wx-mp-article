# GitHub 仓库配置（第一步功能）— 实现提示词

将以下功能实现为一个「第一步：设置 GitHub 仓库配置」模块。

---

## 一、功能概述

在 Vue 3 应用中添加一个「第一步」配置区块，用于设置 GitHub 仓库信息，生成 jsDelivr CDN 图片 URL，并支持将本地图片上传到 GitHub 仓库后获取远程链接。

---

## 二、配置项与数据模型

需要支持以下配置字段，均持久化到 `localStorage`（键名建议：`wx-mp-face-github-repo`）：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| owner | string | `''` | GitHub 用户名或组织名 |
| repo | string | `''` | 仓库名；支持 `img[0,20]` 或 `img[0-20]` 表示从 img0～img20 随机选一个 |
| branch | string | `'main'` | 分支名 |
| pathPrefix | string | 当前日期 `YYYY/MM/DD` | 仓库内路径前缀，可选 |
| token | string | `''` | GitHub Personal Access Token，可选；仅存于本机，用于 API 调用 |

- 任意配置变更时自动 `save` 到 localStorage
- 初次加载无持久化数据时，可尝试从远程 URL 拉取默认配置（如 `https://xxx.github-config.json`），成功则导入

---

## 三、CDN URL 规则

- 格式：`https://fastly.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}`
- `path` 由 `pathPrefix`（去尾斜杠）与具体文件名拼接，如 `2026/02/05/xxx.jpg`
- 提供两个工具方法：
  - `getJsdelivrUrl(path)`：使用当前配置的 owner、repo、branch、pathPrefix 拼接 CDN URL
  - `getJsdelivrUrlForRepo(repoName, path)`：使用指定 `repoName` 拼接 URL（上传后可能随机到不同 repo 时使用）

---

## 四、repo 随机语法

- 输入如 `img[0,20]` 或 `img[0-20]` 时，解析为 `img` + `[min, max]` 之间的随机整数
- 示例：`img[0-20]` → 从 img0、img1…img20 中随机选一个
- 解析逻辑：正则 `^(.+)\[(\d+)[,\-](\d+)\]$`，取 base、min、max，`result = base + (min..max 随机数)`

---

## 五、pathPrefix 与当前日期

- `getCurrentDatePath()`：返回 `YYYY/MM/DD` 格式的当前日期
- 提供「设为当前日期」按钮，将 `pathPrefix` 设为 `getCurrentDatePath()`
- `getDefaultPathPrefix()`：返回当前日期，供占位符、重置等使用

---

## 六、UI 结构

标题：「第一步：设置 GitHub 仓库配置」

说明文案：配置后可用 `https://fastly.jsdelivr.net/gh/owner/repo@branch/路径` 格式展示图片

表单字段（建议使用 grid 布局）：

1. **owner**：文本输入，placeholder 如「如 bucketio」
2. **repo**：文本输入，placeholder 如「如 img18 或 img[0-20]（随机）」；下方提示：支持 `img[0,20]` 或 `img[0-20]` 表示 img0～img20 随机选一个
3. **branch**：文本输入，placeholder「main」
4. **pathPrefix**：文本输入，placeholder 为默认日期；右侧按钮「设为当前日期」
5. **GitHub Token（可选）**：`type="password"`，placeholder「用于 GitHub API，仅保存在本机」；下方提示：仅保存在本机 localStorage，用于调用 GitHub API 等

底部操作：

- **导出配置**：将 `{ owner, repo, branch, pathPrefix, token }` 导出为 JSON 文件
- **导入配置**：`<input type="file" accept=".json,application/json">`，解析 JSON 后调用 `importConfig(cfg)` 覆盖当前配置；解析失败时显示错误信息

当存在已上传的本地图片（有 `file` 的项）时：

- 显示「添加远程图片（先上传到 GitHub 再添加 CDN 链接，需配置 Token）」
- 每个文件名一个按钮，点击后：
  - 若有 `file` 且配置了 `uploadFileToGitHub`：上传到 GitHub，获取 CDN URL，触发 `add-remote` 事件
  - 否则：直接用 `getJsdelivrUrl(name)` 生成 URL 并触发 `add-remote`
- 上传中显示「xxx 上传中…」，失败时显示错误信息

页面底部展示「示例：{exampleUrl}」，`exampleUrl` 由 `getJsdelivrUrl('2026/02/03/xxx.jpg')` 生成（仅当 owner、repo 有值时显示）

---

## 七、GitHub 上传

- 接口：`PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}`
- Headers：
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer {token}`
  - `X-GitHub-Api-Version: 2022-11-28`
  - `Content-Type: application/json`
- Body：`{ message: "upload {path}", content: "<base64>", branch: "{branch}" }`
- 文件转 base64：`FileReader.readAsDataURL`，取 `data:xxx;base64,` 后的部分
- 前置校验：无 owner/repo 抛出「请配置 owner 和 repo」；无 token 抛出「上传到 GitHub 需要配置 Token」
- 返回：`{ repo, path }`（path 取自 `response.content.path` 或传入的 path）

---

## 八、导出与导入

- `exportConfig()`：返回 `{ owner, repo, branch, pathPrefix, token }` 对象
- `importConfig(cfg)`：从 `cfg` 覆盖各字段（trim 处理，branch 默认 main）
- 导出文件命名：`github-config-{Date.now()}.json`

---

## 九、组件接口（Vue 3）

**Props：**

- `owner`, `repo`, `branch`, `pathPrefix`, `token`（均 v-model 双绑）
- `getJsdelivrUrl`, `getJsdelivrUrlForRepo`, `getDefaultPathPrefix`, `setPathPrefixToCurrent`
- `uploadFileToGitHub`, `exportConfig`, `importConfig`
- `uploadedImages`（本地已上传图片列表，含 `file` 的项可用于上传）

**Emits：**

- `update:owner`, `update:repo`, `update:branch`, `update:pathPrefix`, `update:token`
- `add-remote`：参数为 CDN URL 字符串

---

## 十、Composable 返回值

`useGitHubRepoConfig()` 返回：

- 响应式 ref：`owner`, `repo`, `branch`, `pathPrefix`, `token`
- 方法：`getJsdelivrUrl`, `getJsdelivrUrlForRepo`, `getDefaultPathPrefix`, `setPathPrefixToCurrent`, `uploadFileToGitHub`, `exportConfig`, `importConfig`

---

## 十一、依赖关系

- 上传功能、添加远程图片依赖第一步的配置；若 owner/repo/token 未配置，上传时应提示「请先在第一步配置 owner、repo 和 Token」
- Token 为可选；仅当需要上传到 GitHub 或添加远程图片（含上传）时才必须配置

---

## 十二、样式建议

- 区块：`rounded-xl border border-gray-200 bg-white p-4 shadow`
- 标题：`text-sm font-medium text-gray-700`
- 输入框：`rounded border border-gray-300 px-2 py-1.5 text-sm`
- 按钮：`rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50`
