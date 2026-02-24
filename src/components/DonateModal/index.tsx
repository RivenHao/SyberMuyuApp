import { useState } from "react";
import Taro from "@tarojs/taro";

import { View, Text, Button } from "@tarojs/components";
import './index.scss'
import { getGalleryList, decreaseMerit, increasePoolLevel } from "../../apis";
import { UserInfo } from "../../apis/type";
import { getPoolCapacity, isMaxPoolLevel, DEFAULT_POOL_CAPACITIES } from "../../config/poolMap";
import { playClickSound } from '../../utils/clickSound'

interface DonateModalProps {
  show: boolean
  onClose: () => void
  userInfo: UserInfo
  onRefresh: () => void
  poolCapacities?: number[] // 从父组件传入服务端配置的容量数组
  onCardChange?: (cardInfo: any) => void // 卡片变化时通知父组件（用于分享）
}

export default function DonateModal(props: DonateModalProps) {
  const { show, onClose, userInfo, onRefresh, poolCapacities = DEFAULT_POOL_CAPACITIES, onCardChange } = props
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardInfo, setCardInfo] = useState<any>(null)
  const [allCollected, setAllCollected] = useState(false) // 是否已集齐所有卡片

  if (!show) return null
  
  const handleFlip = () => {
    if (!isFlipped) {
      playClickSound()
      setIsFlipped(true)
    }
  }

  const handleClose = () => {
    playClickSound()
    setIsFlipped(false) // 重置状态
    setCardInfo(null)
    setAllCollected(false)
    onClose()
  }

  // 祝福好友 - 点击时播放音效
  const handleShareClick = () => {
    playClickSound()
  }

  const handleDonate = async () => {
    playClickSound()
    try {
      // 1. 抽取佛理卡片
      const cardRes: any = await getGalleryList()
      
      // 处理抽卡结果
      if (cardRes === null) {
        // code=1: 已集齐所有卡片
        setAllCollected(true)
        setCardInfo(null)
        onCardChange?.(null)
      } else {
        setCardInfo(cardRes)
        setAllCollected(false)
        onCardChange?.(cardRes) // 通知父组件当前卡片信息
      }
      // 2. 减少功德（使用当前池子容量，从服务端配置获取）
      const meritCost = getPoolCapacity(userInfo.pool_level ?? 0, poolCapacities)
      await decreaseMerit(meritCost)
      
      // 3. 扩充容量（检查是否已达上限，使用服务端配置）
      const currentLevel = userInfo.pool_level ?? 0
      if (!isMaxPoolLevel(currentLevel, poolCapacities)) {
        await increasePoolLevel()
      }
      
      onRefresh()
    } catch (err: any) {
      console.error('捐香火失败:', err)
      Taro.showToast({
        title: err?.msg || '操作失败，请重试',
        icon: 'none',
      })
    }
  }

  // 当前品级
  const currentRarity = cardInfo?.rarity || 1

  return (
    <View className='donate-modal' onClick={handleClose}>
      {/* 阻止冒泡，点击卡片区域不会关闭弹窗 */}
      <View className='donate-wrapper' onClick={(e) => e.stopPropagation()}>
        <View 
          className={`card-container ${isFlipped ? 'flipped' : ''}`} 
          onClick={handleFlip}
        >
          {/* 卡片背面 (初始显示) */}
          <View className='card-face card-back' onClick={handleDonate} />

          {/* 卡片正面 (翻转后显示，根据 rarity 显示不同背景) */}
          <View className={`card-face card-front rarity-${currentRarity}`}>
            <>
              {cardInfo?.title && <Text className='card-title'>{cardInfo.title}</Text>}
              <View className='card-text-container'>
                {cardInfo?.description && <Text className='card-content'>{cardInfo.description.replace(/\\n/g, '\n')}</Text>}
                {cardInfo?.explanation && (
                  <Text className='card-source'>
                    {currentRarity === 3 ? '心法真诠：' : '注解：'}{cardInfo.explanation.replace(/\\n/g, '\n')}
                  </Text>
                )}
              </View>
            </>
          </View>
        </View>

        {/* 翻转后显示按钮 */}
        {isFlipped && (
          <View className={`card-buttons rarity-${currentRarity}`}>
            <Button 
              className='card-btn share-btn' 
              openType='share'
              onClick={handleShareClick}
            >
              祝福好友
            </Button>
            <View className='card-btn' onClick={handleClose}>
              <Text className='card-btn-text'>关闭</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
