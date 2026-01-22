<template>
  <div class="image-layout">
    <div class="layout-controls">
      <h2 class="controls-title">排版设置</h2>
      
      <!-- 网格列数设置 -->
      <div class="grid-columns-control">
        <label class="columns-label">列数设置</label>
        <div class="columns-buttons">
          <button
            v-for="cols in [2, 3, 4, 5, 6]"
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
        v-for="(image, index) in images" 
        :key="index"
        class="layout-item"
        :style="getItemStyle(image, index)"
        @click="openPreview(image, index)"
      >
        <img 
          :src="image.url" 
          :alt="`图片 ${index + 1}`"
          :loading="index > 8 ? 'lazy' : 'eager'"
          @load="onImageLoad($event, index)"
        />
        <div class="image-overlay">
          <span class="image-number">{{ index + 1 }}</span>
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
import { ref, watch } from 'vue'

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

const setGridColumns = (cols) => {
  localGridColumns.value = cols
  emit('grid-columns-change', cols)
}

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
  margin: 0 0 1.5rem;
  letter-spacing: -0.01em;
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
  
  .controls-title {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
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
