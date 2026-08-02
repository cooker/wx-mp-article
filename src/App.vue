<script setup>
import { computed, shallowRef } from 'vue'
import GitHubRepoConfig from './components/GitHubRepoConfig.vue'
import ImageUploader from './components/ImageUploader.vue'
import ImageLayout from './components/ImageLayout.vue'
import WeChatPreview from './components/WeChatPreview.vue'

const images = shallowRef([])
const layoutMode = shallowRef('grid')
const gridColumns = shallowRef(3)
const articleTitle = shallowRef('图片文章')
const authorName = shallowRef('作者')

const appIconUrl = `${import.meta.env.BASE_URL}icons/icon-128.png`
const imageCountLabel = computed(() => images.value.length > 0 ? `${images.value.length} 张素材` : '等待素材')

const handleImagesUploaded = (uploadedImages) => {
  images.value = uploadedImages
}

const handleClear = () => {
  images.value = []
}

const handleLayoutChange = (mode) => {
  layoutMode.value = mode
}

const handleGridColumnsChange = (columns) => {
  gridColumns.value = columns
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="图片排版工作台首页">
        <img class="brand-icon" :src="appIconUrl" alt="" />
        <span class="brand-copy">
          <strong>FRAMEFLOW</strong>
          <small>微信公众号图片排版</small>
        </span>
      </a>

      <div class="topbar-meta" aria-label="应用状态">
        <span class="status-dot" aria-hidden="true"></span>
        <span>本地优先</span>
        <span class="meta-divider" aria-hidden="true"></span>
        <span>{{ imageCountLabel }}</span>
      </div>
    </header>

    <main id="top" class="app-main">
      <section class="intro-panel" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="eyebrow">IMAGE-TO-ARTICLE WORKSPACE</p>
          <h1 id="page-title"><span>让图片</span><span>自己排好队。</span></h1>
          <p class="intro-description">
            批量上传到你的 GitHub 图床，按分辨率整理素材，实时预览并复制微信公众号文章 HTML。
          </p>
        </div>

        <ol class="workflow" aria-label="使用流程">
          <li>
            <span class="step-index">01</span>
            <span><strong>连接仓库</strong><small>配置 GitHub 图床</small></span>
          </li>
          <li>
            <span class="step-index">02</span>
            <span><strong>导入素材</strong><small>拖入并自动分组</small></span>
          </li>
          <li>
            <span class="step-index">03</span>
            <span><strong>完成排版</strong><small>预览并复制 HTML</small></span>
          </li>
        </ol>
      </section>

      <section class="setup-stack" aria-label="素材设置">
        <GitHubRepoConfig />
        <ImageUploader
          @images-uploaded="handleImagesUploaded"
          @clear="handleClear"
        />
      </section>

      <section v-if="images.length > 0" class="editor-grid" aria-label="图片排版工作区">
        <div class="canvas-column">
          <div class="section-heading">
            <div>
              <p class="section-kicker">CANVAS</p>
              <h2>排版画布</h2>
            </div>
            <span class="section-count">{{ images.length }} IMAGES</span>
          </div>
          <ImageLayout
            :images="images"
            :layout-mode="layoutMode"
            :grid-columns="gridColumns"
            @layout-change="handleLayoutChange"
            @grid-columns-change="handleGridColumnsChange"
          />
        </div>

        <aside class="preview-column">
          <div class="section-heading">
            <div>
              <p class="section-kicker">LIVE OUTPUT</p>
              <h2>微信预览</h2>
            </div>
          </div>
          <WeChatPreview
            :images="images"
            :layout-mode="layoutMode"
            :grid-columns="gridColumns"
            :article-title="articleTitle"
            :author-name="authorName"
          />
        </aside>
      </section>

      <section v-else class="empty-workspace" aria-label="等待导入图片">
        <span class="empty-mark">+</span>
        <div>
          <p class="section-kicker">YOUR CANVAS IS READY</p>
          <h2>导入第一组图片，开始编排文章。</h2>
        </div>
      </section>
    </main>

    <footer class="app-footer">
      <span>FRAMEFLOW / WX-MP-ARTICLE</span>
      <span>素材与 Token 由你的浏览器管理</span>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--color-canvas);
  color: var(--color-ink);
}

