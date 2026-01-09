import { useState } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { View, Textarea, Image, Text, Button } from "@tarojs/components";
import './index.scss';
import { createWish, increasePoolLevel, getUserInfo, getMuyuConfig } from "../../apis";
import { isMaxPoolLevel } from "../../config/poolMap";

export default function Wish() {
  const [wish, setWish] = useState('');
  const [meritCost, setMeritCost] = useState(0);
  const [showModal, setShowModal] = useState(false);
  useLoad((options:{merit_cost: number}) => {
    setMeritCost(Number(options.merit_cost));
  });
  const handleWishChange = (e: any) => {
    setWish(e.target.value);
  }
  const handleWish = async () => {
    setShowModal(true)
    
  }
  const handleWishConfirm = async () => {
    await createWish({ content: wish, merit_cost: meritCost })
    
    // 检查功德池是否已满，未满才扩容
    try {
      const [userInfo, config] = await Promise.all([getUserInfo(), getMuyuConfig()])
      if (!isMaxPoolLevel(userInfo.pool_level ?? 0, config.pool_capacities)) {
        await increasePoolLevel()
      }
    } catch (err) {
      console.error('扩容检查失败:', err)
    }
    
    Taro.navigateBack()
  }
  return (
    <View className='index-page'>
      <Image className='wish-bg-circle' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wish-bg-circle.png' />
      <View className='wish-title' onClick={() => Taro.navigateBack()}>
        <Image className='wish-title-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/back.png' />
        <Text className='wish-title-text'>返回</Text>
      </View>
      <View className='wish-textarea-container'>
        <Textarea
          className='wish-textarea'
          placeholder='写下你的心愿，交予诸佛'
          value={wish}
          onInput={handleWishChange}
          maxlength={300}
        />
        <Text className='wish-textarea-count'>{wish.length}/300</Text>
      </View>
        <View className='wish-button-container'>
          <View className='wish-button' onClick={handleWish}>用功德发愿心（{meritCost}功德）</View>
          <Text className='wish-button-text'>愿望实现后，记得来还愿哦～</Text>
      </View>
      {showModal && (
        <View className='wish-modal' onClick={() => setShowModal(false)}>
          <View className='wish-modal-content' onClick={(e) => e.stopPropagation()}>
            <Image className='wish-modal-image' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/modal-wish.png' />
            <Text className='wish-modal-text'>确认后将不可修改，请谨慎填写</Text>
            <View className='wish-modal-buttons'>
              <Button className='wish-modal-btn wish-modal-btn-confirm' onClick={handleWishConfirm}>确认（{meritCost}功德）</Button>
              <Button className='wish-modal-btn wish-modal-btn-cancel' onClick={() => setShowModal(false)}>取消</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}