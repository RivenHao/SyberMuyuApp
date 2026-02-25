import { useState } from "react";
import { View, Text, Image, Button } from "@tarojs/components";
import './index.scss'
import { unlockCardByShare } from "../../apis";
import { playClickSound } from '../../utils/clickSound'

interface ShareCardModalProps {
  show: boolean
  onClose: () => void
  cardInfo: any // 分享的卡片信息
  onUnlockSuccess?: () => void // 解锁成功后的回调
}

export default function ShareCardModal(props: ShareCardModalProps) {
  const { show, onClose, cardInfo, onUnlockSuccess } = props
  const [isFlipped, setIsFlipped] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)

  if (!show || !cardInfo) return null
  
  const handleFlip = async () => {
    if (isFlipped || isUnlocking) return
    
    playClickSound()
    setIsUnlocking(true)
    
    try {
      // 翻转时解锁卡片
      await unlockCardByShare(cardInfo.id)
      setIsFlipped(true)
      onUnlockSuccess?.()
    } catch (err) {
      console.error('解锁卡片失败:', err)
      // 即使失败也翻转，让用户看到内容
      setIsFlipped(true)
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleClose = () => {
    playClickSound()
    setIsFlipped(false)
    setIsUnlocking(false)
    onClose()
  }

  // 祝福好友 - 点击时播放音效
  const handleShareClick = () => {
    playClickSound()
  }

  // 当前品级
  const currentRarity = cardInfo?.rarity || 1

  return (
    <View className='share-card-modal' onClick={handleClose}>
      {/* 阻止冒泡，点击卡片区域不会关闭弹窗 */}
      <View className='share-card-wrapper' onClick={(e) => e.stopPropagation()}>
        <View 
          className={`card-container ${isFlipped ? 'flipped' : ''}`} 
          onClick={handleFlip}
        >
          {/* 卡片背面 (初始显示) */}
          <View className='card-face card-back' />

          {/* 卡片正面 (翻转后显示，根据 rarity 显示不同背景) */}
          <View className={`card-face card-front rarity-${currentRarity}`}>
            <>
              {cardInfo?.title && <Text className='card-title'>{cardInfo.title}</Text>}
              <View className='card-text-container'>
                {cardInfo?.description && <Text className='card-content'>{cardInfo.description.replace(/\/n/g, '\n')}</Text>}
                {cardInfo?.explanation && (
                  <View className="card-explanation" style={currentRarity === 3 ? {background: '#857F4433'}: {background: '#44565C33'}}>
                    <Image className='card-explanation-icon' mode='heightFix' src={currentRarity === 3 ? "https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/xinfa.png" : "https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/zujie.png"}/>
                    <Text className='card-source'>
                      {cardInfo.explanation.replace(/\/n/g, '\n')}
                    </Text>
                  </View>
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
