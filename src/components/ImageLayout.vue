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
      
      <!-- 分辨率组信息 -->
      <div v-if="currentResolutionGroups.length > 0" class="resolution-info-section">
        <label class="resolution-info-label">当前显示的分辨率组：</label>
        <div class="resolution-tags">
          <span
            v-for="group in currentResolutionGroups"
            :key="group.resolution"
            class="resolution-tag"
          >
            {{ group.resolution }} ({{ group.count }}张)
          </span>
        </div>
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
      v-if="groupedImages.length > 0"
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
    
    <!-- 空状态提示 -->
    <div v-else class="empty-state">
      <p class="empty-message">请在上传区域选择要显示的分辨率组</p>
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
import { useClipboard } from '../composables/useClipboard'
import { useHtmlTemplate } from '../composables/useHtmlTemplate'

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
const { isCopying, copySuccess, copyHtml } = useClipboard()

const setGridColumns = (cols) => {
  localGridColumns.value = cols
  emit('grid-columns-change', cols)
}

// 当前选中的列数（用于模板）
const gridColumns = computed(() => {
  return localGridColumns.value || props.gridColumns || 3
})

// 获取当前显示的分辨率组信息
const currentResolutionGroups = computed(() => {
  if (!props.images || props.images.length === 0) {
    return []
  }
  
  // 按分辨率分组
  const groups = new Map()
  
  props.images.forEach((image) => {
    const width = image.width || 0
    const height = image.height || 0
    const resolution = `${width}x${height}`
    
    if (!groups.has(resolution)) {
      groups.set(resolution, {
        resolution,
        width,
        height,
        area: width * height,
        count: 0
      })
    }
    
    groups.get(resolution).count++
  })
  
  // 转换为数组并按面积排序（大的在前）
  return Array.from(groups.values()).sort((a, b) => {
    if (a.area !== b.area) {
      return b.area - a.area
    }
    if (a.width !== b.width) {
      return b.width - a.width
    }
    return b.height - a.height
  })
})

// 使用通用 HTML 模板生成逻辑（目前专注微信公众号）
const { html, groupedImages } = useHtmlTemplate(
  computed(() => props.images || []),
  computed(() => ({
    columns: localGridColumns.value || props.gridColumns || 3,
    siteId: 'wechat',
  })),
)

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

// 复制 HTML 到剪贴板
const copyToClipboard = async () => {
  if (isCopying.value || props.images.length === 0) {
    return
  }
  const success = await copyHtml(html.value)
  if (!success) {
    alert('复制失败，请手动复制')
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

<style scoped src="../styles/ImageLayout.css"></style>
