import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const app = express()
const PORT = 3001
const JWT_SECRET = 'coupon-secret-key-2024'

app.use(cors())
app.use(express.json())

const users = [
  { id: 1, username: 'admin', password: 'admin123', name: '管理员', role: 'admin' },
  { id: 2, username: 'user1', password: 'user123', name: '用户张三', role: 'user' },
  { id: 3, username: 'user2', password: 'user456', name: '用户李四', role: 'user' }
]

const activeTokens = new Set()

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body

  const user = users.find(u => u.username === username && u.password === password)

  if (!user) {
    return res.json({
      code: 401,
      message: '用户名或密码错误'
    })
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  activeTokens.add(token)

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    }
  })
})

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (token) {
    activeTokens.delete(token)
  }

  res.json({
    code: 200,
    message: '登出成功'
  })
})

app.get('/api/auth/userinfo', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token || !activeTokens.has(token)) {
    return res.json({
      code: 401,
      message: '未登录'
    })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = users.find(u => u.id === decoded.userId)

    if (!user) {
      return res.json({
        code: 401,
        message: '用户不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    res.json({
      code: 401,
      message: 'Token已过期'
    })
  }
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log('测试账号:')
  console.log('  管理员: admin / admin123')
  console.log('  用户1: user1 / user123')
  console.log('  用户2: user2 / user456')
})
