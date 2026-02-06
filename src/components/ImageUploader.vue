<template>
  <div class="image-uploader-wrapper">
    <!-- 分辨率分组选择器 -->
    <div v-if="resolutionGroups.length > 0" class="resolution-filter-section">
      <div class="filter-header">
        <h3 class="filter-title">选择分辨率组</h3>
        <div class="filter-actions">
          <button @click="selectAllGroups" class="filter-action-btn">全选</button>
          <button @click="deselectAllGroups" class="filter-action-btn">全不选</button>
        </div>
      </div>
      <div class="resolution-groups">
        <label
          v-for="group in resolutionGroups"
          :key="group.resolution"
          class="resolution-group-item"
          :class="{ 'active': selectedResolutions.includes(group.resolution) }"
        >
          <input
            type="checkbox"
            :value="group.resolution"
            v-model="selectedResolutions"
            @change="onResolutionChange"
            class="resolution-checkbox"
          />
          <div class="group-info">
            <span class="group-resolution">{{ group.resolution }}</span>
            <span class="group-count">({{ group.images.length }}张)</span>
          </div>
        </label>
      </div>
    </div>
    
    <div class="image-uploader">
      <div 
        class="upload-area"
        :class="{ 'drag-over': isDragOver, 'has-images': images.length > 0 }"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          @change="handleFileSelect"
          class="file-input"
        />
        
        <div v-if="images.length === 0" class="upload-placeholder">
          <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="17 8 12 3 7 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3 class="upload-title">拖拽图片到这里</h3>
          <p class="upload-subtitle">或点击选择文件</p>
          <p class="upload-hint">支持 JPG、PNG、GIF 格式</p>
        </div>

        <div v-else class="uploaded-preview">
          <div class="preview-header" @click.stop>
            <span class="image-count">已选择 {{ images.length }} 张图片</span>
          </div>
        <div class="preview-grid" @click.stop>
          <div 
            v-for="(image, index) in images" 
            :key="index"
            class="preview-item"
            :class="{ 'uploading': image.isUploading, 'upload-error': image.uploadError }"
          >
            <img :src="image.url" :alt="`预览图 ${index + 1}`" />
            <div v-if="image.isUploading" class="upload-status">
              <div class="upload-spinner"></div>
              <span>{{ uploadProgress[index] || '上传中...' }}</span>
            </div>
            <div v-if="image.uploadError" class="upload-error-message">
              <span>上传失败</span>
            </div>
            <button 
              @click.stop="removeImage(index)"
              class="remove-btn"
              aria-label="删除图片"
              :disabled="image.isUploading"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div 
            class="preview-item add-more"
            @click.stop="triggerFileInput"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19" stroke-width="2"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke-width="2"/>
            </svg>
            <span>添加更多</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 清空按钮移到外面 -->
    <button 
      v-if="images.length > 0"
      @click="clearImages" 
      class="clear-btn-external" 
      type="button"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
      </svg>
      清空
    </button>
  </div>
  </div>
  
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGitHubRepoConfig, getCurrentDatePath } from '../composables/useGitHubRepoConfig'

const emit = defineEmits(['images-uploaded', 'clear'])

const fileInput = ref(null)
const images = ref([])
const isDragOver = ref(false)
const uploading = ref(false)
const uploadProgress = ref({})

// 选中的分辨率组（数组存储）
const selectedResolutions = ref([])

// 使用 GitHub 仓库配置（第一步配置）
const {
  owner,
  repo,
  token,
  uploadFileToGitHub: doUploadToGitHub,
  getJsdelivrUrlForRepo,
  pathPrefix
} = useGitHubRepoConfig()

// 按分辨率分组图片
const resolutionGroups = computed(() => {
  if (!images.value || images.value.length === 0) {
    return []
  }
  
  const groups = new Map()
  
  images.value.forEach((image) => {
    const width = image.width || 0
    const height = image.height || 0
    const resolution = `${width}x${height}`
    
    if (!groups.has(resolution)) {
      groups.set(resolution, {
        resolution,
        width,
        height,
        area: width * height,
        images: []
      })
    }
    
    groups.get(resolution).images.push(image)
  })
  
  // 转换为数组并按面积排序（大的在前）
  return Array.from(groups.values()).sort((a, b) => b.area - a.area)
})

// 根据选中的分辨率过滤图片
const filteredImages = computed(() => {
  if (selectedResolutions.value.length === 0) {
    return []
  }
  
  const selectedSet = new Set(selectedResolutions.value)
  return images.value.filter(image => {
    const width = image.width || 0
    const height = image.height || 0
    const resolution = `${width}x${height}`
    return selectedSet.has(resolution)
  })
})

