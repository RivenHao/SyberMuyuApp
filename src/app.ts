import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {

  useLaunch(() => {
    console.log('App launched.')
    // 登录逻辑已移至 ensureLogin()，页面按需调用
  })

  return children
}

export default App
