import { useState } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { View, Textarea } from "@tarojs/components";
import './index.scss';
import { createWish, increasePoolLevel } from "../../apis";

export default function Wish() {
  const [wish, setWish] = useState('');
  const [meritCost, setMeritCost] = useState(0);
  useLoad((options:{merit_cost: number}) => {
    setMeritCost(Number(options.merit_cost));
  });
  const handleWishChange = (e: any) => {
    setWish(e.target.value);
  }
  const handleWish = async () => {
    if (wish.length === 0) {
      Taro.showToast({
        title: '请写下心愿',
        icon: 'none',
      });
      return;
    }
    console.log('用功德发愿心', wish)
    await createWish({ content: wish, user_id: Taro.getStorageSync('token'), merit_cost: meritCost })
    await increasePoolLevel()
    Taro.navigateBack()
  }
  return (
    <View className='index-page'>
      <View className='back-btn' onClick={() => Taro.navigateBack()}>返回</View>
      <View className='wish-title'>祈愿</View>
      <View className='wish-textarea-container'>
        <Textarea
          className='wish-textarea'
          placeholder='写下你的心愿，交予诸佛'
          value={wish}
          onInput={handleWishChange}
        />
      </View>
      <View className='wish-button' onClick={handleWish}>用功德发愿心</View>
    </View>
  )
}