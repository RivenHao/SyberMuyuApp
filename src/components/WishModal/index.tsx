import { View, Text, Image, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { playClickSound } from '../../utils/clickSound'
import './index.scss'

interface WishModalProps {
  show: boolean
  onClose: () => void
  onDonate: () => void
  meritCost: number
  allCollected?: boolean // 是否已集齐所有佛理图鉴
}
export default function WishModal(props: WishModalProps) {
  const { show, onClose, onDonate, meritCost, allCollected = false } = props
  if (!show) return null
  
  const handleWish = () => {
    playClickSound()
    onClose()
    Taro.navigateTo({ url: `/pages/wish/index?merit_cost=${meritCost}` })
  }
  
  const handleDonate = () => {
    if (allCollected) return // 已集齐则不响应点击
    playClickSound()
    onDonate()
  }
  
  return (
    <View className='modal' onClick={() => { playClickSound(); onClose() }}>
      <View className='modal-content' onClick={(e) => e.stopPropagation()}>
        <Image onClick={() => { playClickSound(); onClose() }} className='wish-close' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/set-close.png' />
        <View className='wish-btn'>
          <View onClick={handleDonate} className='wish-btn-item'>
            <Image className='wish-btn-item-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/wish-fulfill.png' />
            <Text className='wish-btn-item-text'>
              {allCollected ? '佛理图鉴已集齐' : `捐香火，予诸佛（${meritCost}功德）`}
            </Text>
          </View>
          <View onClick={handleWish} className='wish-btn-item'>
            <Image className='wish-btn-item-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/wish-mail.png' />
            <Text className='wish-btn-item-text'>
              用功德，发愿心（{meritCost}功德）
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}