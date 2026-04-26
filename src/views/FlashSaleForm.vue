<template>
  <div class="flash-sale-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button type="text" class="back-btn" @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <span>{{ isEdit ? '编辑秒杀活动' : '创建秒杀活动' }}</span>
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

        <el-form-item label="关联项目" prop="projectId">
          <el-select
            v-if="isEdit && (projectStore.allProjects.length > 0 || isEdit)"
            v-model="formData.projectId"
            placeholder="请选择关联项目（仅可选择单一项目）"
            filterable
            clearable
            style="width: 300px"
          >
            <el-option
              v-for="item in projectStore.allProjects"
              :key="item.id"
              :label="`${item.name} - ${item.city}`"
              :value="item.id"
            >
              <div class="project-option">
                <span class="project-name">{{ item.name }}</span>
                <el-tag type="info" size="small">{{ item.city }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <div v-else-if="!isEdit && formData.projectId" class="project-display">
            <el-tag type="primary" size="large" effect="light">
              <el-icon><OfficeBuilding /></el-icon>
              <span class="display-text">{{ formData.projectName || defaultProjectName }}</span>
              <span v-if="defaultProjectCity" class="display-city">- {{ defaultProjectCity }}</span>
            </el-tag>
            <div class="form-tip readonly-tip">已自动带入所选项目，创建时不可修改</div>
          </div>
          <div v-else class="no-project-tip">
            <el-icon color="#e6a23c"><Warning /></el-icon>
            <span>暂无可用的项目，请先创建启用中的项目</span>
          </div>
        </el-form-item>

        <el-form-item label="主图" prop="mainImage">
          <el-upload
            class="main-image-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handleMainImageChange"
            :on-remove="handleMainImageRemove"
            :on-preview="handleMainImagePreview"
            :limit="1"
            list-type="picture-card"
            :file-list="mainImageFileList"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 jpg/png/gif 格式文件，建议尺寸 750x400 像素
              </div>
            </template>
          </el-upload>
          
          <el-image-viewer
            v-if="mainImageViewerVisible"
            :url-list="mainImagePreviewList"
            :initial-index="0"
            @close="mainImageViewerVisible = false"
          />
        </el-form-item>

        <el-form-item label="活动标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入活动标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="活动副标题" prop="subtitle">
          <el-input
            v-model="formData.subtitle"
            placeholder="请输入活动副标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="活动内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="请输入活动内容（支持HTML富文本）"
          />
          <div class="form-tip">支持HTML标签，如：&lt;p&gt;、&lt;ul&gt;、&lt;li&gt;、&lt;strong&gt; 等</div>
        </el-form-item>

        <el-divider content-position="left">关联卡券</el-divider>

        <el-form-item label="关联卡券" prop="couponId">
          <el-select
            v-if="discountCoupons.length > 0 || isEdit"
            v-model="formData.couponId"
            placeholder="请选择关联卡券（仅可选择折扣类型卡券）"
            style="width: 300px"
            :disabled="isEdit"
          >
            <el-option
              v-for="item in discountCoupons"
              :key="item.id"
              :label="`${item.name} - ${item.value}折`"
              :value="item.id"
            >
              <div class="coupon-option">
                <span class="coupon-name">{{ item.name }}</span>
                <el-tag type="warning" size="small">{{ item.value }}折</el-tag>
              </div>
            </el-option>
          </el-select>
          <div v-else class="no-coupon-tip">
            <el-icon color="#e6a23c"><Warning /></el-icon>
            <span>暂无可用的折扣卡券，请先创建生效中的折扣卡券</span>
          </div>
          <div v-if="isEdit" class="form-tip">活动创建后不可修改关联卡券</div>
          <div v-else-if="discountCoupons.length > 0" class="form-tip">仅可选择当前生效中的折扣类型卡券</div>
        </el-form-item>

        <el-divider content-position="left">活动时间</el-divider>

        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="formData.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期时间"
            end-placeholder="结束日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledDate"
            :shortcuts="timeShortcuts"
            style="width: 400px"
          />
          <div class="form-tip">活动时间最小1天，最大7天</div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlashSaleStore } from '@/stores/flashSale'
import { useCouponStore } from '@/stores/coupon'
import { useProjectStore } from '@/stores/project'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sanitizeHtml, isSafeHtml } from '@/utils/security'

const route = useRoute()
const router = useRouter()
const flashSaleStore = useFlashSaleStore()
const couponStore = useCouponStore()
const projectStore = useProjectStore()

const formRef = ref(null)
const submitLoading = ref(false)
const discountCoupons = ref([])

const isEdit = computed(() => {
  return route.name === 'FlashSaleEdit' && route.params.id
})

const defaultProjectName = computed(() => {
  if (formData.projectId) {
    const project = projectStore.allProjects.find(item => item.id === formData.projectId)
    return project ? project.name : formData.projectName
  }
  return ''
})

const defaultProjectCity = computed(() => {
  if (formData.projectId) {
    const project = projectStore.allProjects.find(item => item.id === formData.projectId)
    return project ? project.city : ''
  }
  return ''
})

const formData = reactive({
  title: '',
  subtitle: '',
  mainImage: '',
  content: '',
  couponId: null,
  couponName: '',
  timeRange: [],
  startTime: '',
  endTime: '',
  projectId: null,
  projectName: ''
})

