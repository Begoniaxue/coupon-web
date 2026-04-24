<template>
  <div class="coupon-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button type="text" @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <span>{{ isEdit ? '编辑卡券' : '创建卡券' }}</span>
          <div></div>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="form-content"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="卡券名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入卡券名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="卡券编码" prop="code">
          <el-input
            v-model="formData.code"
            placeholder="请输入卡券编码（自动生成也可自定义）"
            maxlength="32"
          />
        </el-form-item>

        <el-form-item label="卡券类型" prop="type">
          <el-radio-group v-model="formData.type">
            <el-radio :value="1">满减券</el-radio>
            <el-radio :value="2">折扣券</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="面值" prop="value">
          <el-input-number
            v-model="formData.value"
            :min="1"
            :max="formData.type === 2 ? 9 : 10000"
            :precision="formData.type === 2 ? 1 : 0"
            style="width: 200px"
          />
          <span v-if="formData.type === 1" class="unit">元</span>
          <span v-else class="unit">折</span>
        </el-form-item>

        <el-form-item label="使用门槛" prop="minAmount">
          <el-input-number
            v-model="formData.minAmount"
            :min="0"
            :max="100000"
            style="width: 200px"
          />
          <span class="unit">元（0表示无门槛）</span>
        </el-form-item>

        <el-form-item label="发放数量" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="1"
            :max="1000000"
            style="width: 200px"
          />
          <span class="unit">张</span>
        </el-form-item>

        <el-form-item label="权重" prop="weight">
          <el-input-number
            v-model="formData.weight"
            :min="0"
            :max="100"
            style="width: 200px"
          />
          <span class="unit">（数值越大优先级越高）</span>
        </el-form-item>

        <el-divider content-position="left">时间设置</el-divider>

        <el-form-item label="有效期" prop="timeRange">
          <el-date-picker
            v-model="formData.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期时间"
            end-placeholder="结束日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 400px"
          />
        </el-form-item>

        <el-divider content-position="left">图片设置</el-divider>

        <el-form-item label="主图" prop="mainImage">
          <el-upload
            class="main-image-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handleMainImageChange"
            :limit="1"
            list-type="picture-card"
          >
            <el-icon v-if="!formData.mainImage"><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 jpg/png/gif 格式文件，建议尺寸 750x400 像素
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="内容图片">
          <el-upload
            class="content-images-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handleContentImagesChange"
            :on-remove="handleContentImagesRemove"
            :limit="9"
            list-type="picture-card"
            :file-list="contentImageFileList"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                最多上传9张图片，建议宽度 750 像素
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-divider content-position="left">文案设置</el-divider>

        <el-form-item label="卡券描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入卡券使用说明、注意事项等详细描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-divider></el-divider>

        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            提交
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCouponStore } from '@/stores/coupon'
import { uploadImage } from '@/api/coupon'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const couponStore = useCouponStore()

const formRef = ref(null)
const submitLoading = ref(false)

const isEdit = computed(() => {
  return route.name === 'CouponEdit' && route.params.id
})

const formData = reactive({
  name: '',
  code: '',
  type: 1,
  value: 10,
  minAmount: 0,
  quantity: 100,
  weight: 0,
  timeRange: [],
  startTime: '',
  endTime: '',
  mainImage: '',
  contentImages: [],
  description: '',
  status: 0
})

const rules = {
  name: [
    { required: true, message: '请输入卡券名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入卡券编码', trigger: 'blur' },
    { min: 2, max: 32, message: '长度在 2 到 32 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择卡券类型', trigger: 'change' }
  ],
  value: [
    { required: true, message: '请输入面值', trigger: 'blur' }
  ],
  quantity: [
    { required: true, message: '请输入发放数量', trigger: 'blur' }
  ],
  timeRange: [
    { required: true, message: '请选择有效期', trigger: 'change' }
  ],
  mainImage: [
    { required: true, message: '请上传主图', trigger: 'change' }
  ]
}

const contentImageFileList = ref([])

const generateCode = () => {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `COUPON${timestamp.slice(-6)}${random}`
}

const handleMainImageChange = (file) => {
  const isImage = file.raw.type.includes('image')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 5
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.mainImage = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const handleContentImagesChange = (file, fileList) => {
  const isImage = file.raw.type.includes('image')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 5
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    file.url = e.target.result
    if (!formData.contentImages.includes(e.target.result)) {
      formData.contentImages.push(e.target.result)
    }
    contentImageFileList.value = fileList.map((item, index) => ({
      ...item,
      url: item.url || formData.contentImages[index]
    }))
  }
  reader.readAsDataURL(file.raw)
}

const handleContentImagesRemove = (file, fileList) => {
  const index = formData.contentImages.indexOf(file.url)
  if (index !== -1) {
    formData.contentImages.splice(index, 1)
  }
  contentImageFileList.value = fileList
}

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      ElMessageBox.confirm(
        isEdit.value ? '确定要修改卡券信息吗？' : '确定要创建卡券吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        submitLoading.value = true
        submitForm()
      }).catch(() => {})
    }
  })
}

const submitForm = async () => {
  try {
    const submitData = {
      name: formData.name,
      code: formData.code,
      type: formData.type,
      value: formData.value,
      minAmount: formData.minAmount,
      quantity: formData.quantity,
      weight: formData.weight,
      startTime: formData.timeRange[0],
      endTime: formData.timeRange[1],
      mainImage: formData.mainImage,
      contentImages: formData.contentImages,
      description: formData.description,
      status: formData.status
    }

    if (isEdit.value) {
      await couponStore.editCoupon(route.params.id, submitData)
      ElMessage.success('修改成功')
    } else {
      await couponStore.addCoupon(submitData)
      ElMessage.success('创建成功')
    }
    
    router.push('/')
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleReset = () => {
  formRef.value.resetFields()
  formData.mainImage = ''
  formData.contentImages = []
  contentImageFileList.value = []
  formData.code = generateCode()
}

const handleBack = () => {
  router.push('/')
}

const loadCouponData = async () => {
  if (!isEdit.value) {
    formData.code = generateCode()
    return
  }

  try {
    const data = await couponStore.fetchCouponDetail(route.params.id)
    formData.name = data.name
    formData.code = data.code
    formData.type = data.type
    formData.value = data.value
    formData.minAmount = data.minAmount
    formData.quantity = data.quantity
    formData.weight = data.weight
    formData.timeRange = [data.startTime, data.endTime]
    formData.mainImage = data.mainImage
    formData.contentImages = data.contentImages || []
    formData.description = data.description
    formData.status = data.status

    if (formData.contentImages.length > 0) {
      contentImageFileList.value = formData.contentImages.map((url, index) => ({
        name: `image-${index}`,
        url: url
      }))
    }
  } catch (error) {
    ElMessage.error('加载卡券信息失败')
    router.push('/')
  }
}

onMounted(() => {
  loadCouponData()
})
</script>

<style scoped>
.coupon-form {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.card-header .el-button {
  padding: 0;
}

.form-content {
  max-width: 800px;
}

.unit {
  margin-left: 10px;
  color: #909399;
}

.main-image-uploader :deep(.el-upload--picture-card) {
  width: 160px;
  height: 100px;
  line-height: 100px;
}

.main-image-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 160px;
  height: 100px;
}

.main-image-uploader :deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  object-fit: cover;
}

.content-images-uploader :deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

.content-images-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}

.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
