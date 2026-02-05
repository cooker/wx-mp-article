/**
 * GitHub 仓库配置 Composable
 * 持久化到 localStorage (wx-mp-face-github-repo)
 */
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'wx-mp-face-github-repo'

// 获取当前日期路径 YYYY/MM/DD
export function getCurrentDatePath() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// 解析 repo 随机语法 img[0,20] 或 img[0-20]
function parseRepoRandom(repoStr) {
  const match = repoStr.trim().match(/^(.+)\[(\d+)[,\-](\d+)\]$/)
  if (!match) return null
  const [, base, minStr, maxStr] = match
  const min = parseInt(minStr, 10)
  const max = parseInt(maxStr, 10)
  const rand = Math.floor(Math.random() * (max - min + 1)) + min
  return base + rand
}

// 从 localStorage 读取，兼容旧版 github_token
function loadConfig() {
  const defaults = {
    owner: '',
    repo: '',
    branch: 'main',
    pathPrefix: getCurrentDatePath(),
    token: ''
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        owner: String(parsed.owner || '').trim(),
        repo: String(parsed.repo || '').trim(),
        branch: String(parsed.branch || 'main').trim() || 'main',
        pathPrefix: String(parsed.pathPrefix || '').trim() || getCurrentDatePath(),
        token: String(parsed.token || '').trim()
      }
    }
    // 迁移：旧版 github_token 导入到新配置
    const oldToken = localStorage.getItem('github_token')
    if (oldToken) {
      defaults.token = String(oldToken).trim()
      defaults.owner = 'bucketio'
      defaults.repo = 'img[0-19]'
    }
  } catch (_) {}
  return defaults
}

export function useGitHubRepoConfig() {
  const raw = loadConfig()
  const owner = ref(raw.owner)
  const repo = ref(raw.repo)
  const branch = ref(raw.branch)
  const pathPrefix = ref(raw.pathPrefix)
  const token = ref(raw.token)

  const save = () => {
    const cfg = {
      owner: owner.value.trim(),
      repo: repo.value.trim(),
      branch: (branch.value.trim() || 'main'),
      pathPrefix: (pathPrefix.value.trim() || getCurrentDatePath()),
      token: token.value.trim()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  }

  // 任意配置变更时自动保存
  watch([owner, repo, branch, pathPrefix, token], save, { deep: true })

  const getDefaultPathPrefix = () => getCurrentDatePath()

  const setPathPrefixToCurrent = () => {
    pathPrefix.value = getCurrentDatePath()
  }

  // 解析 repo 名称（支持随机语法）
  const resolveRepoName = () => {
    const r = repo.value.trim()
    const parsed = parseRepoRandom(r)
    return parsed ?? r
  }

  // getJsdelivrUrl(path) - 使用当前配置
  const getJsdelivrUrl = (path) => {
    const o = owner.value.trim()
    const r = resolveRepoName()
    const b = branch.value.trim() || 'main'
    const prefix = (pathPrefix.value.trim() || getCurrentDatePath()).replace(/\/+$/, '')
    const p = path ? (prefix ? `${prefix}/${path}` : path) : prefix
    if (!o || !r) return ''
    return `https://fastly.jsdelivr.net/gh/${o}/${r}@${b}/${p}`.replace(/\/+/g, '/')
  }

  // getJsdelivrUrlForRepo(repoName, path) - 指定 repo 名，path 为仓库内完整路径（如上传返回的 path）
  const getJsdelivrUrlForRepo = (repoName, path) => {
    const o = owner.value.trim()
    const b = branch.value.trim() || 'main'
    if (!o || !repoName || !path) return ''
    const p = path.replace(/^\/+/, '')
    return `https://fastly.jsdelivr.net/gh/${o}/${repoName}@${b}/${p}`.replace(/\/+/g, '/')
  }

  const exportConfig = () => ({
    owner: owner.value.trim(),
    repo: repo.value.trim(),
    branch: (branch.value.trim() || 'main'),
    pathPrefix: (pathPrefix.value.trim() || getCurrentDatePath()),
    token: token.value.trim()
  })

  const importConfig = (cfg) => {
    if (!cfg || typeof cfg !== 'object') return
    owner.value = String(cfg.owner ?? '').trim()
    repo.value = String(cfg.repo ?? '').trim()
    branch.value = (String(cfg.branch ?? 'main').trim()) || 'main'
    pathPrefix.value = (String(cfg.pathPrefix ?? '').trim()) || getCurrentDatePath()
    token.value = String(cfg.token ?? '').trim()
  }

  const uploadFileToGitHub = async (file, path) => {
    const o = owner.value.trim()
    const r = resolveRepoName()
    const t = token.value.trim()

    if (!o || !r) throw new Error('请配置 owner 和 repo')
    if (!t) throw new Error('上传到 GitHub 需要配置 Token')

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const m = reader.result.match(/^data:[^;]+;base64,(.+)$/)
        resolve(m ? m[1] : '')
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const apiUrl = `https://api.github.com/repos/${o}/${r}/contents/${path}`

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${t}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `upload ${path}`,
        content: base64,
        branch: branch.value.trim() || 'main'
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || '上传失败')
    }

    const data = await response.json()
    return {
      repo: r,
      path: data.content?.path || path
    }
  }

  return {
    owner,
    repo,
    branch,
    pathPrefix,
    token,
    getJsdelivrUrl,
    getJsdelivrUrlForRepo,
    getDefaultPathPrefix,
    setPathPrefixToCurrent,
    resolveRepoName,
    exportConfig,
    importConfig,
    uploadFileToGitHub
  }
}
