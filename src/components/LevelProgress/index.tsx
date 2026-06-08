import { View, Text } from '@tarojs/components'
import { LevelInfo } from '../../hooks/useLevelInfo'
import './index.scss'

interface Props {
  levelInfo: LevelInfo
  totalMerit: number
  hidden?: boolean
}

export default function LevelProgress({ levelInfo, totalMerit, hidden }: Props) {
  const { current, next, progress, remaining, isMax } = levelInfo

  if (hidden) return null

  return (
    <View className='level-progress'>
      <View className='level-progress__header'>
        <Text className='level-progress__level' style={{ color: current.primary_color }}>
          Lv.{current.level}
        </Text>
        <Text className='level-progress__title' style={{ color: current.primary_color }}>
          {current.title}
        </Text>
        <Text className='level-progress__merit'>
          {totalMerit} 功德
        </Text>
      </View>
      <View className='level-progress__bar-wrap'>
        <View
          className='level-progress__bar-fill'
          style={{
            width: `${progress * 100}%`,
            backgroundColor: current.primary_color,
          }}
        />
      </View>
      <View className='level-progress__footer'>
        {isMax ? (
          <Text className='level-progress__max'>已达最高境界</Text>
        ) : (
          <Text className='level-progress__remaining'>
            距「{next!.title}」还需 {remaining} 功德
          </Text>
        )}
      </View>
    </View>
  )
}
