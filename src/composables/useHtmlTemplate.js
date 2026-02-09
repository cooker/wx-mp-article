import { computed } from 'vue'

/**
 * HTML 模板生成 composable
 *
 * 目前实现：
 * - 专注于微信公众号图片排版（table + img.rich_pages）
 * - 按图片尺寸分组排序，统一行内尺寸，结构尽量简洁，降低被过滤风险
 *
 * 未来可扩展：
 * - 支持多站点（juejin / zhihu / blog 等）
 * - 输出 Markdown 或其他 HTML 结构
 */
export function useHtmlTemplate(imagesRef, optionsRef = {}) {
  const normalizedOptions = computed(() => {
    const opts = optionsRef?.value ?? optionsRef ?? {}
    return {
      columns: opts.columns || 3,
      containerWidth: opts.containerWidth || 640,
      gapPx: opts.gapPx || 16,
      padding: opts.padding || 16,
      siteId: opts.siteId || 'wechat',
    }
  })

  const groupedImages = computed(() => {
    const images = imagesRef?.value ?? imagesRef ?? []
    if (!Array.isArray(images) || images.length === 0) return []

    const sizeGroups = new Map()

    images.forEach((image, index) => {
      const width = image.width || 0
      const height = image.height || 0
      const sizeKey = `${width}x${height}`

      if (!sizeGroups.has(sizeKey)) {
        sizeGroups.set(sizeKey, {
          sizeKey,
          width,
          height,
          area: width * height,
          images: [],
        })
      }

      sizeGroups.get(sizeKey).images.push({
        ...image,
        originalIndex: index,
      })
    })

    const groups = Array.from(sizeGroups.values()).sort((a, b) => {
      if (a.area !== b.area) return b.area - a.area
      if (a.width !== b.width) return b.width - a.width
      return b.height - a.height
    })

    return groups.flatMap(group => group.images)
  })

  const generateWeChatHtml = () => {
    const images = groupedImages.value
    if (!images.length) return ''

    const {
      columns,
      containerWidth,
      gapPx,
      padding,
    } = normalizedOptions.value

    const cols = Math.max(1, Math.min(columns, 6))

    const rows = []
    for (let i = 0; i < images.length; i += cols) {
      rows.push(images.slice(i, i + cols))
    }

    const rowsHTML = rows.map((row, rowIndex) => {
      const availableWidth = containerWidth - padding * 2 - (row.length - 1) * gapPx
      const imageSize = Math.floor(availableWidth / row.length)
      const imageWidth = imageSize
      const imageHeight = imageSize

      const cellsHTML = row.map((image, cellIndex) => {
        const index = image.originalIndex
        const imageType = image.url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1]?.toLowerCase() || 'jpeg'
        const imgFileId = Math.floor(100000000 + Math.random() * 900000000)

        const paddingRight = cellIndex < row.length - 1 ? gapPx : 0
        const paddingBottom = rowIndex < rows.length - 1 ? gapPx : 0

        return `<td style="width: ${imageWidth}px; padding-right: ${paddingRight}px; padding-bottom: ${paddingBottom}px; vertical-align: top;" width="${imageWidth}">
  <img alt="图片" class="rich_pages wxw-img" data-ratio="1" data-s="300,640" data-type="${imageType}" data-w="1080" data-imgfileid="${imgFileId}" data-aistatus="1" style="width: ${imageWidth}px; height: ${imageHeight}px; display: block; border-radius: 16px; object-fit: cover;" data-original-style="width: ${imageWidth}px; height: ${imageHeight}px; display: block; border-radius: 16px; object-fit: cover;" data-src="${image.url}" data-index="${index}" src="${image.url}" _width="${imageWidth}" data-report-img-idx="${index}" data-fail="0" />
</td>`
      }).join('')

      const emptyCells = []
      for (let i = row.length; i < cols; i++) {
        const paddingRight = i < cols - 1 ? gapPx : 0
        const paddingBottom = rowIndex < rows.length - 1 ? gapPx : 0
        emptyCells.push(`<td style="width: ${imageWidth}px; padding-right: ${paddingRight}px; padding-bottom: ${paddingBottom}px;" width="${imageWidth}"></td>`)
      }

      return `<tr>
${cellsHTML}${emptyCells.join('')}
</tr>`
    }).join('\n')

    return `<section style="padding: ${padding}px; max-width: ${containerWidth}px; margin: 0 auto;">
<table style="width: 100%; border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0;" width="100%">
<tbody>
${rowsHTML}
</tbody>
</table>
</section>`
  }

  const html = computed(() => {
    const siteId = normalizedOptions.value.siteId
    switch (siteId) {
      // 目前仅实现 wechat，其他站点返回同样结构，占位以便后续扩展
      case 'wechat':
      default:
        return generateWeChatHtml()
    }
  })

  const generate = () => html.value

  return {
    html,
    generate,
    groupedImages,
    options: normalizedOptions,
  }
}

