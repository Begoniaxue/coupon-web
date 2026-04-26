const sanitizeHtmlForApi = (html) => {
  if (!html || typeof html !== 'string') {
    return ''
  }

  const allowedTags = [
    'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i',
    'br', 'hr', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code', 'a', 'img'
  ]

  const allowedAttrs = [
    'href', 'src', 'alt', 'title', 'class', 'style',
    'target', 'rel', 'width', 'height'
  ]

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      
      if (!allowedTags.includes(tagName)) {
        const parent = node.parentNode
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node)
        }
        parent.removeChild(node)
        return
      }

      const attrs = Array.from(node.attributes)
      for (const attr of attrs) {
        if (!allowedAttrs.includes(attr.name.toLowerCase())) {
          node.removeAttribute(attr.name)
        } else if (attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'src') {
          const value = attr.value.toLowerCase()
          if (value.startsWith('javascript:') || 
              value.startsWith('data:') || 
              value.startsWith('vbscript:')) {
            node.removeAttribute(attr.name)
          }
        }
      }

      const styleAttr = node.getAttribute('style')
      if (styleAttr) {
        const dangerousPatterns = [
          /javascript:/i,
          /expression\s*\(/i,
          /url\s*\(/i,
          /@import\s+/i
        ]
        for (const pattern of dangerousPatterns) {
          if (pattern.test(styleAttr)) {
            node.removeAttribute('style')
            break
          }
        }
      }

      for (const child of Array.from(node.childNodes)) {
        sanitizeNode(child)
      }
    }
  }

  for (const child of Array.from(tempDiv.childNodes)) {
    sanitizeNode(child)
  }

  return tempDiv.innerHTML
}

const mockFlashSales = [
  {
    id: 1,
    title: '限时秒杀活动',
    subtitle: '全场商品低至5折起',
    mainImage: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: '<p>这是限时秒杀活动的详情内容</p><p>规则说明：</p><ul><li>每人限购一件</li><li>先到先得，售完即止</li><li>不与其他优惠叠加</li></ul>',
    projectId: 1,
    projectName: '万达广场',
    couponId: 2,
    couponName: '会员折扣券',
    startTime: new Date(Date.now() - 3600000 * 24).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    endTime: new Date(Date.now() + 3600000 * 24 * 6).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    createTime: new Date(Date.now() - 3600000 * 24 * 2).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    status: 1
  },
  {
    id: 2,
    title: '周末特惠秒杀',
    subtitle: '周末狂欢，限时折扣',
    mainImage: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
    content: '<p>周末特惠秒杀活动，错过再等一周！</p>',
    projectId: 2,
    projectName: '银泰中心',
    couponId: 2,
    couponName: '会员折扣券',
    startTime: new Date(Date.now() - 3600000 * 48).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    endTime: new Date(Date.now() - 3600000 * 24).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    createTime: new Date(Date.now() - 3600000 * 72).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    status: 2
  },
  {
    id: 3,
    title: '即将开始的秒杀',
    subtitle: '敬请期待',
    mainImage: 'https://fuss10.elemecdn.com/2/11/6535bcfb26e4c79b48ddde44f476fpeg.png',
    content: '<p>即将开始的秒杀活动内容</p>',
    projectId: null,
    projectName: '',
    couponId: 2,
    couponName: '会员折扣券',
    startTime: new Date(Date.now() + 3600000 * 24).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    endTime: new Date(Date.now() + 3600000 * 24 * 5).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    createTime: new Date(Date.now()).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    status: 0
  }
]

let flashSales = [...mockFlashSales]
let nextId = 4

const getStatusByTime = (startTime, endTime) => {
  const now = new Date()
  const start = new Date(startTime.replace(/-/g, '/'))
  const end = new Date(endTime.replace(/-/g, '/'))
  
  if (now < start) return 0
  if (now >= start && now <= end) return 1
  return 2
}

export const getFlashSaleList = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredList = flashSales.map(item => ({
        ...item,
        status: getStatusByTime(item.startTime, item.endTime)
      }))
      
      if (params.title) {
        filteredList = filteredList.filter(item => 
          item.title.includes(params.title)
        )
      }
      
      if (params.status !== undefined && params.status !== '') {
        filteredList = filteredList.filter(item => 
          item.status === Number(params.status)
        )
      }
      
      if (params.projectIds && params.projectIds.length > 0) {
        const projectIds = params.projectIds.map(Number)
        filteredList = filteredList.filter(item => 
          projectIds.includes(item.projectId)
        )
      }
      
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      const list = filteredList.slice(startIndex, endIndex)
      
      resolve({
        code: 200,
        data: {
          list,
          total: filteredList.length,
          page,
          pageSize
        },
        message: 'success'
      })
    }, 300)
  })
}

export const getFlashSaleDetail = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const flashSale = flashSales.find(item => item.id === Number(id))
      if (flashSale) {
        resolve({
          code: 200,
          data: {
            ...flashSale,
            status: getStatusByTime(flashSale.startTime, flashSale.endTime)
          },
          message: 'success'
        })
      } else {
        reject({
          code: 404,
          message: '秒杀活动不存在'
        })
      }
    }, 300)
  })
}

export const createFlashSale = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sanitizedData = {
        ...data,
        content: sanitizeHtmlForApi(data.content)
      }
      
      const newFlashSale = {
        id: nextId++,
        ...sanitizedData,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      }
      flashSales.unshift(newFlashSale)
      resolve({
        code: 200,
        data: { id: newFlashSale.id },
        message: '创建成功'
      })
    }, 500)
  })
}

export const updateFlashSale = (id, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = flashSales.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        const sanitizedData = {
          ...data,
          content: data.content !== undefined ? sanitizeHtmlForApi(data.content) : flashSales[index].content
        }
        
        flashSales[index] = { ...flashSales[index], ...sanitizedData }
        resolve({
          code: 200,
          message: '更新成功'
        })
      } else {
        reject({
          code: 404,
          message: '秒杀活动不存在'
        })
      }
    }, 500)
  })
}

export const deleteFlashSale = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = flashSales.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        flashSales.splice(index, 1)
        resolve({
          code: 200,
          message: '删除成功'
        })
      } else {
        reject({
          code: 404,
          message: '秒杀活动不存在'
        })
      }
    }, 300)
  })
}

