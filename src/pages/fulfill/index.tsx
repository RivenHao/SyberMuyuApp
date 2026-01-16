import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { View, Text, Swiper, SwiperItem, Image, Button } from "@tarojs/components";
import { fulfillWish, getUserWishes, getUserInfo } from "../../apis";
import './index.scss';
import { playClickSound } from "../../utils/clickSound";

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export default function Fulfill() {
  const [wishList, setWishList] = useState<any[]>([])
  const [currentMerit, setCurrentMerit] = useState<number>(0)
  const [dissolvingId, setDissolvingId] = useState<number | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [contentVisible, setContentVisible] = useState(true) // 控制内容可见性（用于平滑过渡）
  
  const init = async () => {
    const userInfo = await getUserInfo()
    setCurrentMerit(Number(userInfo.current_merit))
    const res = await getUserWishes()
    console.log(res)
    setWishList(res)
  }
  
  useDidShow(() => {
    init()
  })
  
  const handleFulfill = (item: any) => {
    if (currentMerit < item.merit_cost) {
      Taro.showToast({
        title: `功德不足，还需 ${item.merit_cost - currentMerit} 功德`,
        icon: 'none',
      })
      return
    }
    playClickSound()
    setShowModal(true)
  }

  const handleFulfillConfirm = async () => {
    playClickSound()
    try {
      const currentItem = wishList[currentIndex]
      await fulfillWish(currentItem.id)
      setShowModal(false)
      
      // 触发粒子消散动画
      setDissolvingId(currentItem.id)
      
      // 卡片消散动画快结束时（1s后），开始淡出整个内容区
      setTimeout(() => {
        setContentVisible(false)
      }, 1000)
      
      // 消散动画完成后（1.5s），刷新数据
      setTimeout(async () => {
        setDissolvingId(null)
        await init()
        // 如果删除的不是最后一个，保持当前索引；否则回退一个
        if (currentIndex >= wishList.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }
        // 数据刷新后，短暂延迟让 DOM 更新，再淡入新内容
        setTimeout(() => setContentVisible(true), 50)
      }, 1500)
      
    } catch (err) {
      console.error('还愿失败:', err)
    }
  }

  const handleSwiperChange = (e: any) => {
    setCurrentIndex(e.detail.current)
  }

  return (
    <View className='index-page'>
      <View className='fulfill-header' onClick={() => { playClickSound(); Taro.navigateBack() }}>
        <Image className='fulfill-back-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/back.png' />
        <Text className='fulfill-back-text'>首页</Text>
      </View>
      
      <Text className='fulfill-title'>我的祈愿（{wishList.length}）</Text>
      
      {wishList.length === 0 ? (
        <View className={`empty-state ${contentVisible ? 'visible' : 'hidden'}`}>
          <Image className='empty-state-image' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/empty-wish.png' />
          <Text className='empty-text-title'>暂无祈愿</Text>
          <Text className='empty-text'>敲击木鱼积累功德，功德圆满时可许下心愿！</Text>
          <Button className='empty-state-button' onClick={() => { playClickSound(); Taro.navigateTo({ url: '/pages/index/index' }) }}>去敲木鱼</Button>
        </View>
      ) : (
        <>
          <Swiper 
            className={`wish-swiper ${contentVisible ? 'visible' : 'hidden'}`}
            previousMargin='40rpx'
            nextMargin='40rpx'
            current={currentIndex}
            onChange={handleSwiperChange}
          >
            {wishList.map((item) => (
              <SwiperItem key={item.id} className='wish-swiper-item'>
                <View className={`wish-card ${dissolvingId === item.id ? 'dissolving' : ''}`}>
                  <Image 
                    className='wish-card-bg' 
                    src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wishContentCard.png' 
                    mode='aspectFit'
                  />
                  <View className='wish-card-content'>
                    <Text className='wish-text'>{item.content}</Text>
                    <Text className='wish-date'>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              </SwiperItem>
            ))}
          </Swiper>
          
          {/* 自定义分页指示器 */}
          <View className={`swiper-dots ${contentVisible ? 'visible' : 'hidden'}`}>
            {wishList.map((_, index) => (
              <View 
                key={index} 
                className={`swiper-dot ${currentIndex === index ? 'active' : ''}`} 
              />
            ))}
          </View>
          
          {/* 还愿按钮 */}
          <View className={`fulfill-btn ${contentVisible ? 'visible' : 'hidden'}`} onClick={() => handleFulfill(wishList[currentIndex])}>
            已实现，去还愿（{wishList[currentIndex]?.merit_cost}功德）
          </View>
        </>
      )}
      {showModal && (
        <View className='fulfill-modal' onClick={() => { playClickSound(); setShowModal(false) }}>
          <View className='fulfill-modal-content' onClick={(e) => e.stopPropagation()}>
            <Image className='fulfill-modal-image' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/modal-fulfill.png' />
            <Text className='fulfill-modal-text'>还愿后，祈愿牌将归还诸佛</Text>
            <View className='fulfill-modal-buttons'>
              <Button className='fulfill-modal-btn fulfill-modal-btn-confirm' onClick={handleFulfillConfirm}>确认还愿（{wishList[currentIndex]?.merit_cost}功德）</Button>
              <Button className='fulfill-modal-btn fulfill-modal-btn-cancel' onClick={() => { playClickSound(); setShowModal(false) }}>尚未实现</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}