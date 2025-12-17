import { get, post } from '../utils/request'

// 开发环境模拟登录
// export const devLogin = (openid: string) => {
//   return post('/auth/dev-login', { openid })
// }

// 真实微信登录
export const wxLogin = (code: string) => {
  return post('/auth/wx-login', { code })
}

// 同步功德
export const syncMerit = (params:{increment: number, openid: string }) => {
  return post('/auth/merit/sync', params)
}

// 获取用户信息
export const getUserInfo = (openid: string) => {
  return get('/auth/profile', { openid })
}

// 减少功德
export const decreaseMerit = (params:{decrement: number, openid: string }) => {
  return post('/auth/merit/decrease', params)
}

// 扩充容量
export const increasePoolLevel = () => {
  return post('/auth/increasePoolLevel')
}