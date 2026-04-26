import DOMPurify from 'dompurify'

export const sanitizeHtml = (html, options = {}) => {
  if (!html || typeof html !== 'string') {
    return ''
  }

  const defaultOptions = {
    ALLOWED_TAGS: [
      'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i',
      'br', 'hr', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'code', 'a', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style',
      'target', 'rel', 'width', 'height'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'select', 'textarea'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
    USE_PROFILES: { html: true }
  }

  const sanitizeOptions = { ...defaultOptions, ...options }

  if (sanitizeOptions.ALLOWED_ATTR) {
    sanitizeOptions.ALLOWED_ATTR = sanitizeOptions.ALLOWED_ATTR.filter(attr => 
      !sanitizeOptions.FORBID_ATTR?.includes(attr)
    )
  }

  const purified = DOMPurify.sanitize(html, sanitizeOptions)
  
  return purified
}

export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:']
  try {
    const urlObj = new URL(url)
    if (!safeProtocols.includes(urlObj.protocol)) {
      return ''
    }
    return url
  } catch {
    return ''
  }
}

export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export const isSafeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return true
  }

  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import\s+/gi
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(html)) {
      return false
    }
  }

  return true
}
