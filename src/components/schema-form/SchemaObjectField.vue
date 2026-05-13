<template>
  <div class="schema-object-field">
    <div v-if="ui.collapsible" class="object-header" @click="toggleCollapse">
      <span class="object-title">{{ ui.title || label }}</span>
      <el-icon class="collapse-icon" :class="{ 'is-collapsed': collapsed }">
        <ArrowDown />
      </el-icon>
    </div>
    
    <div class="object-content" v-show="!collapsed">
      <el-card v-if="ui.card" :shadow="ui.cardShadow || 'hover'" class="object-card">
        <template v-if="ui.cardTitle" #header>
          <span>{{ ui.cardTitle }}</span>
        </template>
        <div class="object-fields">
          <template v-for="(propSchema, propName) in schema.properties" :key="propName">
            <SchemaField
              v-if="shouldShowField(propSchema, propName)"
              :schema="propSchema"
              :field-name="propName"
              :model-value="localValue[propName]"
              :path="`${path}.${propName}`"
              :parent-schema="schema"
              :form-data="formData"
              @update:model-value="handlePropChange(propName, $event)"
            />
          </template>
        </div>
      </el-card>
      
      <div v-else class="object-fields">
        <template v-for="(propSchema, propName) in schema.properties" :key="propName">
          <SchemaField
            v-if="shouldShowField(propSchema, propName)"
            :schema="propSchema"
            :field-name="propName"
            :model-value="localValue[propName]"
            :path="`${path}.${propName}`"
            :parent-schema="schema"
            :form-data="formData"
            @update:model-value="handlePropChange(propName, $event)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import SchemaField from './SchemaField.vue'
import { getDefaultValue, getLabel } from './utils/schema-parser'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  fieldName: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    default: ''
  },
  parentSchema: {
    type: Object,
    default: () => ({})
  },
  formData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'validate'])

const ui = computed(() => props.schema['x-ui'] || {})
const label = computed(() => getLabel(props.schema, props.fieldName))
const collapsed = ref(ui.value.defaultCollapsed || false)

const localValue = ref(getDefaultValue(props.schema))

watch(() => props.modelValue, (newVal) => {
  if (newVal && typeof newVal === 'object') {
    Object.assign(localValue.value, newVal)
  }
}, { immediate: true, deep: true })

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const shouldShowField = (propSchema, propName) => {
  const propUi = propSchema['x-ui'] || {}
  if (propUi.hidden) return false
  if (propUi.hiddenWhen) {
    return !propUi.hiddenWhen(localValue.value)
  }
  if (propUi.visibleWhen) {
    return propUi.visibleWhen(localValue.value)
  }
  return true
}

const handlePropChange = (propName, value) => {
  localValue.value[propName] = value
  emit('update:modelValue', { ...localValue.value })
}
</script>

<style scoped>
.schema-object-field {
  width: 100%;
}

.object-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
}

.object-header:hover {
  background-color: #f5f7fa;
  margin: 0 -12px;
  padding: 8px 12px;
  border-radius: 4px;
}

.object-title {
  font-weight: 500;
  color: #303133;
}

.collapse-icon {
  transition: transform 0.3s;
}

.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.object-content {
  margin-top: 8px;
}

.object-card {
  margin-bottom: 16px;
}

.object-fields :deep(.el-form-item) {
  margin-bottom: 18px;
}

.object-fields :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
