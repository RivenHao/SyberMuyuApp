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