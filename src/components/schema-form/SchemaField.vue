<template>
  <el-form-item
    :label="label"
    :prop="path"
    :required="isRequired"
    :class="{ 'schema-field-group': isGroup }"
  >
    <div v-if="ui.group" class="field-group">
      <el-divider v-if="ui.groupTitle" :content-position="ui.groupTitlePosition || 'left'">
        {{ ui.groupTitle }}
      </el-divider>
    </div>
    
    <template v-if="isArray">
      <SchemaArrayField
        :schema="schema"
        :model-value="modelValue"
        :path="path"
        :form-data="formData"
        @update:model-value="handleChange"
        @validate="handleValidate"
      />
    </template>
    
    <template v-else-if="isObject">
      <SchemaObjectField
        :schema="schema"
        :model-value="modelValue"
        :path="path"
        :form-data="formData"
        @update:model-value="handleChange"
        @validate="handleValidate"
      />
    </template>
    
    <template v-else>
      <component
        :is="widgetComponent"
        v-model="localValue"
        v-bind="widgetProps"
        @change="handleInputChange"
        @blur="handleBlur"
        @clear="handleClear"
      >
        <template v-if="ui.slot">
          <slot :name="ui.slot" :value="localValue" :path="path" :schema="schema"></slot>
        </template>
      </component>
    </template>
    
    <span v-if="ui.suffix" class="field-suffix">{{ ui.suffix }}</span>
    <div v-if="ui.help" class="field-help">{{ ui.help }}</div>
  </el-form-item>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getLabel, getWidget, getOptions, getDefaultValue } from './utils/schema-parser'
import SchemaArrayField from './SchemaArrayField.vue'
import SchemaObjectField from './SchemaObjectField.vue'

const props = defineProps({
  schema: {
    type: Object,
    required: true
  },
  modelValue: {
    type: [String, Number, Boolean, Array, Object],
    default: undefined
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

const isArray = computed(() => props.schema.type === 'array')
const isObject = computed(() => props.schema.type === 'object')
const isGroup = computed(() => !!ui.value.group)

const isRequired = computed(() => {
  if (ui.value.required !== undefined) return ui.value.required
  if (props.schema.minLength !== undefined) return true
  if (props.parentSchema.required) {
    return props.parentSchema.required.includes(props.fieldName)
  }
  return false
})

const widget = computed(() => getWidget(props.schema))

const localValue = ref(props.modelValue ?? getDefaultValue(props.schema))

watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal
  }
})

const widgetComponent = computed(() => {
  const widgetMap = {
    'Input': 'el-input',
    'InputNumber': 'el-input-number',
    'Select': 'el-select',
    'Radio': 'el-radio-group',
    'RadioButton': 'el-radio-group',
    'Checkbox': 'el-checkbox-group',
    'Switch': 'el-switch',
    'DatePicker': 'el-date-picker',
    'DateTimePicker': 'el-date-picker',
    'TimePicker': 'el-time-picker',
    'TimeSelect': 'el-time-select',
    'Cascader': 'el-cascader',
    'Slider': 'el-slider',
    'Rate': 'el-rate',
    'ColorPicker': 'el-color-picker',
    'Transfer': 'el-transfer',
    'Textarea': 'el-input'
  }
  return widgetMap[widget.value] || 'el-input'
})

const widgetProps = computed(() => {
  const baseProps = {
    placeholder: ui.value.placeholder || `请输入${label.value}`,
    disabled: ui.value.disabled,
    readonly: ui.value.readonly,
    clearable: ui.value.clearable !== false,
    ...(ui.value.props || {})
  }
  
  if (widget.value === 'Textarea') {
    baseProps.type = 'textarea'
    baseProps.rows = ui.value.rows || 3
  }
  
  if (widget.value === 'DatePicker') {
    baseProps.type = ui.value.type || 'date'
    baseProps.valueFormat = ui.value.valueFormat || 'YYYY-MM-DD'
  }
  
  if (widget.value === 'DateTimePicker') {
    baseProps.type = 'datetime'
    baseProps.valueFormat = ui.value.valueFormat || 'YYYY-MM-DD HH:mm:ss'
  }
  
  if (widget.value === 'InputNumber') {
    if (props.schema.minimum !== undefined) baseProps.min = props.schema.minimum
    if (props.schema.maximum !== undefined) baseProps.max = props.schema.maximum
    if (ui.value.step) baseProps.step = ui.value.step
    if (ui.value.precision !== undefined) baseProps.precision = ui.value.precision
  }
  
  if (widget.value === 'Select') {
    baseProps.options = getOptions(props.schema)
    if (ui.value.multiple) baseProps.multiple = true
    if (ui.value.filterable) baseProps.filterable = true
  }
  
  if (widget.value === 'Input') {
    if (props.schema.maxLength) baseProps.maxlength = props.schema.maxLength
    if (props.schema.minLength) baseProps.minlength = props.schema.minLength
    if (props.schema.pattern) baseProps.pattern = props.schema.pattern
    if (ui.value.showWordLimit) baseProps.showWordLimit = true
    if (ui.value.password) baseProps.type = 'password'
    if (ui.value.type) baseProps.type = ui.value.type
  }
  
  return baseProps
})

const handleChange = (value) => {
  emit('update:modelValue', value)
}

const handleInputChange = () => {
  emit('update:modelValue', localValue.value)
}

const handleBlur = () => {
  emit('update:modelValue', localValue.value)
}

const handleClear = () => {
  localValue.value = undefined
  emit('update:modelValue', undefined)
}

const handleValidate = (fieldPath, isValid) => {
  emit('validate', fieldPath, isValid)
}
</script>

<style scoped>
.field-group {
  width: 100%;
}

.field-suffix {
  margin-left: 10px;
  color: #909399;
}

.field-help {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.schema-field-group :deep(.el-form-item__content) {
  width: 100%;
}

.schema-field-group :deep(.el-form-item__label) {
  display: none;
}
</style>
