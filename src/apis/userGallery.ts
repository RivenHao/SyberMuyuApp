import { post } from '../utils/request'

// 抽取佛理卡片（token 自动从 header 带上）
export const getGalleryList = () => {
  return post('/userGallery/getGalleryList')
}

// 获取用户图鉴列表（token 自动从 header 带上）
export const getUserGalleryList = () => {
  return post('/userGallery/getUserGalleryList')
}