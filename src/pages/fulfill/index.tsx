import { useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";

import { View, Text, Swiper, SwiperItem } from "@tarojs/components";
import './index.scss';
import { fulfillWish, getUserWishes } from "../../apis";

export default function Beings() {
  const [wishList, setWishList] = useState<any[]>([])
  const init = async () => {
    const res = await getUserWishes(Taro.getStorageSync('token'))
    console.log(res)
    setWishList(res)
  }
  useDidShow(() => {
    init()
  })
  const handleFulfill = (item: any) => {
    console.log(item)
    Taro.showModal({
      title: '还愿',
      content: `确认后将消耗${item.merit_cost}功德进行还原，是否继续？`,
      success: async (res) => {
        if (res.confirm) {
          await fulfillWish({ user_id: item.user_id, id: item.id, merit_cost: item.merit_cost })
          Taro.showToast({
            title: '还愿成功',
            icon: 'success',
          })
          await init()
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