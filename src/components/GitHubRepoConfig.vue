<template>
  <div class="github-repo-config">
    <h2 class="config-title">第一步：设置 GitHub 仓库配置</h2>
    <p class="config-desc">
      配置后可用 <code>https://fastly.jsdelivr.net/gh/owner/repo@branch/路径</code> 格式展示图片
    </p>

    <div class="config-form">
      <div class="form-field">
        <label>owner</label>
        <input
          v-model="owner"
          type="text"
          placeholder="如 bucketio"
          class="form-input"
        />
      </div>
      <div class="form-field">
        <label>repo</label>
        <input
          v-model="repo"
          type="text"
          placeholder="如 img18 或 img[0-20]（随机）"
          class="form-input"
        />
        <p class="form-hint">支持 <code>img[0,20]</code> 或 <code>img[0-20]</code> 表示 img0～img20 随机选一个</p>
      </div>
      <div class="form-field">
        <label>branch</label>
        <input
          v-model="branch"
          type="text"
          placeholder="main"
          class="form-input"
        />
      </div>
      <div class="form-field">
        <label>pathPrefix</label>
        <div class="path-prefix-row">
          <input
            v-model="pathPrefix"
            type="text"
            :placeholder="getDefaultPathPrefix()"
            class="form-input"
          />
          <button type="button" class="config-action-btn" @click="setPathPrefixToCurrent">
            设为当前日期
          </button>
        </div>
      </div>
      <div class="form-field">
        <label>GitHub Token（可选）</label>
        <input
          v-model="token"
          type="password"
          placeholder="用于 GitHub API，仅保存在本机"
          class="form-input"
          autocomplete="off"
        />
        <p class="form-hint">仅保存在本机 localStorage，用于调用 GitHub API 等</p>
      </div>
    </div>

    <div class="config-actions">
      <button type="button" class="config-action-btn" @click="handleExport">导出配置</button>
      <label class="config-action-btn file-label">
        <input
          type="file"
          accept=".json,application/json"
          @change="handleImport"
          class="file-input"
        />
        导入配置
      </label>
    </div>

    <p v-if="importError" class="import-error">{{ importError }}</p>

    <p v-if="exampleUrl" class="example-url">
      示例：<a :href="exampleUrl" target="_blank" rel="noopener noreferrer">{{ exampleUrl }}</a>
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGitHubRepoConfig } from '../composables/useGitHubRepoConfig'

const {
  owner,
  repo,
  branch,
  pathPrefix,
  token,
  getJsdelivrUrl,
  getDefaultPathPrefix,
  setPathPrefixToCurrent,
  exportConfig,
  importConfig
} = useGitHubRepoConfig()

const importError = ref('')

const exampleUrl = computed(() => {
  const o = owner.value.trim()
  const r = repo.value.trim()
  if (!o || !r) return ''
  return getJsdelivrUrl('2026/02/03/xxx.jpg')
})

const handleExport = () => {
  const cfg = exportConfig()
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `github-config-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const handleImport = (e) => {
  importError.value = ''
  const file = e.target?.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const cfg = JSON.parse(reader.result)
      importConfig(cfg)
    } catch (_) {
      importError.value = '解析 JSON 失败，请检查文件格式'
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}
</script>

<style scoped>
.github-repo-config {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.config-title {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.5rem;
}

.config-desc {
  font-size: 0.8125rem;
  color: #718096;
  margin: 0 0 1rem;
}

.config-desc code,
.form-hint code {
  background: rgba(102, 126, 234, 0.08);
  padding: 0.15em 0.4em;
  border-radius: 6px;
  font-size: 0.8em;
  color: #4a5568;
}

.config-form {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.form-input {
  border-radius: 10px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-family: 'Inter', sans-serif;
  color: #1a202c;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 1);
}

.form-input::placeholder {
  color: #a0aec0;
}

.form-hint {
  font-size: 0.75rem;
  color: #718096;
  margin: 0;
}

.path-prefix-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.path-prefix-row .form-input {
  flex: 1;
}

.config-action-btn {
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.config-action-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.config-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.file-label {
  display: inline-flex;
  align-items: center;
}

.file-input {
  display: none;
}

.import-error {
  font-size: 0.8125rem;
  color: #e53e3e;
  margin: 0.5rem 0 0;
}

.example-url {
  font-size: 0.8125rem;
  color: #718096;
  margin: 1rem 0 0;
  word-break: break-all;
}

.example-url a {
  color: #667eea;
  text-decoration: none;
}

.example-url a:hover {
  text-decoration: underline;
}

@media (min-width: 640px) {
  .config-form {
    grid-template-columns: repeat(2, 1fr);
  }
  .form-field:last-of-type {
    grid-column: 1 / -1;
  }
}
</style>
