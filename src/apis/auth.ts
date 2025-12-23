import { get, post } from '../utils/request'

// 真实微信登录（无需 token）
export const wxLogin = (code: string) => {
  return post('/auth/wx-login', { code })
}

// 获取用户信息（需要 token）
export const getUserInfo = () => {
  return get('/auth/profile')
}

// 同步功德（需要 token）
export const syncMerit = (increment: number) => {
  return post('/auth/merit/sync', { increment })
}

// 减少功德（需要 token）
export const decreaseMerit = (decrement: number) => {
  return post('/auth/merit/decrease', { decrement })
}

// 扩充容量（需要 token）
export const increasePoolLevel = () => {
  return post('/auth/increasePoolLevel')
}