<template>
  <div class="project-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button type="text" class="back-btn" @click="handleBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <span>{{ isEdit ? '编辑项目' : '创建项目' }}</span>
          <div></div>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="140px"
        class="form-content"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入项目名称"
            maxlength="100"
            show-word-limit
            style="width: 400px"
          />
        </el-form-item>

        <el-form-item label="项目总建面积" prop="totalArea">
          <el-input-number
            v-model="formData.totalArea"
            :min="0"
            :max="99999999"
            style="width: 200px"
          />
          <span class="unit">平方米</span>
        </el-form-item>

        <el-divider content-position="left">地理位置</el-divider>

        <el-form-item label="城市" prop="city">
          <el-input
            v-model="formData.city"
            placeholder="请输入城市"
            maxlength="50"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="区域" prop="district">
          <el-input
            v-model="formData.district"
            placeholder="请输入区域"
            maxlength="50"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="address">
          <el-input
            v-model="formData.address"
            type="textarea"
            :rows="2"
            placeholder="请输入详细地址"
            maxlength="200"
            show-word-limit
            style="width: 500px"
          />
        </el-form-item>

        <el-divider content-position="left">建筑信息</el-divider>

        <el-form-item label="楼层数量" prop="floorCount">
          <el-input-number
            v-model="formData.floorCount"
            :min="1"
            :max="999"
            style="width: 200px"
          />
          <span class="unit">层</span>
        </el-form-item>

        <el-form-item label="楼栋数量" prop="buildingCount">
          <el-input-number
            v-model="formData.buildingCount"
            :min="1"
            :max="999"
            style="width: 200px"
          />
          <span class="unit">栋</span>
        </el-form-item>

        <el-form-item label="资源位总数" prop="resourceCount">
          <el-input-number
            v-model="formData.resourceCount"
            :min="0"
            :max="99999"
            style="width: 200px"
          />
          <span class="unit">个</span>
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
import { useProjectStore } from '@/stores/project'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const formRef = ref(null)
const submitLoading = ref(false)

const isEdit = computed(() => {
  return route.name === 'ProjectEdit' && route.params.id
})

const formData = reactive({
  name: '',
  totalArea: 0,
  city: '',
  district: '',
  address: '',
  floorCount: 1,
  buildingCount: 1,
  resourceCount: 0,
  status: 1
})

const rules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  totalArea: [
    { required: true, message: '请输入项目总建面积', trigger: 'blur' }
  ],
  city: [
    { required: true, message: '请输入城市', trigger: 'blur' }
  ],
  district: [
    { required: true, message: '请输入区域', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ],
  floorCount: [
    { required: true, message: '请输入楼层数量', trigger: 'blur' }
  ],
  buildingCount: [
    { required: true, message: '请输入楼栋数量', trigger: 'blur' }
  ],
  resourceCount: [
    { required: true, message: '请输入资源位总数', trigger: 'blur' }
  ]
}

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      ElMessageBox.confirm(
        isEdit.value ? '确定要修改项目信息吗？' : '确定要创建项目吗？',
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
      totalArea: formData.totalArea,
      city: formData.city,
      district: formData.district,
      address: formData.address,
      floorCount: formData.floorCount,
      buildingCount: formData.buildingCount,
      resourceCount: formData.resourceCount,
      status: formData.status
    }

    if (isEdit.value) {
      await projectStore.editProject(route.params.id, submitData)
      ElMessage.success('修改成功')
    } else {
      await projectStore.addProject(submitData)
      ElMessage.success('创建成功')
    }
    
    router.push('/project')
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleReset = () => {
  formRef.value.resetFields()
  formData.totalArea = 0
  formData.floorCount = 1
  formData.buildingCount = 1
  formData.resourceCount = 0
  formData.status = 1
}

const handleBack = () => {
  router.push('/project')
}

const loadProjectData = async () => {
  if (!isEdit.value) {
    return
  }

  try {
    const data = await projectStore.fetchProjectDetail(route.params.id)
    formData.name = data.name
    formData.totalArea = data.totalArea
    formData.city = data.city
    formData.district = data.district
    formData.address = data.address
    formData.floorCount = data.floorCount
    formData.buildingCount = data.buildingCount
    formData.resourceCount = data.resourceCount
    formData.status = data.status
  } catch (error) {
    ElMessage.error('加载项目信息失败')
    router.push('/project')
  }
}

onMounted(() => {
  loadProjectData()
})
</script>

<style scoped>
.project-form {
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

.unit {
  margin-left: 10px;
  color: #909399;
}
</style>
