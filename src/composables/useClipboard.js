import { ref } from 'vue'

/**
 * 通用剪贴板 composable
 * 支持：
 * 1. ClipboardItem 富文本复制（优先）
 * 2. execCommand 降级复制
 * 3. 纯文本复制兜底
 */
export function useClipboard() {
  const isCopying = ref(false)
  const copySuccess = ref(false)
  const lastError = ref(null)

  const resetSuccessLater = () => {
    window.setTimeout(() => {
      copySuccess.value = false
    }, 3000)
  }

  const copyHtml = async (html) => {
    if (!html || isCopying.value) return false

    isCopying.value = true
    copySuccess.value = false
    lastError.value = null

    try {
      // 1) ClipboardItem 富文本复制
      if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
        try {
          const htmlBlob = new Blob([html], { type: 'text/html' })
          const textBlob = new Blob([html], { type: 'text/plain' })
          const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          })
          await navigator.clipboard.write([clipboardItem])
          copySuccess.value = true
          resetSuccessLater()
          return true
        } catch (err) {
          console.warn('ClipboardItem API 失败，尝试降级方案:', err)
        }
      }

      // 2) execCommand 降级方案
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

      selection.removeAllRanges()
      document.body.removeChild(tempDiv)

      if (!success) {
        throw new Error('execCommand copy failed')
      }

      copySuccess.value = true
      resetSuccessLater()
      return true
    } catch (err) {
      console.error('复制 HTML 失败:', err)
      lastError.value = err

      // 3) 纯文本兜底
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(html)
          copySuccess.value = true
          resetSuccessLater()
          return true
        }
      } catch (fallbackErr) {
        console.error('纯文本复制也失败:', fallbackErr)
        lastError.value = fallbackErr
      }
      return false
    } finally {
      isCopying.value = false
    }
  }

  const copyText = async (text) => {
    return copyHtml(String(text ?? ''))
  }

  return {
    isCopying,
    copySuccess,
    lastError,
    copyHtml,
    copyText,
  }
}