const validateTimeRange = (rule, value, callback) => {
  if (!value || value.length !== 2) {
    callback(new Error('请选择活动时间'))
    return
  }
  
  const startTime = new Date(value[0].replace(/-/g, '/'))
  const endTime = new Date(value[1].replace(/-/g, '/'))
  const now = new Date()
  
  if (startTime < now) {
    callback(new Error('开始时间不能早于当前时间'))
    return
  }
  
  const diffMs = endTime - startTime
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  if (diffDays < 1) {
    callback(new Error('活动时间不能少于1天'))
    return
  }
  
  if (diffDays > 7) {
    callback(new Error('活动时间不能超过7天'))
    return
  }
  
  callback()
}

const rules = {
  title: [
    { required: true, message: '请输入活动标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  mainImage: [
    { required: true, message: '请上传主图', trigger: 'change' }
  ],
  couponId: [
    { required: true, message: '请选择关联卡券', trigger: 'change' }
  ],
  timeRange: [
    { required: true, validator: validateTimeRange, trigger: 'change' }
  ],
  projectId: [
    { required: true, message: '请选择关联项目', trigger: 'change' }
  ]
}

const mainImageFileList = ref([])
const mainImageViewerVisible = ref(false)
const mainImagePreviewList = ref([])

const timeShortcuts = [
  {
    text: '1天',
    value: () => {
      const now = new Date()
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      return [now, end]
    }
  },
  {
    text: '3天',
    value: () => {
      const now = new Date()
      const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      return [now, end]
    }
  },
  {
    text: '7天',
    value: () => {
      const now = new Date()
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return [now, end]
    }
  }
]

const disabledDate = (time) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return time.getTime() < yesterday.getTime()
}

const handleMainImageChange = (file, fileList) => {
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
    file.url = e.target.result
    mainImageFileList.value = [file]
  }
  reader.readAsDataURL(file.raw)
}

const handleMainImageRemove = () => {
  formData.mainImage = ''
  mainImageFileList.value = []
}

const handleMainImagePreview = (file) => {
  if (file.url) {
    mainImagePreviewList.value = [file.url]
    mainImageViewerVisible.value = true
  }
}

const loadDiscountCoupons = async () => {
  try {
    const list = await couponStore.fetchDiscountCouponList()
    discountCoupons.value = list
  } catch (error) {
    ElMessage.error('加载折扣卡券列表失败')
  }
}

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      ElMessageBox.confirm(
        isEdit.value ? '确定要修改秒杀活动吗？' : '确定要创建秒杀活动吗？',
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
    if (formData.content && !isSafeHtml(formData.content)) {
      ElMessage.warning('活动内容包含不安全的HTML标签，已自动过滤')
    }

    const selectedCoupon = discountCoupons.value.find(item => item.id === formData.couponId)
    const selectedProject = projectStore.allProjects.find(item => item.id === formData.projectId)
    
    const submitData = {
      title: formData.title,
      subtitle: formData.subtitle,
      mainImage: formData.mainImage,
      content: sanitizeHtml(formData.content),
      couponId: formData.couponId,
      couponName: selectedCoupon ? selectedCoupon.name : formData.couponName,
      projectId: formData.projectId,
      projectName: selectedProject ? selectedProject.name : formData.projectName,
      startTime: formData.timeRange[0],
      endTime: formData.timeRange[1]
    }

    if (isEdit.value) {
      await flashSaleStore.editFlashSale(route.params.id, submitData)
      ElMessage.success('修改成功')
    } else {
      await flashSaleStore.addFlashSale(submitData)
      ElMessage.success('创建成功')
    }
    
    router.push('/flash-sale')
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleReset = () => {
  formRef.value.resetFields()
  formData.mainImage = ''
  mainImageFileList.value = []
  formData.timeRange = []
}

const handleBack = () => {
  router.push('/flash-sale')
}

const loadProjects = async () => {
  await projectStore.fetchAllProjects()
}

const loadFlashSaleData = async () => {
  if (!isEdit.value) {
    if (route.query.projectId) {
      const projectId = Number(route.query.projectId)
      if (projectStore.allProjects.length === 0) {
        await loadProjects()
      }
      const defaultProject = projectStore.allProjects.find(item => item.id === projectId)
      if (defaultProject) {
        formData.projectId = defaultProject.id
        formData.projectName = defaultProject.name
      }
    }
    return
  }

  try {
    const data = await flashSaleStore.fetchFlashSaleDetail(route.params.id)
    formData.title = data.title
    formData.subtitle = data.subtitle
    formData.mainImage = data.mainImage
    formData.content = data.content
    formData.couponId = data.couponId
    formData.couponName = data.couponName
    formData.projectId = data.projectId
    formData.projectName = data.projectName
    formData.timeRange = [data.startTime, data.endTime]

    if (data.mainImage) {
      mainImageFileList.value = [{
        name: 'main-image',
        url: data.mainImage
      }]
    }
  } catch (error) {
    ElMessage.error('加载秒杀活动信息失败')
    router.push('/flash-sale')
  }
}

onMounted(() => {
  loadDiscountCoupons()
  loadFlashSaleData()
})
</script>

<style scoped>
.flash-sale-form {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.card-header .back-btn {
  padding: 0;
}

.form-content {
  max-width: 800px;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.no-coupon-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 15px;
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  font-size: 14px;
  color: #e6a23c;
  max-width: 300px;
}

.coupon-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.coupon-name {
  margin-right: 10px;
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

.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.no-project-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 15px;
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  font-size: 14px;
  color: #e6a23c;
  max-width: 300px;
}

.project-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.project-name {
  margin-right: 10px;
}

.project-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-display :deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 15px;
}

.display-text {
  font-weight: 500;
}

.display-city {
  font-size: 13px;
  opacity: 0.9;
}

.readonly-tip {
  margin-top: 0;
  font-style: italic;
  color: #909399;
}
</style>
