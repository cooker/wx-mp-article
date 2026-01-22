<template>
  <div class="wechat-preview">
    <div class="preview-header">
      <h3 class="preview-title">微信公众号预览</h3>
      <button 
        v-if="images.length > 0"
        @click="copyToClipboard"
        class="copy-btn"
        :disabled="isCopying"
      >
        <svg v-if="!copySuccess" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-width="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-width="2"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ copySuccess ? '已复制' : '复制代码' }}</span>
      </button>
    </div>
    
    <div class="phone-mockup">
      <div class="phone-header">
        <div class="status-bar">
          <span class="time">9:41</span>
          <div class="status-icons">
            <span class="signal">📶</span>
            <span class="wifi">📶</span>
            <span class="battery">🔋</span>
          </div>
        </div>
        <div class="nav-bar">
          <span class="back-btn">‹</span>
          <span class="nav-title">文章</span>
          <span class="more-btn">⋯</span>
        </div>
      </div>
      
      <div class="article-content">
        <div class="article-header">
          <h1 class="article-title">{{ articleTitle }}</h1>
          <div class="article-meta">
            <span class="author">{{ authorName }}</span>
            <span class="separator">|</span>
            <span class="date">{{ currentDate }}</span>
          </div>
        </div>
        
        <div 
          class="article-body layout-grid"
          :style="getArticleBodyStyle()"
        >
          <div 
            v-for="(image, index) in images" 
            :key="index"
            class="article-image"
            :class="getImageClass(index)"
          >
            <img 
              :src="image.url" 
              :alt="`图片 ${index + 1}`"
              @load="onImageLoad"
            />
          </div>
        </div>
        
        <div class="article-footer">
          <div class="read-more">
            <span>阅读原文</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  layoutMode: {
    type: String,
    default: 'grid'
  },
  gridColumns: {
    type: Number,
    default: 3
  },
  articleTitle: {
    type: String,
    default: '图片文章'
  },
  authorName: {
    type: String,
    default: '作者'
  }
})

const isCopying = ref(false)
const copySuccess = ref(false)

const currentDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const onImageLoad = (event) => {
  // 图片加载完成处理
  const img = event.target
  img.style.opacity = '1'
}

const getImageClass = (index) => {
  // 根据布局模式返回对应的类名
  return `image-${props.layoutMode}`
}

const getArticleBodyStyle = () => {
  // 完全同步左侧的列数设置，不限制最大列数
  const columns = props.gridColumns || 3
  // 当列数较多时，减小间距以容纳更多列
  const gap = columns >= 5 ? '0.25rem' : columns >= 4 ? '0.3rem' : '0.5rem'
  return {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: gap
  }
}

// 生成微信公众号 HTML 代码（只包含图片）
const generateHTML = () => {
  const columns = props.gridColumns || 3
  const gap = columns >= 5 ? '4px' : columns >= 4 ? '5px' : '8px'
  
  // 生成图片 HTML（网格布局）
  const imagesHTML = props.images.map((image, index) => {
    return `    <div style="aspect-ratio: 1; overflow: hidden; border-radius: 4px; background: #f9fafb;">
      <img src="${image.url}" alt="图片 ${index + 1}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
    </div>`
  }).join('\n')
  
  // 只生成图片网格布局的 HTML
  const html = `<div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}; padding: 12px;">
${imagesHTML}
</div>`
  
  return html
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (props.images.length === 0) return
  
  try {
    isCopying.value = true
    copySuccess.value = false
    
    const html = generateHTML()
    
    // 使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(html)
    } else {
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = html
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    
    copySuccess.value = true
    
    // 3秒后重置状态
    setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动复制')
  } finally {
    isCopying.value = false
  }
}
</script>

<style scoped>
.wechat-preview {
  position: sticky;
  top: 2rem;
  height: fit-content;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  animation: fadeInRight 0.6s ease-out 0.3s both;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.preview-header {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.preview-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
  letter-spacing: -0.01em;
  flex: 1;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  white-space: nowrap;
}

.copy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.copy-btn:active:not(:disabled) {
  transform: translateY(0);
}

.copy-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.copy-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.copy-btn span {
  font-weight: 500;
}

.phone-mockup {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 375px;
  max-width: 100%;
  margin: 0 auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.phone-mockup:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(0, 0, 0, 0.08);
}

.phone-header {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: #1a202c;
  font-weight: 600;
}

.status-icons {
  display: flex;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.back-btn {
  font-size: 1.5rem;
  color: #1a202c;
  cursor: pointer;
  width: 32px;
  text-align: center;
}

.nav-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
}

.more-btn {
  font-size: 1.25rem;
  color: #1a202c;
  cursor: pointer;
  width: 32px;
  text-align: center;
}

.article-content {
  background: #ffffff;
  min-height: 400px;
}

.article-header {
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.article-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.author {
  font-weight: 500;
}

.separator {
  color: #d1d5db;
}

.date {
  color: #9ca3af;
}

.article-body {
  padding: 1rem;
}

/* 网格布局 */
.article-body.layout-grid {
  display: grid;
  padding: 0.75rem;
  transition: grid-template-columns 0.3s ease, gap 0.3s ease;
  /* gap 通过内联样式动态设置 */
}

.article-body.layout-grid .article-image {
  margin-bottom: 0;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.article-body.layout-grid .article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s;
}


/* 默认布局（单列） */
.article-image {
  margin-bottom: 1rem;
  width: 100%;
  overflow: hidden;
  background: #f9fafb;
  border-radius: 4px;
}

.article-image:last-child {
  margin-bottom: 0;
}

.article-image img {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: opacity 0.3s;
}

.article-footer {
  padding: 1.5rem 1rem;
  border-top: 1px solid #f3f4f6;
  text-align: center;
}

.read-more {
  color: #667eea;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.75rem;
  border: 1px solid #667eea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.read-more:hover {
  background: #667eea;
  color: #ffffff;
}

/* 滚动条样式 */
.wechat-preview::-webkit-scrollbar {
  width: 6px;
}

.wechat-preview::-webkit-scrollbar-track {
  background: transparent;
}

.wechat-preview::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.wechat-preview::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 移动端优化 */
@media (max-width: 1024px) {
  .wechat-preview {
    position: relative;
    top: 0;
    margin-top: 0;
    animation: none;
  }
  
  .preview-header {
    margin-bottom: 1.5rem;
  }
  
  .phone-mockup {
    width: 100%;
    max-width: 375px;
  }
  
  .article-body.layout-grid {
    /* 列数通过内联样式动态设置，这里只设置间距 */
    gap: 0.5rem;
    padding: 0.75rem;
  }
  
}

@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .preview-title {
    font-size: 1.25rem;
  }
  
  .copy-btn {
    width: 100%;
    justify-content: center;
  }
  
  .phone-mockup {
    border-radius: 24px;
  }
}
</style>
