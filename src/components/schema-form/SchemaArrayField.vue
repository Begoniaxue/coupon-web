<template>
  <div class="schema-array-field">
    <div v-if="items.length === 0" class="array-empty">
      <el-empty description="暂无数据" :image-size="80">
        <template #default>
          <el-button type="primary" link @click="addItem">
            <el-icon><Plus /></el-icon>
            添加
          </el-button>
        </template>
      </el-empty>
    </div>
    
    <div v-else class="array-items">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="array-item"
      >
        <div class="array-item-header">
          <span class="array-item-title">
            {{ ui.itemTitle || `第 ${index + 1} 项` }}
          </span>
          <div class="array-item-actions">
            <el-button
              v-if="!ui.disableSort && index > 0"
              type="text"
              size="small"
              title="上移"
              @click="moveItem(index, index - 1)"
            >
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button
              v-if="!ui.disableSort && index < items.length - 1"
              type="text"
              size="small"
              title="下移"
              @click="moveItem(index, index + 1)"
            >
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-button
              v-if="items.length > minItems && !ui.disableRemove"
              type="text"
              size="small"
              class="remove-btn"
              title="删除"
              @click="removeItem(index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="array-item-content">
          <template v-if="itemSchema.type === 'object'">
            <template v-for="(propSchema, propName) in itemSchema.properties" :key="propName">
              <SchemaField
                :schema="propSchema"
                :field-name="propName"
                :model-value="item[propName]"
                :path="`${path}.${index}.${propName}`"
                :parent-schema="itemSchema"
                :form-data="formData"
                @update:model-value="handleItemPropChange(index, propName, $event)"
              />
            </template>
          </template>
          
          <template v-else>
            <SchemaField
              :schema="itemSchema"
              :field-name="''"
              :model-value="item"
              :path="`${path}.${index}`"
              :parent-schema="schema"
              :form-data="formData"
              @update:model-value="handleItemChange(index, $event)"
            />
          </template>
        </div>
      </div>
    </div>
    
    <div v-if="items.length > 0" class="array-add-row">
      <el-button
        v-if="items.length < maxItems"
        type="primary"
        link
        :loading="adding"
        @click="addItem"
      >
        <el-icon><Plus /></el-icon>
        {{ ui.addButtonText || '添加一项' }}
      </el-button>
      <span v-if="items.length >= maxItems" class="max-hint">
        最多只能添加 {{ maxItems }} 项
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Plus, Delete, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import SchemaField from './SchemaField.vue'
import { getDefaultValue, getPath } from './utils/schema-parser'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  path: {
    type: String,
    default: ''
  },
  formData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'validate'])

const ui = computed(() => props.schema['x-ui'] || {})
const itemSchema = computed(() => props.schema.items || { type: 'string' })

const minItems = computed(() => props.schema.minItems || ui.value.minItems || 0)
const maxItems = computed(() => props.schema.maxItems || ui.value.maxItems || Infinity)

const items = ref([])
const adding = ref(false)

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    items.value = JSON.parse(JSON.stringify(newVal))
  }
}, { immediate: true, deep: true })

const createNewItem = () => {
  return getDefaultValue(itemSchema.value)
}

const addItem = async () => {
  if (items.value.length >= maxItems.value) return
  
  adding.value = true
  
  try {
    if (ui.value.beforeAdd) {
      const result = await ui.value.beforeAdd(items.value)
      if (result === false) {
        adding.value = false
        return
      }
    }
    
    const newItem = createNewItem()
    items.value.push(newItem)
    emitChange()
    
    if (ui.value.afterAdd) {
      ui.value.afterAdd(items.value.length - 1, newItem)
    }
  } finally {
    adding.value = false
  }
}

const removeItem = async (index) => {
  if (items.value.length <= minItems.value) return
  
  if (ui.value.beforeRemove) {
    const result = await ui.value.beforeRemove(index, items.value[index])
    if (result === false) return
  }
  
  items.value.splice(index, 1)
  emitChange()
  
  if (ui.value.afterRemove) {
    ui.value.afterRemove(index)
  }
}

const moveItem = (fromIndex, toIndex) => {
  if (fromIndex === toIndex) return
  
  const item = items.value.splice(fromIndex, 1)[0]
  items.value.splice(toIndex, 0, item)
  emitChange()
}

const handleItemChange = (index, value) => {
  items.value[index] = value
  emitChange()
}

const handleItemPropChange = (index, propName, value) => {
  items.value[index][propName] = value
  emitChange()
}

const emitChange = () => {
  emit('update:modelValue', JSON.parse(JSON.stringify(items.value)))
}
</script>

<style scoped>
.schema-array-field {
  width: 100%;
}

.array-empty {
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
}

.array-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.array-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.array-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.array-item-title {
  font-weight: 500;
  color: #303133;
}

.array-item-actions {
  display: flex;
  gap: 4px;
}

.remove-btn {
  color: #f56c6c !important;
}

.remove-btn:hover {
  color: #f78989 !important;
}

.array-item-content {
  padding: 16px;
}

.array-item-content :deep(.el-form-item) {
  margin-bottom: 18px;
}

.array-item-content :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.array-add-row {
  margin-top: 16px;
}

.max-hint {
  color: #909399;
  font-size: 12px;
}
</style>
