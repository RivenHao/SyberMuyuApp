import { View, Text, Image, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import wishPng from '../../imgs/wish.png'
import closePng from '../../imgs/close.png'
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
    onClose()
    Taro.navigateTo({ url: `/pages/wish/index?merit_cost=${meritCost}` })
  }
  
  const handleDonate = () => {
    if (allCollected) return // 已集齐则不响应点击
    onDonate()
  }
  
  const handleClose = () => {
    onClose()
  }
  
  return (
    <View className='modal'>
      <View className='modal-content'>
        <Text className='modal-title'>- 祈愿 -</Text>
        <View className='close-btn' onClick={handleClose}>
          <Image src={closePng} className='close-img' />
        </View>
        <Image src={wishPng} className='wish-img' />
        <Text>愿行合一</Text>
        <Button 
          onClick={handleDonate} 
          className={`btn ${allCollected ? 'btn-disabled' : ''}`}
          disabled={allCollected}
        >
          {allCollected ? '佛理图鉴已集齐' : `捐香火，予诸佛（${meritCost}功德）`}
        </Button>
        <Button onClick={handleWish} className='btn'>用功德，发愿心（{meritCost}功德）</Button>
      </View>
    </View>
  )
}