.topbar {
  width: min(1480px, calc(100% - 48px));
  height: 88px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-line);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  color: inherit;
  text-decoration: none;
}

.brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 15px;
  box-shadow: 0 10px 24px rgba(23, 26, 43, 0.14);
}

.brand-copy {
  display: grid;
  gap: 2px;
}

.brand-copy strong {
  font-size: 0.9rem;
  letter-spacing: 0.15em;
}

.brand-copy small {
  color: var(--color-muted);
  font-size: 0.75rem;
}

.topbar-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 650;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 4px rgba(28, 161, 113, 0.12);
}

.meta-divider {
  width: 1px;
  height: 14px;
  background: var(--color-line);
}

.app-main {
  width: min(1480px, calc(100% - 48px));
  margin: 0 auto;
  padding: 74px 0 88px;
}

.intro-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(420px, 0.9fr);
  gap: 64px;
  align-items: end;
  padding-bottom: 58px;
}

.eyebrow,
.section-kicker {
  margin: 0;
  color: var(--color-primary);
  font: 700 0.72rem/1.2 var(--font-mono);
  letter-spacing: 0.14em;
}

.intro-copy h1 {
  max-width: 740px;
  margin: 18px 0 22px;
  font-size: clamp(3.4rem, 7vw, 7.2rem);
  font-weight: 760;
  line-height: 0.96;
  letter-spacing: -0.075em;
}

.intro-copy h1 span {
  display: block;
}

.intro-description {
  max-width: 690px;
  margin: 0;
  color: var(--color-muted);
  font-size: clamp(1rem, 1.5vw, 1.24rem);
  line-height: 1.75;
}

.workflow {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-line-strong);
}

.workflow li {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 16px;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--color-line);
}

.workflow li span:last-child {
  display: grid;
  gap: 4px;
}

.workflow strong {
  font-size: 0.95rem;
}

.workflow small {
  color: var(--color-muted);
  font-size: 0.78rem;
}

.step-index {
  color: var(--color-primary);
  font: 700 0.78rem var(--font-mono);
}

.setup-stack {
  display: grid;
  gap: 18px;
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 410px;
  gap: 24px;
  align-items: start;
  margin-top: 34px;
}

.section-heading {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 4px;
}

.section-heading h2,
.empty-workspace h2 {
  margin: 6px 0 0;
  font-size: 1.45rem;
  letter-spacing: -0.035em;
}

.section-count {
  color: var(--color-muted);
  font: 650 0.7rem var(--font-mono);
  letter-spacing: 0.08em;
}

.preview-column {
  position: sticky;
  top: 18px;
}

.empty-workspace {
  min-height: 220px;
  margin-top: 24px;
  padding: 42px;
  display: flex;
  align-items: center;
  gap: 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.42);
}

.empty-mark {
  width: 74px;
  height: 74px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 24px;
  background: var(--color-ink);
  color: white;
  font-size: 2.25rem;
  font-weight: 250;
}

.app-footer {
  width: min(1480px, calc(100% - 48px));
  margin: 0 auto;
  padding: 24px 0 32px;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  border-top: 1px solid var(--color-line);
  color: var(--color-muted);
  font: 650 0.68rem var(--font-mono);
  letter-spacing: 0.08em;
}

@media (max-width: 1100px) {
  .intro-panel {
    grid-template-columns: 1fr;
    gap: 38px;
  }

  .workflow {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid var(--color-line);
  }

  .workflow li {
    padding-right: 20px;
    border-right: 1px solid var(--color-line);
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }

  .preview-column {
    position: static;
  }
}

@media (max-width: 720px) {
  .topbar,
  .app-main,
  .app-footer {
    width: min(100% - 28px, 1480px);
  }

  .topbar {
    height: 72px;
  }

  .brand-icon {
    width: 42px;
    height: 42px;
  }

  .brand-copy small,
  .meta-divider,
  .topbar-meta span:last-child {
    display: none;
  }

  .app-main {
    padding: 48px 0 60px;
  }

  .intro-copy h1 {
    font-size: clamp(3rem, 15vw, 5rem);
  }

  .workflow {
    grid-template-columns: 1fr;
  }

  .workflow li {
    border-right: 0;
  }

  .empty-workspace {
    align-items: flex-start;
    padding: 28px;
  }

  .app-footer {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
