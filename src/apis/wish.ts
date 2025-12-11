import { post } from '../utils/request'

export const createWish = (params:{content: string, user_id: number, merit_cost: number}) => {
  return post('/wish/create', params)
}