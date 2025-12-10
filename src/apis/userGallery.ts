import { post } from '../utils/request'

export const getGalleryList = (user_id: number) => {
  return post('/userGallery/getGalleryList', { user_id })
}