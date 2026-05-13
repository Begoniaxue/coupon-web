<template>
  <div class="schema-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="mergedRules"
      :label-width="labelWidth"
      :inline="inline"
      :disabled="disabled"
      :size="size"
      class="schema-form-content"
    >
      <template v-for="(fieldSchema, fieldName) in schema.properties" :key="fieldName">
        <template v-if="shouldShowField(fieldSchema, fieldName)">
          <SchemaField
            :schema="fieldSchema"
            :field-name="fieldName"
            :model-value="formData[fieldName]"
            :path="fieldName"
            :parent-schema="schema"
            :form-data="formData"
            @update:model-value="handleFieldChange(fieldName, $event)"
            @validate="handleValidate"
          />
        </template>
      </template>
      
      <div class="schema-form-actions" v-if="showActions">
        <slot name="actions">
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ submitText }}
          </el-button>
          <el-button @click="handleReset">{{ resetText }}</el-button>
        </slot>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import SchemaField from './SchemaField.vue'
import { buildFormData, createRules, getValueByPath } from './utils/schema-parser'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  rules: {
    type: Object,
    default: () => ({})
  },
  labelWidth: {
    type: String,
    default: '120px'
  },
  inline: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default'
  },
  showActions: {
    type: Boolean,
    default: true
  },
  submitText: {
    type: String,
    default: '提交'
  },
  resetText: {
    type: String,
    default: '重置'
  },
  submitLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'reset', 'change', 'validate'])

const formRef = ref(null)

const formData = reactive(buildFormData(props.schema, props.modelValue))

const mergedRules = computed(() => {
  const rules = {}
  
  if (props.schema.properties) {
    for (const [fieldName, fieldSchema] of Object.entries(props.schema.properties)) {
      const customRules = props.rules[fieldName] || []
      rules[fieldName] = createRules(fieldSchema, customRules)
    }
  }
  
  return { ...rules, ...props.rules }
})

watch(() => props.modelValue, (newVal) => {
  Object.assign(formData, buildFormData(props.schema, newVal || {}))
}, { deep: true })

watch(formData, (newVal) => {
  emit('update:modelValue', { ...newVal })
  emit('change', { ...newVal })
}, { deep: true })

const shouldShowField = (fieldSchema, fieldName) => {
  const ui = fieldSchema['x-ui'] || {}
  if (ui.hidden) return false
  if (ui.hiddenWhen) {
    return !ui.hiddenWhen(formData)
  }
  if (ui.visibleWhen) {
    return ui.visibleWhen(formData)
  }
  return true
}

const handleFieldChange = (fieldName, value) => {
  formData[fieldName] = value
}

const handleValidate = (fieldPath, isValid) => {
  emit('validate', { field: fieldPath, isValid })
}

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', { ...formData })
    }
  })
}

const handleReset = () => {
  Object.assign(formData, buildFormData(props.schema, {}))
  formRef.value?.clearValidate()
  emit('reset')
}

const validate = async () => {
  return await formRef.value.validate()
}

const validateField = (fieldPath) => {
  formRef.value?.validateField(fieldPath)
}

const resetFields = () => {
  handleReset()
}

const clearValidate = () => {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  validateField,
  resetFields,
  clearValidate,
  formRef,
  formData
})

onMounted(() => {
  if (props.modelValue) {
    Object.assign(formData, buildFormData(props.schema, props.modelValue))
  }
})
</script>

<style scoped>
.schema-form {
  width: 100%;
}

.schema-form-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.schema-form-actions :deep(.el-button) {
  margin-right: 12px;
}
</style>
