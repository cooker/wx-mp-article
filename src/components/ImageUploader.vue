<template>
  <div class="image-uploader-wrapper">
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
import { ref } from 'vue'

const emit = defineEmits(['images-uploaded', 'clear'])

const fileInput = ref(null)
const images = ref([])
const isDragOver = ref(false)
const uploading = ref(false)
const uploadProgress = ref({})

const KEY = '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'
const USER = 'bucketio'
const CDN_BASE = 'https://fastly.jsdelivr.net/gh/bucketio'

// 生成 UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 获取当前日期路径 (格式: 2026/01/22)
const getDatePath = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// 选择仓库 (img0-img19)
let currentRepoIndex = 0
const getRepoName = () => {
  const repoName = `img${currentRepoIndex}`
  currentRepoIndex = (currentRepoIndex + 1) % 20 // 轮询 0-19
  return repoName
}

// 生成文件名 (时间戳-UUID.jpg)
const generateFileName = (originalFile) => {
  const timestamp = Date.now()
  const uuid = generateUUID()
  const extension = originalFile.name.split('.').pop() || 'jpg'
  return `${timestamp}-${uuid}.${extension}`
}

// 将文件转换为 base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1] // 移除 data:image/...;base64, 前缀
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 上传图片到 GitHub
const uploadToGitHub = async (file, index) => {
  try {
    uploading.value = true
    uploadProgress.value[index] = '上传中...'
    
    const repoName = getRepoName()
    const datePath = getDatePath()
    const fileName = generateFileName(file)
    const filePath = `${datePath}/${fileName}`
    
    // 转换为 base64
    const base64Content = await fileToBase64(file)
    
    // GitHub API 上传
    const apiUrl = `https://api.github.com/repos/${USER}/${repoName}/contents/${filePath}`
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Upload image: ${fileName}`,
        content: base64Content,
        branch: 'main'
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '上传失败')
    }
    
    const data = await response.json()
    const cdnUrl = `${CDN_BASE}/${repoName}@main/${data.content.path}`
    
    uploadProgress.value[index] = '上传成功'
    
    return {
      url: cdnUrl,
      file: file,
      width: 0,
      height: 0,
      aspectRatio: 1,
      githubPath: data.content.path
    }
  } catch (error) {
    console.error('上传失败:', error)
    uploadProgress.value[index] = '上传失败'
    throw error
  } finally {
    uploading.value = false
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
  emit('images-uploaded', images.value)
  
  // 逐个上传到 GitHub
  const uploadedImages = []
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    const index = startIndex + i
    
    try {
      const uploadedImage = await uploadToGitHub(file, index)
      
      // 获取图片尺寸
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
      
      uploadedImages.push(uploadedImage)
      
      // 更新对应位置的图片
      images.value[index] = uploadedImage
      emit('images-uploaded', images.value)
      
      // 清除上传状态
      delete uploadProgress.value[index]
    } catch (error) {
      console.error(`图片 ${i + 1} 上传失败:`, error)
      // 保留本地预览，但标记为上传失败
      images.value[index].uploadError = true
      images.value[index].isUploading = false
      emit('images-uploaded', images.value)
    }
  }
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  if (images.value.length === 0) {
    emit('clear')
  } else {
    emit('images-uploaded', images.value)
  }
}

const clearImages = (event) => {
  // 确保阻止事件冒泡和默认行为
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  images.value = []
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
