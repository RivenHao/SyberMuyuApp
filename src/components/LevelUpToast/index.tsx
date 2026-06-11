import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface LevelUpEvent {
  level: number
  title: string
  level_merit: number
  primary_color: string
}

interface Props {
  /** 升级队列，从 syncMerit 回包的 level_change_history 推入 */
  queue: LevelUpEvent[]
  /** 队列消费完毕回调 */
  onComplete: () => void
}

/**
 * 升级特效（toast 模式）
 * - 不阻塞操作，不带遮罩
 * - 跨级升级时仅展示最终到达的那一级，避免连弹
 */
export default function LevelUpToast({ queue, onComplete }: Props) {
  const [active, setActive] = useState<LevelUpEvent | null>(null)

  useEffect(() => {
    if (active || queue.length === 0) return
    setActive(queue[queue.length - 1])
    const timer = setTimeout(() => {
      setActive(null)
      onComplete()
    }, 1500)
    return () => clearTimeout(timer)
  }, [queue, active, onComplete])

  if (!active) return null

  return (
    <View className='level-up-toast' style={{ color: active.primary_color }}>
      <Text className='level-up-toast__label'>升级</Text>
      <Text className='level-up-toast__main'>
        Lv.{active.level} {active.title}
      </Text>
    </View>
  )
}
