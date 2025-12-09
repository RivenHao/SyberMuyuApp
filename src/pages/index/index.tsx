import { useState, useRef } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'
import fishPng from '../../imgs/fish.png'

export default function Index() {
  const [merit, setMerit] = useState(0)
  const [isAnimate, setIsAnimate] = useState(false)
  const [popups, setPopups] = useState<{ id: number }[]>([]) // 存储漂浮文字队列
  const audioCtx = useRef<Taro.InnerAudioContext>()

  useLoad(() => {
    console.log('Page loaded.')
    // 初始化音频上下文（预留）
    // const ctx = Taro.createInnerAudioContext()
    // ctx.src = '你的音频地址.mp3'
    // audioCtx.current = ctx
  })

  const handleTap = () => {
    // 1. 增加功德
    setMerit(prev => prev + 1)

    // 2. 触发木鱼缩放动画
    setIsAnimate(true)
    setTimeout(() => setIsAnimate(false), 100) // 100ms后复原

    // 3. 触发震动
    Taro.vibrateShort({ type: 'light' })

    // 4. 播放声音 (需要有音频文件)
    // audioCtx.current?.stop()
    // audioCtx.current?.play()

    // 5. 添加漂浮文字
    const id = Date.now()
    setPopups(prev => [...prev, { id }])
    
    // 动画结束后移除该文字元素，防止DOM无限增长
    setTimeout(() => {
      setPopups(prev => prev.filter(item => item.id !== id))
    }, 1000)
  }

  return (
    <View className='index-page'>
      <View className='merit-pool'>
        <Text>当前功德: {merit}</Text>
      </View>

      <View className='muyu-container' onClick={handleTap}>
        {/* 木鱼主体 */}
        <Image 
          src={fishPng} 
          className={`muyu-img ${isAnimate ? 'active' : ''}`} 
        />
      </View>
      
      {/* 漂浮文字列表 - 移到外层容器，避免被 .muyu-container 的 transform 影响定位 */}
      {popups.map(item => (
        <Text key={item.id} className='merit-text animate'>
          功德+1
        </Text>
      ))}
    </View>
  )
}
