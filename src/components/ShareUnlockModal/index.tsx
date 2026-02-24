import { View, Text, Image, Button } from '@tarojs/components'
import { playClickSound } from '../../utils/clickSound'
import './index.scss'

interface ShareUnlockModalProps {
  show: boolean
  onClose: () => void
  cardTitle?: string // 卡片名称
}

export default function ShareUnlockModal({ show, onClose, cardTitle }: ShareUnlockModalProps) {
  if (!show) return null

  const handleClose = () => {
    playClickSound()
    onClose()
  }

  return (
    <View className='share-unlock-modal' onClick={handleClose}>
      <View className='share-unlock-content' onClick={(e) => e.stopPropagation()}>
        <Image className='share-unlock-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/have-card.png' />
        <View className='share-unlock-text'>
          <Text className='share-unlock-text-title'>你已拥有这张卡片</Text>
          <Text className='share-unlock-text-desc'>与好友心有灵犀，善缘殊胜</Text>
        </View>
        <Button className='share-unlock-btn' onClick={handleClose}>知道了</Button>
      </View>
    </View>
  )
}