// 全选所有分辨率组
const selectAllGroups = () => {
  selectedResolutions.value = resolutionGroups.value.map(group => group.resolution)
  onResolutionChange()
}

// 全不选
const deselectAllGroups = () => {
  selectedResolutions.value = []
  onResolutionChange()
}

// 分辨率选择变化时的处理
const onResolutionChange = () => {
  emit('images-uploaded', filteredImages.value)
}

// 自动选中新上传图片的分辨率组
const autoSelectNewResolutions = (newImages) => {
  const newResolutions = new Set()
  newImages.forEach(image => {
    if (image.width && image.height) {
      const resolution = `${image.width}x${image.height}`
      newResolutions.add(resolution)
    }
  })
  
  // 将新的分辨率添加到选中列表（如果还没有选中）
  newResolutions.forEach(resolution => {
    if (!selectedResolutions.value.includes(resolution)) {
      selectedResolutions.value.push(resolution)
    }
  })
  
  // 如果之前没有选中任何分辨率，自动选中所有
  if (selectedResolutions.value.length === 0 && resolutionGroups.value.length > 0) {
    selectedResolutions.value = resolutionGroups.value.map(group => group.resolution)
  }
}

// 发送过滤后的图片给父组件
const emitFilteredImages = () => {
  // 确保有选中的分辨率时才发送
  if (selectedResolutions.value.length > 0) {
    emit('images-uploaded', filteredImages.value)
  } else {
    emit('images-uploaded', [])
  }
}

// 监听 images 变化，自动选中新添加图片的分辨率组
watch(() => images.value.length, (newLength, oldLength) => {
  if (newLength > oldLength && resolutionGroups.value.length > 0) {
    // 如果有新图片添加，且之前没有选中任何分辨率，自动选中所有
    if (selectedResolutions.value.length === 0) {
      selectedResolutions.value = resolutionGroups.value.map(group => group.resolution)
      emitFilteredImages()
    }
  }
}, { immediate: false })

// 生成 UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 生成文件名 (时间戳-UUID.jpg)
const generateFileName = (originalFile) => {
  const timestamp = Date.now()
  const uuid = generateUUID()
  const extension = originalFile.name.split('.').pop() || 'jpg'
  return `${timestamp}-${uuid}.${extension}`
}

// 上传图片到 GitHub（使用第一步配置）
const uploadToGitHub = async (file, index) => {
  const o = owner.value.trim()
  const r = repo.value.trim()
  const t = token.value.trim()
  if (!o || !r || !t) {
    images.value[index].uploadError = true
    images.value[index].isUploading = false
    alert('请先在第一步配置 owner、repo 和 Token')
    return
  }

  try {
    uploadProgress.value[index] = '上传中...'

    const prefix = (pathPrefix.value || '').trim().replace(/\/+$/, '') || getCurrentDatePath()
    const fileName = generateFileName(file)
    const filePath = prefix ? `${prefix}/${fileName}` : fileName

    const result = await doUploadToGitHub(file, filePath)
    const cdnUrl = getJsdelivrUrlForRepo(result.repo, result.path)

    uploadProgress.value[index] = '上传成功'

    return {
      url: cdnUrl,
      file: file,
      width: 0,
      height: 0,
      aspectRatio: 1,
      githubPath: result.path
    }
  } catch (error) {
    console.error('上传失败:', error)
    uploadProgress.value[index] = '上传失败'
    throw error
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  processFiles(files)
  event.target.value = '' // 重置 input
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  const files = Array.from(event.dataTransfer.files).filter(file => 
    file.type.startsWith('image/')
  )
  processFiles(files)
}

const processFiles = async (files) => {
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) return
  
  // 先显示本地预览
  const localPreviews = []
  for (const file of imageFiles) {
    const reader = new FileReader()
    const preview = await new Promise((resolve) => {
      reader.onload = (e) => {
        const imageUrl = e.target.result
        const img = new Image()
        img.onload = () => {
          resolve({
            url: imageUrl,
            file: file,
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height,
            isUploading: true
          })
        }
        img.src = imageUrl
      }
      reader.readAsDataURL(file)
    })
    localPreviews.push(preview)
  }
  
  // 添加到 images，显示上传状态
  const startIndex = images.value.length
  images.value = [...images.value, ...localPreviews]
  
  // 自动选中新上传图片的分辨率组
  autoSelectNewResolutions(localPreviews)
  emitFilteredImages()
  
  // 并发上传到 GitHub
  const uploadOne = async (file, index) => {
    try {
      const uploadedImage = await uploadToGitHub(file, index)
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = () => {
          uploadedImage.width = img.width
          uploadedImage.height = img.height
          uploadedImage.aspectRatio = img.width / img.height
          resolve()
        }
        img.onerror = reject
        img.src = uploadedImage.url
      })
      images.value[index] = uploadedImage
      delete uploadProgress.value[index]
      autoSelectNewResolutions([uploadedImage])
      emitFilteredImages()
    } catch (error) {
      console.error(`图片 ${index - startIndex + 1} 上传失败:`, error)
      images.value[index].uploadError = true
      images.value[index].isUploading = false
      emitFilteredImages()
    }
  }

  uploading.value = true
  try {
    await Promise.all(
      imageFiles.map((file, i) => uploadOne(file, startIndex + i))
    )
  } finally {
    uploading.value = false
  }
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  if (images.value.length === 0) {
    selectedResolutions.value = []
    emit('clear')
  } else {
    emitFilteredImages()
  }
}

