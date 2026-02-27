import { get, post } from '../utils/request'

// 许愿（token 自动从 header 带上）
export const createWish = (params: { content: string, merit_cost: number }) => {
  return post('/wish/create', params)
}

// 获取用户愿望（token 自动从 header 带上）
export const getUserWishes = () => {
  return get('/wish/getUserWishes')
}

// 还愿（token 自动从 header 带上）
export const fulfillWish = (wish_id: number) => {
  return post('/wish/fulfillWish', { wish_id })
}

// 获取所有心愿大类及其心愿列表
export const getWishCategoriesAll = (): Promise<any[]> => {
  return get('/wishCategory/getAll')
}

// 接收分享的心愿
export const receiveSharedWish = (wish_id: number) => {
  return post('/wish/receiveShared', { wish_id })
}

// 获取分享心愿信息
export const getSharedWish = (wish_id: number): Promise<any> => {
  return get('/wish/getShared', { wish_id })
}