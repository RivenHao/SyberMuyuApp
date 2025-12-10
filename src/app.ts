import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { login } from './apis/auth'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {

  useLaunch(async () => {
    console.log('App launched.')
    
    // 1. 检查本地是否有 Token
    const token = Taro.getStorageSync('token')
    if (token) {
      console.log('已登录，Token:', token)
      return
    }

    // 2. 如果没有 Token，进行模拟登录
    // 生成一个随机 openid (仅开发用)
    let openid = Taro.getStorageSync('dev_openid')
    if (!openid) {
      openid = 'dev_user_' + Math.floor(Math.random() * 100000)
      Taro.setStorageSync('dev_openid', openid)
    }

    try {
      console.log('开始模拟登录...', openid)
      const res: any = await login(openid)
      
      // 3. 保存 Token 和用户信息
      if (res && res.token) {
        Taro.setStorageSync('token', res.token)
        Taro.setStorageSync('userInfo', res.user)
        console.log('登录成功!', res.user, res.token)
      }
    } catch (err) {
      console.error('登录失败', err)
    }
  })

  // children 是将要会渲染的页面
  return children
}

export default App
