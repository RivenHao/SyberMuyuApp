import { useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";

import { View, Text, Swiper, SwiperItem } from "@tarojs/components";
import './index.scss';
import { fulfillWish, getUserWishes, getUserInfo } from "../../apis";

export default function Fulfill() {
  const [wishList, setWishList] = useState<any[]>([])
  const [currentMerit, setCurrentMerit] = useState<number>(0)
  
  const init = async () => {
    // 获取用户当前功德
    const userInfo = await getUserInfo()
    setCurrentMerit(Number(userInfo.current_merit))
    
    // 获取愿望列表
    const res = await getUserWishes()
    setWishList(res)
  }
  
  useDidShow(() => {
    init()
  })
  
  const handleFulfill = (item: any) => {
    // 前端先校验功德是否足够
    if (currentMerit < item.merit_cost) {
      Taro.showToast({
        title: `功德不足，还需 ${item.merit_cost - currentMerit} 功德`,
        icon: 'none',
      })
      return
    }
    
    Taro.showModal({
      title: '还愿',
      content: `确认后将消耗${item.merit_cost}功德进行还愿，是否继续？\n当前功德：${currentMerit}`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await fulfillWish(item.id)
            Taro.showToast({
              title: '还愿成功',
              icon: 'success',
            })
            await init()
          } catch (err) {
            // 后端也会校验，这里捕获错误
            console.error('还愿失败:', err)
          }
        }
      }
    })
  }
  return (
    <View className='index-page'>
        <View className='page-navbar'>
            <Text className='back-btn' onClick={() => Taro.navigateBack()}>返回</Text>
          </View>
        <View className='page-container'>
        
        <Swiper 
          className='wish-swiper' 
          indicatorDots 
          indicatorColor='rgba(141, 136, 136)'
          indicatorActiveColor='#fff'
        >
          {wishList.map((item) => (
            <SwiperItem key={item.id} className='wish-item'>
              {/* <Image src={wishCardPng} className='wish-card' /> */}
              <Text className='wish-content'>心愿：{item.content}</Text>
              <View className='wish-btn' onClick={() => handleFulfill(item)}>已实现，去还愿（{item.merit_cost}功德）</View>
            </SwiperItem>
          ))}
        </Swiper>
      </View>
      
      
      <View className='fulfill-container'>
        {/* {wishList.map((item) => (
          <View className='wish-item' key={item.id}>
            <Image src={wishCardPng} className='wish-card' />
            <Text className='wish-content'>{item.content}</Text>
            <Text className='wish-merit'>{item.merit_cost}</Text>
          </View>
        ))} */}
      </View>
    </View>
  )
}