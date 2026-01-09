import { useState } from "react";
import Taro from "@tarojs/taro";

import { View, Text } from "@tarojs/components";
import './index.scss'
import { getGalleryList, decreaseMerit, increasePoolLevel } from "../../apis";
import { UserInfo } from "../../apis/type";
import { getPoolCapacity, isMaxPoolLevel, DEFAULT_POOL_CAPACITIES } from "../../config/poolMap";

interface DonateModalProps {
  show: boolean
  onClose: () => void
  userInfo: UserInfo
  onRefresh: () => void
  poolCapacities?: number[] // 从父组件传入服务端配置的容量数组
}

export default function DonateModal(props: DonateModalProps) {
  const { show, onClose, userInfo, onRefresh, poolCapacities = DEFAULT_POOL_CAPACITIES } = props
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardInfo, setCardInfo] = useState<any>(null)
  const [allCollected, setAllCollected] = useState(false) // 是否已集齐所有卡片

  if (!show) return null
  
  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true)
    }
  }

  const handleClose = () => {
    setIsFlipped(false) // 重置状态
    setCardInfo(null)
    setAllCollected(false)
    onClose()
  }

  const handleDonate = async () => {
    try {
      // 1. 抽取佛理卡片
      const cardRes: any = await getGalleryList()
      
      // 处理抽卡结果
      if (cardRes === null) {
        // code=1: 已集齐所有卡片
        setAllCollected(true)
        setCardInfo(null)
      } else {
        setCardInfo(cardRes)
        setAllCollected(false)
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

  return (
    <View className='donate-modal' onClick={handleClose}>
      {/* 阻止冒泡，点击卡片不会关闭弹窗 */}
      <View 
        className={`card-container ${isFlipped ? 'flipped' : ''}`} 
        onClick={(e) => { e.stopPropagation(); handleFlip(); }}
      >
        {/* 卡片背面 (初始显示) */}
        <View className='card-face card-back' onClick={handleDonate}>
          <Text className='card-hint'>点击翻开</Text>
        </View>

        {/* 卡片正面 (翻转后显示) */}
        <View className='card-face card-front'>
          {allCollected ? (
            <>
              <Text className='card-title'>🎉 恭喜</Text>
              <Text className='card-content'>您已集齐所有佛理卡片！</Text>
              <Text className='card-source'>功德圆满</Text>
            </>
          ) : (
            <>
              {cardInfo?.title && <Text className='card-title'>{cardInfo.title}</Text>}
              {cardInfo?.description && <Text className='card-content'>{cardInfo.description}</Text>}
              {cardInfo?.explanation && <Text className='card-source'>—— {cardInfo.explanation}</Text>}
            </>
          )}
        </View>
      </View>
    </View>
  )
}
