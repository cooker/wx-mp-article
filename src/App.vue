<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1 class="title">图片批量上传自动排版</h1>
        <p class="subtitle">上传多张图片，自动生成精美排版</p>
      </div>
    </header>

    <main class="main-content">
      <ImageUploader 
        @images-uploaded="handleImagesUploaded"
        @clear="handleClear"
      />
      
      <div v-if="images.length > 0" class="content-layout">
        <div class="layout-section">
          <ImageLayout 
            :images="images"
            :layout-mode="layoutMode"
            :grid-columns="gridColumns"
            @layout-change="handleLayoutChange"
            @grid-columns-change="handleGridColumnsChange"
          />
        </div>
        
        <div class="preview-section">
          <WeChatPreview 
            :images="images"
            :layout-mode="layoutMode"
            :grid-columns="gridColumns"
            :article-title="articleTitle"
            :author-name="authorName"
          />
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>支持拖拽上传，自动智能排版</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ImageUploader from './components/ImageUploader.vue'
import ImageLayout from './components/ImageLayout.vue'
import WeChatPreview from './components/WeChatPreview.vue'

const images = ref([])
const layoutMode = ref('grid')
const gridColumns = ref(3)
const articleTitle = ref('图片文章')
const authorName = ref('作者')

const handleImagesUploaded = (uploadedImages) => {
  images.value = uploadedImages
}

const handleClear = () => {
  images.value = []
}

const handleLayoutChange = (mode) => {
  layoutMode.value = mode
}

const handleGridColumnsChange = (columns) => {
  gridColumns.value = columns
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

.app::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.header {
  padding: 4rem 2rem 3rem;
  text-align: center;
  position: relative;
  z-index: 1;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 1rem;
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.subtitle {
  font-family: 'Inter', sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.main-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 2rem 5rem;
  position: relative;
  z-index: 1;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 2.5rem;
  align-items: start;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.layout-section {
  min-width: 0;
}

.preview-section {
  min-width: 0;
}

.footer {
  text-align: center;
  padding: 3rem 2rem 2rem;
  color: rgba(255, 255, 255, 0.85);
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  position: relative;
  z-index: 1;
  font-weight: 400;
}

@media (max-width: 1280px) {
  .content-layout {
    grid-template-columns: 1fr 380px;
    gap: 2rem;
  }
}

@media (max-width: 1024px) {
  .header {
    padding: 3rem 1.5rem 2rem;
  }
  
  .content-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .preview-section {
    order: -1;
  }
  
  .main-content {
    padding: 0 1.5rem 4rem;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 2.5rem 1rem 2rem;
  }
  
  .main-content {
    padding: 0 1rem 3rem;
  }
  
  .content-layout {
    gap: 1.5rem;
  }
  
  .footer {
    padding: 2rem 1rem 1.5rem;
  }
}
</style>
