<template>
  <div class="schema-form-demo">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>JSON Schema 复杂表单演示</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="完整功能演示" name="demo">
          <SchemaForm
            ref="formRef"
            :schema="schema"
            :rules="customRules"
            v-model="formData"
            label-width="140px"
            @submit="handleSubmit"
            @change="handleChange"
          />
        </el-tab-pane>
        
        <el-tab-pane label="表单数据预览" name="preview">
          <pre class="data-preview">{{ JSON.stringify(formData, null, 2) }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <el-card v-if="submittedData" class="result-card">
      <template #header>
        <span>提交结果</span>
      </template>
      <pre class="data-preview">{{ JSON.stringify(submittedData, null, 2) }}</pre>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import SchemaForm from '@/components/schema-form/SchemaForm.vue'

const formRef = ref(null)
const activeTab = ref('demo')
const formData = reactive({})
const submittedData = ref(null)

const checkUsernameAsync = async (rule, value, callback) => {
  if (!value) return callback()
  
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const usedNames = ['admin', 'root', 'user']
  if (usedNames.includes(value.toLowerCase())) {
    callback(new Error('该用户名已被使用'))
  } else {
    callback()
  }
}

const schema = {
  type: 'object',
  properties: {
    basicInfo: {
      type: 'object',
      title: '基本信息',
      'x-ui': {
        card: true,
        cardTitle: '用户基本信息',
        collapsible: true
      },
      properties: {
        username: {
          type: 'string',
          title: '用户名',
          minLength: 3,
          maxLength: 20,
          'x-ui': {
            required: true,
            placeholder: '请输入用户名',
            help: '3-20个字符，不能是 admin、root、user',
            asyncValidator: checkUsernameAsync,
            asyncValidatorTrigger: 'blur'
          }
        },
        email: {
          type: 'string',
          title: '邮箱',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          errorMessage: '邮箱格式不正确',
          'x-ui': {
            required: true,
            placeholder: '请输入邮箱地址'
          }
        },
        password: {
          type: 'string',
          title: '密码',
          minLength: 6,
          maxLength: 20,
          'x-ui': {
            widget: 'Input',
            type: 'password',
            required: true,
            placeholder: '请输入密码'
          }
        },
        confirmPassword: {
          type: 'string',
          title: '确认密码',
          'x-ui': {
            widget: 'Input',
            type: 'password',
            required: true,
            placeholder: '请再次输入密码'
          }
        },
        gender: {
          type: 'string',
          title: '性别',
          enum: ['male', 'female', 'other'],
          'x-ui': {
            widget: 'Radio',
            options: [
              { label: '男', value: 'male' },
              { label: '女', value: 'female' },
              { label: '保密', value: 'other' }
            ]
          }
        },
        birthday: {
          type: 'string',
          title: '生日',
          format: 'date',
          'x-ui': {
            placeholder: '请选择日期'
          }
        }
      }
    },
    
    contactInfo: {
      type: 'object',
      title: '联系方式',
      'x-ui': {
        card: true,
        collapsible: true,
        defaultCollapsed: true
      },
      properties: {
        phone: {
          type: 'string',
          title: '手机号',
          pattern: '^1[3-9]\\d{9}$',
          errorMessage: '请输入正确的手机号',
          'x-ui': {
            placeholder: '请输入手机号'
          }
        },
        address: {
          type: 'string',
          title: '详细地址',
          'x-ui': {
            widget: 'Textarea',
            rows: 3,
            placeholder: '请输入详细地址',
            maxlength: 200,
            showWordLimit: true
          }
        }
      }
    },
    
    preferences: {
      type: 'object',
      title: '偏好设置',
      'x-ui': {
        card: true,
        collapsible: true,
        defaultCollapsed: false
      },
      properties: {
        receiveNotifications: {
          type: 'boolean',
          title: '接收通知',
          'x-ui': {
            widget: 'Switch'
          }
        },
        notificationEmail: {
          type: 'string',
          title: '通知邮箱',
          'x-ui': {
            placeholder: '用于接收通知的邮箱',
            visibleWhen: (data) => data.receiveNotifications
          }
        },
        themes: {
          type: 'array',
          title: '喜欢的主题',
          'x-ui': {
            minItems: 1,
            maxItems: 5,
            itemTitle: '主题',
            visibleWhen: (data) => data.receiveNotifications
          },
          items: {
            type: 'string',
            enum: ['light', 'dark', 'blue', 'green', 'purple'],
            'x-ui': {
              widget: 'Select',
              placeholder: '选择主题',
              options: [
                { label: '浅色', value: 'light' },
                { label: '深色', value: 'dark' },
                { label: '蓝色', value: 'blue' },
                { label: '绿色', value: 'green' },
                { label: '紫色', value: 'purple' }
              ]
            }
          }
        }
      }
    },
    
    workExperience: {
      type: 'array',
      title: '工作经历',
      minItems: 1,
      maxItems: 5,
      'x-ui': {
        required: true,
        addButtonText: '添加工作经历',
        itemTitle: '工作经历'
      },
      items: {
        type: 'object',
        properties: {
          company: {
            type: 'string',
            title: '公司名称',
            'x-ui': {
              required: true,
              placeholder: '请输入公司名称'
            }
          },
          position: {
            type: 'string',
            title: '职位',
            'x-ui': {
              required: true,
              placeholder: '请输入职位'
            }
          },
          startDate: {
            type: 'string',
            title: '开始日期',
            format: 'date',
            'x-ui': {
              placeholder: '请选择开始日期'
            }
          },
          endDate: {
            type: 'string',
            title: '结束日期',
            format: 'date',
            'x-ui': {
              placeholder: '请选择结束日期'
            }
          },
          isCurrent: {
            type: 'boolean',
            title: '目前在职',
            'x-ui': {
              widget: 'Switch'
            }
          },
          description: {
            type: 'string',
            title: '工作描述',
            'x-ui': {
              widget: 'Textarea',
              rows: 2,
              placeholder: '请描述工作内容',
              maxlength: 500,
              showWordLimit: true
            }
          }
        }
      }
    },
    
    skills: {
      type: 'array',
      title: '技能标签',
      maxItems: 10,
      'x-ui': {
        itemTitle: '技能'
      },
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            title: '技能名称',
            'x-ui': {
              required: true,
              placeholder: '例如: JavaScript'
            }
          },
          level: {
            type: 'number',
            title: '熟练程度',
            minimum: 1,
            maximum: 5,
            'x-ui': {
              widget: 'Rate',
              help: '1-5星'
            }
          },
          years: {
            type: 'number',
            title: '使用年限',
            minimum: 0,
            maximum: 50,
            'x-ui': {
              placeholder: '请输入使用年限',
              suffix: '年'
            }
          }
        }
      }
    },
    
    additionalInfo: {
      type: 'string',
      title: '其他信息',
      'x-ui': {
        widget: 'Textarea',
        rows: 4,
        placeholder: '请输入其他补充信息',
        maxlength: 1000,
        showWordLimit: true
      }
    }
  }
}

const customRules = {
  'basicInfo.confirmPassword': [
    {
      validator: (rule, value, callback) => {
        if (value && value !== formData.basicInfo?.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleSubmit = (data) => {
  console.log('表单提交:', data)
  submittedData.value = data
}

const handleChange = (data) => {
  console.log('表单数据变化:', data)
}
</script>

<style scoped>
.schema-form-demo {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 500;
}

.result-card {
  margin-top: 20px;
}

.data-preview {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-size: 13px;
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}
</style>
