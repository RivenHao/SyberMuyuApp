import { post, get } from '../utils/request'

// 同步功德
export const syncMerit = (increment: number) => {
  return post('/auth/merit/sync', { increment })
}

// 获取用户信息
export const getUserInfo = () => {
  return get('/auth/profile')
}

// 减少功德
export const decreaseMerit = (decrement: number) => {
  return post('/auth/merit/decrease', { decrement })
}

// 扩充容量
export const increasePoolLevel = () => {
  return post('/auth/increasePoolLevel')
}