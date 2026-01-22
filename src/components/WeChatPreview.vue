<template>
  <div class="wechat-preview">
    <div class="preview-header">
      <h3 class="preview-title">微信公众号预览</h3>
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
  margin-bottom: 1.75rem;
}

.preview-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.375rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
  letter-spacing: -0.01em;
}

.phone-mockup {
  background: #ffffff;
  border-radius: 28px;
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 375px;
  max-width: 100%;
  margin: 0 auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.phone-mockup:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 30px 80px rgba(0, 0, 0, 0.22),
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
  .preview-title {
    font-size: 1.25rem;
  }
  
  .phone-mockup {
    border-radius: 24px;
  }
}
</style>
