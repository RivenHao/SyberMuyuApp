import { View, Text, Image } from '@tarojs/components'
import { playClickSound } from '../../utils/clickSound'
import './index.scss'

interface ShareUnlockModalProps {
  show: boolean
  onClose: () => void
  success: boolean // true: 解锁成功, false: 已拥有
  cardTitle?: string // 卡片名称
}

export default function ShareUnlockModal({ show, onClose, success, cardTitle }: ShareUnlockModalProps) {
  if (!show) return null

  const handleClose = () => {
    playClickSound()
    onClose()
  }

  return (
    <View className='share-unlock-modal' onClick={handleClose}>
      <View className='share-unlock-content' onClick={(e) => e.stopPropagation()}>
        <Image 
          className='share-unlock-close' 
          src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/set-close.png' 
          onClick={handleClose}
        />
        
        <View className='share-unlock-body'>
          {success ? (
            <>
              <Text className='share-unlock-emoji'>🎁</Text>
              <Text className='share-unlock-title'>好友送你一份佛缘</Text>
              {cardTitle && (
                <Text className='share-unlock-card'>「{cardTitle}」</Text>
              )}
              <Text className='share-unlock-desc'>这张卡片已加入你的图鉴</Text>
              <Text className='share-unlock-hint'>愿你心生欢喜，功德无量</Text>
            </>
          ) : (
            <>
              <Text className='share-unlock-emoji'>✨</Text>
              <Text className='share-unlock-title'>缘分天注定</Text>
              {cardTitle && (
                <Text className='share-unlock-card'>「{cardTitle}」</Text>
              )}
              <Text className='share-unlock-desc'>你已拥有这张卡片</Text>
              <Text className='share-unlock-hint'>与好友心有灵犀，善缘殊胜</Text>
            </>
          )}
        </View>

        <View className='share-unlock-btn' onClick={handleClose}>
          <Text className='share-unlock-btn-text'>知道了</Text>
        </View>
      </View>
    </View>
  )
}
