import { get } from '../utils/request'

// 获取所有功德
export const getAllMerit = () => {
  return get('/globalStats/getAllMerit')
}