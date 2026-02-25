import { useState } from "react";
import Taro, { useDidShow, useShareAppMessage } from "@tarojs/taro";
import { View, Text, Image, Button } from "@tarojs/components";
import { playClickSound } from "../../utils/clickSound";
import { getAllMerit, getUserInfo } from "../../apis";
import './index.scss';

export default function Beings() {
  const [globalMerit, setGlobalMerit] = useState<number>(0);
  const [personalMerit, setPersonalMerit] = useState<number>(0);
  const init = async () => {
    const globalRes = await getAllMerit()
    setGlobalMerit(globalRes?.stat_value ?? 0)
    // token 会自动从 header 带上
    const personalRes = await getUserInfo()
    setPersonalMerit(personalRes?.total_merit ?? 0)
  }
  useDidShow(() => {
    init()
  })

  // 分享给好友
  useShareAppMessage(() => {
    return {
      title: '攒功德去许愿，捐香火得图鉴',
      path: '/pages/index/index',
      imageUrl: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/share-main.png'
    }
  })
  return (
    <View className='index-page'>
      <View className='beings-title' onClick={() => { playClickSound(); Taro.navigateBack() }}>
        <Image className='beings-title-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/back.png' />
        <Text className='beings-title-text'>返回</Text>
      </View>

      <View className='personal-merit-container'>
        <Text className='personal-merit'>我累计贡献的功德</Text>
        <Text className='personal-merit-value'>{personalMerit}</Text>
      </View>
      
      <View className='global-merit-wrapper'>
        <Text className='global-merit-title'>众生功德池</Text>
        <View className='global-merit-progress'>
          <View 
            className='global-merit-progress-bar' 
            style={{ width: `${Math.min((globalMerit / 1000000) * 100, 100)}%` }}
          />
        </View>
        <Text className='global-merit-value'>{globalMerit}/1000000</Text>
        <Image className='global-merit-img' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/beings.png' />
      </View>

      <Text className='beings-text'>攒满功德池，会有什么事情发生呢？</Text>
      <Button className='beings-button' openType='share' onClick={() => playClickSound()}>邀人行善</Button>
    </View>
  )
}