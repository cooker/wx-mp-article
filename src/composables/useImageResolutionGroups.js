import { ref, computed } from 'vue'

/**
 * 图片分辨率分组与筛选 composable
 * - 负责按分辨率分组、排序
 * - 管理选中的分辨率集合
 * - 提供过滤后的图片列表
 */
export function useImageResolutionGroups(imagesRef) {
  const selectedResolutions = ref([])

  const resolutionGroups = computed(() => {
    const images = imagesRef.value || []
    if (!images.length) return []

    const groups = new Map()

    images.forEach((image) => {
      const width = image.width || 0
      const height = image.height || 0
      const resolution = `${width}x${height}`

      if (!groups.has(resolution)) {
        groups.set(resolution, {
          resolution,
          width,
          height,
          area: width * height,
          images: [],
        })
      }

      groups.get(resolution).images.push(image)
    })

    return Array.from(groups.values()).sort((a, b) => b.area - a.area)
  })

  const filteredImages = computed(() => {
    const images = imagesRef.value || []
    if (!selectedResolutions.value.length) return []

    const selectedSet = new Set(selectedResolutions.value)
    return images.filter((image) => {
      const width = image.width || 0
      const height = image.height || 0
      const resolution = `${width}x${height}`
      return selectedSet.has(resolution)
    })
  })

  const selectAllGroups = () => {
    selectedResolutions.value = resolutionGroups.value.map(group => group.resolution)
  }

  const deselectAllGroups = () => {
    selectedResolutions.value = []
  }

  const autoSelectNewResolutions = (newImages) => {
    const newResolutions = new Set()
    newImages.forEach((image) => {
      if (image.width && image.height) {
        const resolution = `${image.width}x${image.height}`
        newResolutions.add(resolution)
      }
    })

    newResolutions.forEach((resolution) => {
      if (!selectedResolutions.value.includes(resolution)) {
        selectedResolutions.value.push(resolution)
      }
    })
  }

  return {
    selectedResolutions,
    resolutionGroups,
    filteredImages,
    selectAllGroups,
    deselectAllGroups,
    autoSelectNewResolutions,
  }
}

