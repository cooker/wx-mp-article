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
              <button
                type="button"
                class="retry-btn"
                @click.stop="retryUpload(index)"
                :disabled="image.isUploading"
              >
                重试
              </button>
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
import { useImageResolutionGroups } from '../composables/useImageResolutionGroups'

const emit = defineEmits(['images-uploaded', 'clear'])

const fileInput = ref(null)
const images = ref([])
const isDragOver = ref(false)
const uploading = ref(false)
const uploadProgress = ref({})

// 分辨率分组与过滤由 composable 统一管理
const {
  selectedResolutions,
  resolutionGroups,
  filteredImages,
  selectAllGroups,
  deselectAllGroups,
  autoSelectNewResolutions,
} = useImageResolutionGroups(images)

// 使用 GitHub 仓库配置（第一步配置）
const {
  owner,
  repo,
  token,
  uploadFileToGitHub: doUploadToGitHub,
  getJsdelivrUrlForRepo,
  pathPrefix
} = useGitHubRepoConfig()

// resolutionGroups / filteredImages 由 useImageResolutionGroups 提供

// 分辨率选择变化时的处理
const onResolutionChange = () => {
  emit('images-uploaded', filteredImages.value)
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

// 生成文件名 (时间戳-UUID.jpg)，.jfif 统一改为 .jpg
const generateFileName = (originalFile) => {
  const timestamp = Date.now()
  const uuid = generateUUID()
  let extension = originalFile.name.split('.').pop()?.toLowerCase() || 'jpg'
  if (extension === 'jfif') extension = 'jpg'
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
  uploading.value = true
  try {
    await Promise.all(
      imageFiles.map((file, i) => uploadOne(file, startIndex + i))
    )
  } finally {
    uploading.value = false
  }
}

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
    console.error(`图片 ${index + 1} 上传失败:`, error)
    images.value[index].uploadError = true
    images.value[index].isUploading = false
    emitFilteredImages()
  }
}

const retryUpload = async (index) => {
  const image = images.value[index]
  if (!image?.file) return
  delete image.uploadError
  image.isUploading = true
  emitFilteredImages()
  await uploadOne(image.file, index)
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

<style scoped src="../styles/ImageUploader.css"></style>
