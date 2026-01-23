<template>
  <div class="image-layout">
    <div class="layout-controls">
      <div class="controls-header">
        <h2 class="controls-title">排版设置</h2>
        <button 
          v-if="images.length > 0"
          @click="copyToClipboard"
          class="copy-html-btn"
          :disabled="isCopying"
        >
          <svg v-if="!copySuccess" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-width="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-width="2"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ copySuccess ? '已复制' : '复制HTML' }}</span>
        </button>
      </div>
      
      <!-- 网格列数设置 -->
      <div class="grid-columns-control">
        <label class="columns-label">列数设置</label>
        <div class="columns-buttons">
          <button
            v-for="cols in [1, 2, 3, 4, 5, 6]"
            :key="cols"
            @click="setGridColumns(cols)"
            :class="['column-btn', { active: gridColumns === cols }]"
          >
            {{ cols }}列
          </button>
        </div>
      </div>
    </div>

    <div 
      class="layout-container layout-grid"
      :style="getContainerStyle()"
    >
      <div 
        v-for="(image, index) in groupedImages" 
        :key="image.originalIndex"
        class="layout-item"
        :style="getItemStyle(image, index)"
        @click="openPreview(image, image.originalIndex)"
      >
        <img 
          :src="image.url" 
          :alt="`图片 ${image.originalIndex + 1}`"
          :loading="index > 8 ? 'lazy' : 'eager'"
          @load="onImageLoad($event, image.originalIndex)"
        />
        <div class="image-overlay">
          <span class="image-number">{{ image.originalIndex + 1 }}</span>
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <div 
      v-if="previewImage"
      class="preview-modal"
      @click="closePreview"
    >
      <button class="modal-close" @click.stop="closePreview" aria-label="关闭">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
        </svg>
      </button>
      <div class="modal-content" @click.stop>
        <img :src="previewImage.url" :alt="`预览图 ${previewIndex + 1}`" />
        <div class="modal-nav">
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
import { ref, watch, computed } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    required: true
  },
  layoutMode: {
    type: String,
    default: 'grid'
  },
  gridColumns: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['layout-change', 'grid-columns-change'])

const previewImage = ref(null)
const previewIndex = ref(0)
const localGridColumns = ref(props.gridColumns)
const isCopying = ref(false)
const copySuccess = ref(false)

const setGridColumns = (cols) => {
  localGridColumns.value = cols
  emit('grid-columns-change', cols)
}

// 当前选中的列数（用于模板）
const gridColumns = computed(() => {
  return localGridColumns.value || props.gridColumns || 3
})

// 按尺寸分组并排序图片
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

const getContainerStyle = () => {
  const columns = localGridColumns.value || props.gridColumns || 3
  return {
    gridTemplateColumns: `repeat(${columns}, 1fr)`
  }
}

// 监听外部传入的 gridColumns 变化
watch(() => props.gridColumns, (newVal) => {
  localGridColumns.value = newVal
})

const onImageLoad = (event, index) => {
  // 图片加载完成后的处理（如果需要）
}

const getItemStyle = (image, index) => {
  // 只有网格模式，无需特殊样式
  return {}
}

// 监听布局模式变化
watch(() => props.layoutMode, () => {
  // 布局模式切换时的处理（如果需要）
})

// 监听窗口大小变化
const handleResize = () => {
  // 窗口大小变化时的处理（如果需要）
}

const openPreview = (image, index) => {
  previewImage.value = image
  previewIndex.value = index
  document.body.style.overflow = 'hidden'
}

const closePreview = () => {
  previewImage.value = null
  document.body.style.overflow = ''
}

const prevImage = () => {
  if (previewIndex.value > 0) {
    previewIndex.value--
    previewImage.value = props.images[previewIndex.value]
  }
}

const nextImage = () => {
  if (previewIndex.value < props.images.length - 1) {
    previewIndex.value++
    previewImage.value = props.images[previewIndex.value]
  }
}