const clearImages = (event) => {
  // 确保阻止事件冒泡和默认行为
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  images.value = []
  selectedResolutions.value = []
  uploadProgress.value = {}
  uploading.value = false
  isDragOver.value = false
  // 重置文件输入框
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  // 同时触发两个事件，确保父组件状态同步
  emit('images-uploaded', [])
  emit('clear')
}
</script>

<style scoped>
/* 分辨率分组选择器样式 */
.resolution-filter-section {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-title {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-action-btn {
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
}

.filter-action-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.resolution-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.resolution-group-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(102, 126, 234, 0.05);
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.resolution-group-item:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.resolution-group-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.resolution-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Inter', sans-serif;
}

.group-resolution {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a202c;
}

.group-count {
  font-size: 0.8125rem;
  color: #718096;
}

.image-uploader-wrapper {
  margin-bottom: 3rem;
  position: relative;
}

.image-uploader {
  margin-bottom: 0;
}

.upload-area {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 3px dashed rgba(102, 126, 234, 0.25);
  padding: 3rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-area:hover::before {
  opacity: 1;
}

.upload-area.drag-over {
  border-color: rgba(102, 126, 234, 0.7);
  background: rgba(255, 255, 255, 1);
  transform: scale(1.01) translateY(-4px);
  box-shadow: 
    0 30px 80px rgba(102, 126, 234, 0.35),
    0 0 0 1px rgba(102, 126, 234, 0.2) inset;
  border-style: solid;
}

.upload-area.has-images {
  padding: 2rem;
  border-style: solid;
  border-color: rgba(102, 126, 234, 0.15);
  border-width: 2px;
}

.file-input {
  display: none;
}

.upload-placeholder {
  text-align: center;
  padding: 2rem 0;
}

.upload-icon {
  width: 64px;
  height: 64px;
  color: #667eea;
  margin: 0 auto 1.5rem;
  display: block;
}

.upload-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.5rem;
}

.upload-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #4a5568;
  margin: 0 0 0.25rem;
}

.upload-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #718096;
  margin: 0.5rem 0 0;
}

.uploaded-preview {
  width: 100%;
}

.preview-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.image-count {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.clear-btn svg {
  width: 16px;
  height: 16px;
}

/* 外部清空按钮样式 */
.clear-btn-external {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  width: 100%;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.clear-btn-external:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.clear-btn-external:active {
  transform: translateY(0);
}

.clear-btn-external svg {
  width: 18px;
  height: 18px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.25rem;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  background: #f7fafc;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.preview-item:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  z-index: 5;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.preview-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn svg {
  width: 14px;
  height: 14px;
}

.add-more {
  border: 2px dashed rgba(102, 126, 234, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.add-more:hover {
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(102, 126, 234, 0.1);
}

.add-more svg {
  width: 32px;
  height: 32px;
}

.add-more span {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
}

.preview-item.uploading {
  opacity: 0.7;
  pointer-events: none;
}

.preview-item.upload-error {
  border: 2px solid #ef4444;
}

.upload-status {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #667eea;
  font-weight: 500;
  z-index: 10;
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(239, 68, 68, 0.95);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: white;
  font-weight: 500;
  z-index: 10;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .upload-area {
    padding: 2rem 1.5rem;
  }
  
  .preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.75rem;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
