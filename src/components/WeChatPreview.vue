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
        
        <div class="article-body" :style="getArticleBodyStyle()">
          <!-- 按尺寸分组排序展示图片，与网格布局一致 -->
          <div 
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

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
const previewImage = ref(null)
const previewIndex = ref(0)

const currentDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// 按图片尺寸分组并排序
const groupedImages = computed(() => {
  if (!props.images || props.images.length === 0) {
    return []
  }
  
  // 按尺寸分组
  const sizeGroups = new Map()
  
  props.images.forEach((image, index) => {
    const width = image.width || 0
    const height = image.height || 0
    const sizeKey = `${width}x${height}`
    
    if (!sizeGroups.has(sizeKey)) {
      sizeGroups.set(sizeKey, {
        sizeKey,
        width,
        height,
        area: width * height,
        images: []
      })
    }
    
    sizeGroups.get(sizeKey).images.push({
      ...image,
      originalIndex: index
    })
  })
  
  // 转换为数组并按尺寸排序（先按面积，再按宽度，最后按高度）
  const groups = Array.from(sizeGroups.values()).sort((a, b) => {
    // 先按面积排序（大的在前）
    if (a.area !== b.area) {
      return b.area - a.area
    }
    // 面积相同，按宽度排序（大的在前）
    if (a.width !== b.width) {
      return b.width - a.width
    }
    // 宽度也相同，按高度排序（大的在前）
    return b.height - a.height
  })
  
  // 展平所有组的图片，保持组内原始顺序
  return groups.flatMap(group => group.images)
})

// 获取图片的全局索引
const getImageGlobalIndex = (groupIndex, imageIndex) => {
  let globalIndex = 0
  for (let i = 0; i < groupIndex; i++) {
    globalIndex += groupedImages.value[i].images.length
  }
  return globalIndex + imageIndex
}

// 获取分组样式
const getGroupStyle = (group) => {
  const columns = props.gridColumns || 3
  const gap = columns >= 5 ? '0.25rem' : columns >= 4 ? '0.3rem' : '0.5rem'
  
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: gap,
    marginBottom: '1rem' // 不同尺寸组之间的间距
  }
}

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
  // 与网格布局保持一致
  const columns = props.gridColumns || 3
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridAutoRows: '200px',
    gap: '1rem'
  }
}

// 生成微信公众号 HTML 代码（按尺寸分组排序，与网格布局一致）
const generateHTML = () => {
  const columns = props.gridColumns || 3
  
  // 计算间距，与网格布局保持一致（1rem = 16px）
  const gapPx = 16
  
  // 计算容器宽度（640px标准宽度）
  const containerWidth = 640
  const padding = 16 // 1rem = 16px
  
  // 使用分组排序后的图片
  const sortedImages = groupedImages.value
  
  // 按分组排序后的顺序生成 HTML
  const rows = []
  for (let i = 0; i < sortedImages.length; i += columns) {
    rows.push(sortedImages.slice(i, i + columns))
  }
  
  const rowsHTML = rows.map((row, rowIndex) => {
    // 计算单张图片的统一尺寸（使用正方形，确保整齐美观）
    const availableWidth = containerWidth - padding * 2 - (row.length - 1) * gapPx
    const imageSize = Math.floor(availableWidth / row.length)
    
    // 统一使用正方形显示，高度和宽度相同，确保整齐美观
    const rowImageWidth = imageSize
    const rowImageHeight = imageSize
    
    const cellsHTML = row.map((image, cellIndex) => {
      const index = image.originalIndex
      
      // 检测图片类型（从URL或默认jpeg）
      const imageType = image.url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1]?.toLowerCase() || 'jpeg'
      // 生成随机的文件ID（9位数）
      const imgFileId = Math.floor(100000000 + Math.random() * 900000000)
      
      // 计算右边距和下边距（使用固定像素值，更稳定）
      const paddingRight = cellIndex < row.length - 1 ? gapPx : 0
      const paddingBottom = rowIndex < rows.length - 1 ? gapPx : 0
      
      // 使用统一的尺寸，确保同一行图片大小一致，美观整齐
      return `<td style="width: ${rowImageWidth}px; padding-right: ${paddingRight}px; padding-bottom: ${paddingBottom}px; vertical-align: top;" width="${rowImageWidth}">
        <img alt="图片" class="rich_pages wxw-img" data-ratio="1" data-s="300,640" data-type="${imageType}" data-w="1080" data-imgfileid="${imgFileId}" data-aistatus="1" style="width: ${rowImageWidth}px; height: ${rowImageHeight}px; display: block; border-radius: 16px; object-fit: cover;" data-original-style="width: ${rowImageWidth}px; height: ${rowImageHeight}px; display: block; border-radius: 16px; object-fit: cover;" data-src="${image.url}" data-index="${index}" src="${image.url}" _width="${rowImageWidth}" data-report-img-idx="${index}" data-fail="0" />
      </td>`
    }).join('')
    
    // 如果这一行的图片数量少于列数，需要填充空的 td
    const emptyCells = []
    for (let i = row.length; i < columns; i++) {
      const paddingRight = i < columns - 1 ? gapPx : 0
      const paddingBottom = rowIndex < rows.length - 1 ? gapPx : 0
      emptyCells.push(`<td style="width: ${rowImageWidth}px; padding-right: ${paddingRight}px; padding-bottom: ${paddingBottom}px;" width="${rowImageWidth}"></td>`)
    }
    
    return `<tr>
${cellsHTML}${emptyCells.join('')}
</tr>`
  }).join('\n')
  
  // 使用简单的 table 布局，避免复杂样式被过滤
  // 添加外层容器，设置 padding
  const html = `<section style="padding: ${padding}px; max-width: ${containerWidth}px; margin: 0 auto;">
<table style="width: 100%; border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0;" width="100%">
<tbody>
${rowsHTML}
</tbody>
</table>
</section>`
  
  return html
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

