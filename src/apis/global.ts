import { get } from '../utils/request'

// 获取所有功德
export const getAllMerit = () => {
  return get('/globalStats/getAllMerit')
}

// 获取许愿功能开关
export const getShowWish = (): Promise<{ show_wish: boolean }> => {
  return get('/globalStats/getShowWish')
}