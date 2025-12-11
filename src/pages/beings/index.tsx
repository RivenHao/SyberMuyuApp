import { useState } from "react";
import Taro, { useDidShow } from "@tarojs/taro";

import { View, Text } from "@tarojs/components";
import './index.scss';
import { getAllMerit, getUserInfo } from "../../apis";

export default function Beings() {
  const [globalMerit, setGlobalMerit] = useState<number>(0);
  const [personalMerit, setPersonalMerit] = useState<number>(0);
  const init = async () => {
    const globalRes = await getAllMerit()
    setGlobalMerit(globalRes.stat_value)
    const personalRes = await getUserInfo(Taro.getStorageSync('token'))
    setPersonalMerit(personalRes.total_merit)
  }
  useDidShow(() => {
    init()
  })
  return (
    <View className='index-page'>
      <View className='back-btn' onClick={() => Taro.navigateBack()}>返回</View>
      <View className='title'>众生</View>
      <Text className='personal-merit'>个人历史总功德：{personalMerit}</Text>
      <Text className='global-merit'>全服功德池：{globalMerit}</Text>
    </View>
  )
}