import { post } from '../utils/request'

export const login = (openid: string) => {
  return post('/auth/dev-login', { openid })
}
