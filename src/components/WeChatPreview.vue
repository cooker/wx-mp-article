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
        
        <div class="article-body" :style="groupedImages.length > 0 ? getArticleBodyStyle() : {}">
          <!-- 按尺寸分组排序展示图片，与网格布局一致 -->
          <div 
            v-if="groupedImages.length > 0"
            v-for="(image, index) in groupedImages" 
            :key="image.originalIndex"
            class="article-image"
            @click="openPreview(image, image.originalIndex)"
          >
            <img 
              :src="image.url" 
              :alt="`图片 ${image.originalIndex + 1}`"
              @load="onImageLoad"
            />
          </div>
          
          <!-- 空状态提示 -->
          <div v-else class="preview-empty-state">
            <p class="preview-empty-message">请在上传区域选择要显示的分辨率组</p>
          </div>
        </div>
        
        <div class="article-footer">
          <div class="read-more">
            <span>阅读原文</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div 
      v-if="previewImage"
      class="image-preview-modal"
      @click="closePreview"
    >
      <button class="preview-close" @click.stop="closePreview" aria-label="关闭">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
        </svg>
      </button>
      <div class="preview-content" @click.stop>
        <img :src="previewImage.url" :alt="`预览图 ${previewIndex + 1}`" />
        <div class="preview-nav">
          <button 
            @click="prevImage"
            :disabled="previewIndex === 0"
            class="nav-btn prev"
            aria-label="上一张"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="15 18 9 12 15 6" stroke-width="2"/>
            </svg>
          </button>
          <span class="nav-info">{{ previewIndex + 1 }} / {{ images.length }}</span>
          <button 
            @click="nextImage"
            :disabled="previewIndex === images.length - 1"
            class="nav-btn next"
            aria-label="下一张"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="9 18 15 12 9 6" stroke-width="2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useClipboard } from '../composables/useClipboard'
import { useHtmlTemplate } from '../composables/useHtmlTemplate'

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

const { isCopying, copySuccess, copyHtml } = useClipboard()
const previewImage = ref(null)
const previewIndex = ref(0)

const currentDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// 使用通用模板生成逻辑（与 ImageLayout 保持一致）
const { html, groupedImages } = useHtmlTemplate(
  computed(() => props.images || []),
  computed(() => ({
    columns: props.gridColumns || 3,
    siteId: 'wechat',
  })),
)

const onImageLoad = (event) => {
  // 图片加载完成处理
  const img = event.target
  img.style.opacity = '1'
}

const getArticleBodyStyle = () => {
  // 与网格布局保持一致
  const columns = props.gridColumns || 3
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridAutoRows: '200px',
    gap: '1rem'
  }
}

// 打开图片预览
const openPreview = (image, index) => {
  previewImage.value = image
  previewIndex.value = index
  document.body.style.overflow = 'hidden'
}

// 关闭图片预览
const closePreview = () => {
  previewImage.value = null
  document.body.style.overflow = ''
}

// 上一张图片
const prevImage = () => {
  if (previewIndex.value > 0) {
    previewIndex.value--
    previewImage.value = props.images[previewIndex.value]
  }
}

// 下一张图片
const nextImage = () => {
  if (previewIndex.value < props.images.length - 1) {
    previewIndex.value++
    previewImage.value = props.images[previewIndex.value]
  }
}

// 键盘事件处理
const handleKeydown = (e) => {
  if (previewImage.value) {
    if (e.key === 'Escape') {
      closePreview()
    } else if (e.key === 'ArrowLeft') {
      prevImage()
    } else if (e.key === 'ArrowRight') {
      nextImage()
    }
  }
}

// 组件挂载时添加键盘监听
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

// 组件卸载时移除键盘监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// 复制到剪贴板（复制 HTML）
const copyToClipboard = async () => {
  if (props.images.length === 0) return
  
  try {
    const success = await copyHtml(html.value)
    if (!success) {
      throw new Error('copy failed')
    }
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动复制')
  }
}
</script>

<style scoped src="../styles/WeChatPreview.css"></style>
