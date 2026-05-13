export function getDefaultValue(schema) {
  if (schema.default !== undefined) {
    return schema.default
  }
  
  const ui = schema['x-ui'] || {}
  
  switch (schema.type) {
    case 'object':
      const obj = {}
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          if (!prop.readOnly) {
            obj[key] = getDefaultValue(prop)
          }
        }
      }
      return obj
    case 'array':
      const minItems = ui.minItems || 0
      const items = []
      for (let i = 0; i < minItems; i++) {
        items.push(getDefaultValue(schema.items || {}))
      }
      return items
    case 'string':
      return ui.default ?? ''
    case 'number':
    case 'integer':
      return ui.default ?? 0
    case 'boolean':
      return ui.default ?? false
    default:
      return schema.nullable ? null : undefined
  }
}

export function getLabel(schema, propName) {
  return schema.title || schema['x-ui']?.label || propName
}

export function getWidget(schema) {
  const ui = schema['x-ui'] || {}
  
  if (ui.widget) {
    return ui.widget
  }
  
  switch (schema.type) {
    case 'string':
      if (schema.format === 'date') return 'DatePicker'
      if (schema.format === 'date-time') return 'DateTimePicker'
      if (schema.format === 'time') return 'TimePicker'
      if (schema.enum) return 'Select'
      return 'Input'
    case 'number':
    case 'integer':
      return 'InputNumber'
    case 'boolean':
      return 'Switch'
    case 'array':
      return 'ArrayField'
    case 'object':
      return 'ObjectField'
    default:
      return 'Input'
  }
}

export function getOptions(schema) {
  const ui = schema['x-ui'] || {}
  
  if (ui.options) {
    return ui.options
  }
  
  if (schema.enum) {
    return schema.enum.map(value => ({
      label: value,
      value
    }))
  }
  
  return []
}

export function getPath(prevPath, key) {
  return prevPath ? `${prevPath}.${key}` : key
}

export function getValueByPath(obj, path) {
  if (!path) return obj
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result === undefined || result === null) return undefined
    result = result[key]
  }
  return result
}

export function setValueByPath(obj, path, value) {
  if (!path) return value
  const keys = path.split('.')
  const lastKey = keys[keys.length - 1]
  let current = obj
  for (const key of keys.slice(0, -1)) {
    if (current[key] === undefined) {
      current[key] = {}
    }
    current = current[key]
  }
  current[lastKey] = value
  return obj
}

export function buildFormData(schema, initialValues = {}) {
  const defaultValue = getDefaultValue(schema)
  return mergeDeep(defaultValue, initialValues)
}

function mergeDeep(target, source) {
  if (!source || typeof source !== 'object') {
    return source
  }
  const output = { ...target }
  if (target && typeof target === 'object') {
    Object.keys(source).forEach(key => {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = mergeDeep(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  return output
}

export function createRules(schema, customRules = {}) {
  const rules = {}
  const ui = schema['x-ui'] || {}
  const fieldRules = []
  
  if (ui.required || schema.minLength !== undefined) {
    fieldRules.push({
      required: true,
      message: `请输入${getLabel(schema, '')}`,
      trigger: ui.requiredTrigger || 'blur'
    })
  }
  
  if (schema.minLength !== undefined) {
    fieldRules.push({
      min: schema.minLength,
      message: `最少输入 ${schema.minLength} 个字符`,
      trigger: 'blur'
    })
  }
  
  if (schema.maxLength !== undefined) {
    fieldRules.push({
      max: schema.maxLength,
      message: `最多输入 ${schema.maxLength} 个字符`,
      trigger: 'blur'
    })
  }
  
  if (schema.pattern) {
    fieldRules.push({
      pattern: new RegExp(schema.pattern),
      message: schema.errorMessage || '格式不正确',
      trigger: 'blur'
    })
  }
  
  if (schema.minimum !== undefined) {
    fieldRules.push({
      validator: (rule, value, callback) => {
        if (value !== undefined && value !== null && value !== '' && value < schema.minimum) {
          callback(new Error(`不能小于 ${schema.minimum}`))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    })
  }
  
  if (schema.maximum !== undefined) {
    fieldRules.push({
      validator: (rule, value, callback) => {
        if (value !== undefined && value !== null && value !== '' && value > schema.maximum) {
          callback(new Error(`不能大于 ${schema.maximum}`))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    })
  }
  
  if (ui.asyncValidator) {
    fieldRules.push({
      asyncValidator: ui.asyncValidator,
      trigger: ui.asyncValidatorTrigger || 'blur'
    })
  }
  
  if (customRules) {
    fieldRules.push(...customRules)
  }
  
  return fieldRules
}
