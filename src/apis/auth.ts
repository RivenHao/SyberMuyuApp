import Taro from '@tarojs/taro'
import { get, post } from '../utils/request'

// 登录请求
export const login = (openid: string) => {
  return post('/auth/dev-login', { openid })
}

// 确保已登录，返回 token (用户ID)
let loginPromise: Promise<number> | null = null

export const ensureLogin = async (): Promise<number> => {
  // 1. 已有 token，直接返回
  const token = Taro.getStorageSync('token')
  if (token) return Number(token)

  // 2. 正在登录中，复用同一个 Promise（防止并发多次登录）
  if (loginPromise) return loginPromise

  // 3. 执行登录
  loginPromise = (async () => {
    let openid = Taro.getStorageSync('dev_openid')
    if (!openid) {
      openid = 'dev_user_' + Math.floor(Math.random() * 100000)
      Taro.setStorageSync('dev_openid', openid)
    }

    const res: any = await login(openid)
    Taro.setStorageSync('token', res.token)
    Taro.setStorageSync('userInfo', res.user)
    console.log('登录成功:', res.token)
    
    loginPromise = null // 重置，下次可重新登录
    return Number(res.token)
  })()

  return loginPromise
}

// 同步功德
export const syncMerit = (increment: number) => {
  return post('/auth/merit/sync', { increment })
}

// 获取用户信息
export const getUserInfo = (id: number) => {
  return get('/auth/profile', { id })
}

// 减少功德
export const decreaseMerit = (decrement: number) => {
  return post('/auth/merit/decrease', { decrement })
}

// 扩充容量
export const increasePoolLevel = () => {
  return post('/auth/increasePoolLevel')
}