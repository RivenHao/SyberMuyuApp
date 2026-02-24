import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import './app.scss'

// 需要预加载的图片资源
const PRELOAD_IMAGES = [
  // 木鱼主体（5个阶段）
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-1.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-2.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-3.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-4.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-5.png',
  // 木鱼发光部件
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-bottom.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-center.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-front.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-top.png',
  // 图鉴卡片封面
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/gallery/cardlevel1.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/gallery/cardlevel2.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/gallery/cardlevel3.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/gallery/unknowncard.png',
  // 捐香火翻牌卡片
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/back.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/front_new1.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/front_new2.png',
  'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/front_new3.png',
]

// 预加载图片（利用 getImageInfo 触发下载和缓存）
const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    Taro.getImageInfo({
      src: url,
      success: () => console.log('图片预加载成功:', url.split('/').pop()),
      fail: () => console.log('图片预加载失败:', url.split('/').pop())
    })
  })
}

function App({ children }: PropsWithChildren<any>) {

  useLaunch(() => {
    console.log('App launched.')
    // 登录逻辑已移至 ensureLogin()，页面按需调用
    
    // 加载佛理卡片字体
    Taro.loadFontFace({
      global: true,
      family: 'CardFont',
      source: 'url("https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/ziti.ttf")',
      success: () => console.log('字体加载成功'),
      fail: (err) => console.log('字体加载失败', err)
    })

    // 预加载图鉴等常用图片资源
    preloadImages(PRELOAD_IMAGES)
  })

  return children
}

export default App
