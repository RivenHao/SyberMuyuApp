import { post, request } from '../utils/request'

// 抽取佛理卡片（token 自动从 header 带上）
export const getGalleryList = () => {
  return post('/userGallery/getGalleryList')
}

// 获取用户图鉴列表（token 自动从 header 带上）
export const getUserGalleryList = () => {
  return post('/userGallery/getUserGalleryList')
}

// 检查分享卡片状态（不解锁，只查询）
export const checkShareCard = (galleryId: number) => {
  return request('/userGallery/checkShareCard', 'POST', { gallery_id: galleryId }, { showErrorToast: false })
}

// 通过分享解锁卡片（静默处理错误，不显示 Toast）
export const unlockCardByShare = (galleryId: number) => {
  return request('/userGallery/unlockByShare', 'POST', { gallery_id: galleryId }, { showErrorToast: false })
}