import { useState } from "react";

import { View, Text } from "@tarojs/components";
import './index.scss'
import { getGalleryList, decreaseMerit, increasePoolLevel } from "../../apis";
import { UserInfo } from "../../apis/type";
import { poolMap } from "../../config/poolMap";

interface DonateModalProps {
  show: boolean
  onClose: () => void
  userInfo: UserInfo
  onRefresh: () => void
}

export default function DonateModal(props: DonateModalProps) {
  const { show, onClose, userInfo, onRefresh } = props
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardInfo, setCardInfo] = useState<any>(null)

  if (!show) return null
  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true)
    }
  }

  const handleClose = () => {
    setIsFlipped(false) // 重置状态
    onClose()
  }

  const handleDonate = async () => {
    console.log('捐香火')
    // 获取佛理卡片
    const cardRes = await getGalleryList(userInfo.id)
    setCardInfo(cardRes)
    // 减少功德
    await decreaseMerit(poolMap[userInfo.pool_level as keyof typeof poolMap])
    // 扩充容量
    await increasePoolLevel()
    onRefresh()
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
          {cardInfo?.title && <Text className='card-title'>{cardInfo.title}</Text>}
          {cardInfo?.description && <Text className='card-content'>{cardInfo.description}</Text>}
          {cardInfo?.explanation && <Text className='card-source'>—— {cardInfo.explanation}</Text>}
        </View>
      </View>
    </View>
  )
}
