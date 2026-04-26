const mockProjects = [
  {
    id: 1,
    name: '万达广场',
    totalArea: 150000,
    city: '北京',
    district: '朝阳区',
    address: '北京市朝阳区建国路88号',
    floorCount: 5,
    buildingCount: 3,
    resourceCount: 200,
    status: 1,
    createTime: '2024-01-15 10:00:00'
  },
  {
    id: 2,
    name: '银泰中心',
    totalArea: 80000,
    city: '北京',
    district: '朝阳区',
    address: '北京市朝阳区建国门外大街2号',
    floorCount: 8,
    buildingCount: 2,
    resourceCount: 150,
    status: 1,
    createTime: '2024-02-01 14:30:00'
  },
  {
    id: 3,
    name: '恒隆广场',
    totalArea: 120000,
    city: '上海',
    district: '静安区',
    address: '上海市静安区南京西路1266号',
    floorCount: 6,
    buildingCount: 2,
    resourceCount: 180,
    status: 1,
    createTime: '2024-03-10 09:00:00'
  },
  {
    id: 4,
    name: '万象城',
    totalArea: 200000,
    city: '深圳',
    district: '南山区',
    address: '深圳市南山区科苑南路2888号',
    floorCount: 7,
    buildingCount: 4,
    resourceCount: 300,
    status: 0,
    createTime: '2024-04-05 16:00:00'
  }
]

let projects = [...mockProjects]
let nextId = 5

export const getProjectList = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredList = [...projects]
      
      if (params.name) {
        filteredList = filteredList.filter(item => 
          item.name.includes(params.name)
        )
      }
      
      if (params.city) {
        filteredList = filteredList.filter(item => 
          item.city.includes(params.city)
        )
      }
      
      if (params.status !== undefined && params.status !== '') {
        filteredList = filteredList.filter(item => 
          item.status === Number(params.status)
        )
      }
      
      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      const list = filteredList.slice(startIndex, endIndex)
      
      resolve({
        code: 200,
        data: {
          list,
          total: filteredList.length,
          page,
          pageSize
        },
        message: 'success'
      })
    }, 300)
  })
}

export const getProjectDetail = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const project = projects.find(item => item.id === Number(id))
      if (project) {
        resolve({
          code: 200,
          data: project,
          message: 'success'
        })
      } else {
        reject({
          code: 404,
          message: '项目不存在'
        })
      }
    }, 300)
  })
}

export const createProject = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newProject = {
        id: nextId++,
        ...data,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false })
      }
      projects.unshift(newProject)
      resolve({
        code: 200,
        data: { id: newProject.id },
        message: '创建成功'
      })
    }, 500)
  })
}

export const updateProject = (id, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = projects.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        projects[index] = { ...projects[index], ...data }
        resolve({
          code: 200,
          message: '更新成功'
        })
      } else {
        reject({
          code: 404,
          message: '项目不存在'
        })
      }
    }, 500)
  })
}

export const deleteProject = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = projects.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        projects.splice(index, 1)
        resolve({
          code: 200,
          message: '删除成功'
        })
      } else {
        reject({
          code: 404,
          message: '项目不存在'
        })
      }
    }, 300)
  })
}

export const updateProjectStatus = (id, status) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = projects.findIndex(item => item.id === Number(id))
      if (index !== -1) {
        projects[index].status = status
        resolve({
          code: 200,
          message: status === 1 ? '启用成功' : '停用成功'
        })
      } else {
        reject({
          code: 404,
          message: '项目不存在'
        })
      }
    }, 300)
  })
}

export const getAllProjects = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const activeProjects = projects.filter(item => item.status === 1)
      resolve({
        code: 200,
        data: {
          list: activeProjects
        },
        message: 'success'
      })
    }, 200)
  })
}
