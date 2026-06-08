import { useState, useEffect, useCallback } from 'react'
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

export default function LevelUpModal({ queue, onComplete }: Props) {
  const [currentItem, setCurrentItem] = useState<LevelUpEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (queue.length > 0 && !visible) {
      setCurrentItem(queue[0])
      setVisible(true)
    }
  }, [queue, visible])

  const handleClose = useCallback(() => {
    setVisible(false)
    // 播放下一个或结束
    setTimeout(() => {
      const remaining = queue.slice(1)
      if (remaining.length > 0) {
        setCurrentItem(remaining[0])
        setVisible(true)
      } else {
        setCurrentItem(null)
        onComplete()
      }
    }, 200)
  }, [queue, onComplete])

  // 自动关闭（1.5s）
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(handleClose, 1500)
    return () => clearTimeout(timer)
  }, [visible, currentItem])

  if (!visible || !currentItem) return null

  return (
    <View className='level-up-modal'>
      <View className='level-up-modal__card' onClick={handleClose}>
        <View
          className='level-up-modal__glow'
          style={{ boxShadow: `0 0 60px ${currentItem.primary_color}` }}
        />
        <Text className='level-up-modal__label'>升级</Text>
        <Text
          className='level-up-modal__level'
          style={{ color: currentItem.primary_color }}
        >
          Lv.{currentItem.level}
        </Text>
        <Text
          className='level-up-modal__title'
          style={{ color: currentItem.primary_color }}
        >
          {currentItem.title}
        </Text>
        <Text className='level-up-modal__bonus'>
          等级加成 +{currentItem.level_merit}
        </Text>
      </View>
    </View>
  )
}
