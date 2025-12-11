import { get, post } from '../utils/request'

// 许愿
export const createWish = (params:{content: string, user_id: number, merit_cost: number}) => {
  return post('/wish/create', params)
}

// 获取用户愿望
export const getUserWishes = (user_id: number) => {
  return get('/wish/getUserWishes', { user_id })
}

// 还愿
export const fulfillWish = (params:{user_id: number, id: number, merit_cost: number}) => {
  return post('/wish/fulfillWish', params)
}