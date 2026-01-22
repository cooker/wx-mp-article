<template>
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
        <div class="preview-header">
          <span class="image-count">已选择 {{ images.length }} 张图片</span>
          <button @click.stop="clearImages" class="clear-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
            </svg>
            清空
          </button>
        </div>
        <div class="preview-grid">
          <div 
            v-for="(image, index) in images" 
            :key="index"
            class="preview-item"
          >
            <img :src="image.url" :alt="`预览图 ${index + 1}`" />
            <button 
              @click.stop="removeImage(index)"
              class="remove-btn"
              aria-label="删除图片"
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
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['images-uploaded', 'clear'])

const fileInput = ref(null)
const images = ref([])
const isDragOver = ref(false)

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

const processFiles = (files) => {
  const newImages = []
  
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target.result
        const img = new Image()
        img.onload = () => {
          newImages.push({
            url: imageUrl,
            file: file,
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height
          })
          
          // 当所有图片加载完成后，更新 images
          if (newImages.length === files.length) {
            images.value = [...images.value, ...newImages]
            emit('images-uploaded', images.value)
          }
        }
        img.src = imageUrl
      }
      reader.readAsDataURL(file)
    }
  })
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  if (images.value.length === 0) {
    emit('clear')
  } else {
    emit('images-uploaded', images.value)
  }
}

const clearImages = () => {
  images.value = []
  emit('clear')
}
</script>

<style scoped>
.image-uploader {
  margin-bottom: 3rem;
}

.upload-area {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 28px;
  border: 3px dashed rgba(102, 126, 234, 0.25);
  padding: 3.5rem;
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
  padding: 2.5rem;
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
  justify-content: space-between;
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