// 复制到剪贴板（复制渲染后的HTML内容）
const copyToClipboard = async () => {
  if (props.images.length === 0) return
  
  try {
    isCopying.value = true
    copySuccess.value = false
    
    const html = generateHTML()
    
    // 创建一个临时的可编辑div来渲染HTML
    const tempDiv = document.createElement('div')
    tempDiv.contentEditable = 'true'
    tempDiv.style.position = 'fixed'
    tempDiv.style.left = '-999999px'
    tempDiv.style.top = '-999999px'
    tempDiv.style.width = '640px'
    tempDiv.innerHTML = html
    document.body.appendChild(tempDiv)
    
    // 选中所有内容
    const range = document.createRange()
    range.selectNodeContents(tempDiv)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    
    // 使用 execCommand 复制（支持HTML格式）
    const success = document.execCommand('copy')
    
    // 清理
    selection.removeAllRanges()
    document.body.removeChild(tempDiv)
    
    if (!success) {
      throw new Error('execCommand copy failed')
    }
    
    copySuccess.value = true
    
    // 3秒后重置状态
    setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：尝试使用 Clipboard API
    try {
      const html = generateHTML()
      
      // 尝试使用 ClipboardItem API（支持HTML格式）
      if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
        const htmlBlob = new Blob([html], { type: 'text/html' })
        const textBlob = new Blob([html], { type: 'text/plain' })
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
        await navigator.clipboard.write([clipboardItem])
        copySuccess.value = true
        setTimeout(() => {
          copySuccess.value = false
        }, 3000)
      } else {
        // 最后降级：纯文本复制
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(html)
          copySuccess.value = true
          setTimeout(() => {
            copySuccess.value = false
          }, 3000)
        } else {
          alert('复制失败，请手动复制')
        }
      }
    } catch (fallbackError) {
      console.error('降级复制也失败:', fallbackError)
      alert('复制失败，请手动复制')
    }
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
  display: grid;
  gap: 1rem;
}

/* 网格布局 - 与 ImageLayout 保持一致 */
.article-image {
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  height: 200px;
}

.article-image:hover {
  transform: scale(1.06) translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 1;
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

/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.preview-close {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2001;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.preview-close svg {
  width: 24px;
  height: 24px;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.preview-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.preview-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.preview-nav .nav-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.preview-nav .nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.preview-nav .nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.preview-nav .nav-btn svg {
  width: 20px;
  height: 20px;
}

.preview-nav .nav-info {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: white;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

@media (max-width: 768px) {
  .preview-close {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }
  
  .preview-content {
    padding: 1rem;
  }
  
  .preview-nav {
    padding: 0.75rem 1.5rem;
    gap: 1.5rem;
  }
}
</style>