// 生成 HTML 代码（按尺寸分组排序，优化显示效果）
const generateHTML = () => {
  const columns = localGridColumns.value || props.gridColumns || 3
  
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
    const imageWidth = imageSize
    const imageHeight = imageSize
    
    const cellsHTML = row.map((image, cellIndex) => {
      const index = image.originalIndex
      
      // 计算图片的实际宽高比（用于data-ratio属性）
      const ratio = image.width && image.height ? (image.width / image.height) : 1.0
      
      // 检测图片类型（从URL或默认jpeg）
      const imageType = image.url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1]?.toLowerCase() || 'jpeg'
      // 生成随机的文件ID（9位数）
      const imgFileId = Math.floor(100000000 + Math.random() * 900000000)
      
      // 计算右边距和下边距（使用固定像素值，更稳定）
      const paddingRight = cellIndex < row.length - 1 ? gapPx : 0
      const paddingBottom = rowIndex < rows.length - 1 ? gapPx : 0
      
      // 使用统一的尺寸，确保同一行图片大小一致，美观整齐
      return `<td style="width: ${imageWidth}px; padding-right: ${paddingRight}px; padding-bottom: ${paddingBottom}px; vertical-align: top;" width="${imageWidth}">
        <img alt="图片" class="rich_pages wxw-img" data-ratio="1" data-s="300,640" data-type="${imageType}" data-w="1080" data-imgfileid="${imgFileId}" data-aistatus="1" style="width: ${imageWidth}px; height: ${imageHeight}px; display: block; border-radius: 16px; object-fit: cover;" data-original-style="width: ${imageWidth}px; height: ${imageHeight}px; display: block; border-radius: 16px; object-fit: cover;" data-src="${image.url}" data-index="${index}" src="${image.url}" _width="${imageWidth}" data-report-img-idx="${index}" data-fail="0" />
      </td>`
    }).join('')
    
    // 如果这一行的图片数量少于列数，需要填充空的 td
    const emptyCells = []
    for (let i = row.length; i < columns; i++) {
      const paddingRight = i < columns - 1 ? gapPx : 0
      const paddingBottom = rowIndex < rows.length - 1 ? gapPx : 0
      emptyCells.push(`<td style="width: ${imageWidth}px; padding-right: ${paddingRight}px; padding-bottom: ${paddingBottom}px;" width="${imageWidth}"></td>`)
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

// 复制 HTML 到剪贴板
const copyToClipboard = async () => {
  if (isCopying.value || props.images.length === 0) {
    return
  }
  
  isCopying.value = true
  copySuccess.value = false
  
  try {
    const html = generateHTML()
    
    // 尝试使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.write) {
      try {
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
        return
      } catch (clipboardError) {
        console.warn('ClipboardItem API 失败，尝试降级方案:', clipboardError)
      }
    }
    
    // 降级方案：使用 execCommand
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.position = 'fixed'
    tempDiv.style.left = '-9999px'
    document.body.appendChild(tempDiv)
    
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(tempDiv)
    selection.removeAllRanges()
    selection.addRange(range)
    
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
    // 最后降级：纯文本复制
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generateHTML())
        copySuccess.value = true
        setTimeout(() => {
          copySuccess.value = false
        }, 3000)
      } else {
        alert('复制失败，请手动复制')
      }
    } catch (fallbackError) {
      console.error('降级复制也失败:', fallbackError)
      alert('复制失败，请手动复制')
    }
  } finally {
    isCopying.value = false
  }
}

// 键盘事件
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

// 组件挂载时添加键盘监听和窗口大小监听
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.image-layout {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.image-layout:hover {
  box-shadow: 
    0 25px 70px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

.layout-controls {
  margin-bottom: 2rem;
  padding-bottom: 1.75rem;
  border-bottom: 2px solid rgba(102, 126, 234, 0.12);
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.copy-html-btn {
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

.copy-html-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.copy-html-btn:active:not(:disabled) {
  transform: translateY(0);
}

.copy-html-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.copy-html-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.copy-html-btn span {
  font-weight: 500;
}

.grid-columns-control {
  margin-top: 0;
  padding-top: 0;
}

.columns-label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 1rem;
}

.columns-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.column-btn {
  padding: 0.625rem 1.25rem;
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
  border: 2px solid transparent;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.column-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.column-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.controls-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
  letter-spacing: -0.01em;
  flex: 1;
}

.layout-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.layout-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.75rem;
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
  border: 2px solid transparent;
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.layout-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.layout-btn:hover::before {
  left: 100%;
}

.layout-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2);
}

.layout-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 
    0 6px 20px rgba(102, 126, 234, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transform: translateY(-2px);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.layout-container {
  display: grid;
  gap: 1rem;
}

/* 网格布局 */
.layout-grid {
  grid-auto-rows: 200px;
  gap: 1rem;
}

.layout-grid .layout-item {
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.layout-grid .layout-item:hover {
  transform: scale(1.06) translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.layout-grid .layout-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}


.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 30%);
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1rem;
}

.layout-item:hover .image-overlay {
  opacity: 1;
}

.image-number {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  color: #1a202c;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
}

/* 预览模态框 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
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

.modal-close {
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
  z-index: 1001;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-close svg {
  width: 24px;
  height: 24px;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.modal-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-btn {
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

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

.nav-info {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: white;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
}

@media (max-width: 768px) {
  .image-layout {
    padding: 2rem 1.5rem;
    border-radius: 24px;
  }
  
  .layout-controls {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
  }
  
  .controls-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .controls-title {
    font-size: 1.25rem;
    margin-bottom: 0;
  }
  
  .copy-html-btn {
    width: 100%;
    justify-content: center;
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
  }
  
  .layout-buttons {
    gap: 0.75rem;
  }
  
  .layout-btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    border-radius: 12px;
  }
  
  .layout-grid {
    grid-auto-rows: 120px;
    gap: 1rem;
  }
  
  .grid-columns-control {
    margin-top: 1.25rem;
    padding-top: 1.25rem;
  }
  
  .columns-buttons {
    gap: 0.5rem;
  }
  
  .column-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }
  
  
  .modal-close {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .modal-nav {
    padding: 0.75rem 1.5rem;
    gap: 1.5rem;
  }
}
</style>
