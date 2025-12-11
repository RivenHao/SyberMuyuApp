import { post } from '../utils/request'

export const getGalleryList = (user_id: number) => {
  return post('/userGallery/getGalleryList', { user_id })
}

export const getUserGalleryList = (user_id: number) => {
  return post('/userGallery/getUserGalleryList', { user_id })
}