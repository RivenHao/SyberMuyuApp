import { View, Text, Image, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import wishPng from '../../imgs/wish.png'
import closePng from '../../imgs/close.png'
import './index.scss'

interface WishModalProps {
  show: boolean
  onClose: () => void
  onDonate: () => void
}
export default function WishModal(props: WishModalProps) {
  const { show, onClose, onDonate } = props
  if (!show) return null
  const handleWish = () => {
    onClose()
    Taro.navigateTo({ url: '/pages/wish/index' })
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
        <Button onClick={onDonate} className='btn'>捐香火，予诸佛（50功德）</Button>
        <Button onClick={handleWish} className='btn'>用功德，发愿心（50功德）</Button>
      </View>
    </View>
  )
}