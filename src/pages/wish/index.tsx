import Taro from "@tarojs/taro";
import { View, Textarea } from "@tarojs/components";
import './index.scss';

export default function Wish() {
  const handleWish = () => {
    console.log('用功德发愿心')
  }
  return (
    <View className='index-page'>
      <View className='back-btn' onClick={() => Taro.navigateBack()}>返回</View>
      <View className='wish-title'>祈愿</View>
      <View className='wish-textarea-container'>
        <Textarea
          className='wish-textarea'
          placeholder='写下你的心愿，交予诸佛'
        />
      </View>
      <View className='wish-button' onClick={handleWish}>用功德发愿心</View>
    </View>
  )
}