import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useMemo } from "react";
import { View, Text, Swiper, SwiperItem, Image, Button } from "@tarojs/components";
import { fulfillWish, getUserWishes, getUserInfo } from "../../apis";
import './index.scss';

// 生成随机粒子配置
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    tx: (Math.random() - 0.5) * 900,
    ty: (Math.random() - 0.5) * 1200,
    delay: Math.random() * 0.6,
    size: 4 + Math.random() * 10,
    opacity: 0.6 + Math.random() * 0.4,
  }))
}

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
  const particles = useMemo(() => generateParticles(60), [])
  
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
    setShowModal(true)
  }

  const handleFulfillConfirm = async () => {
    try {
      const currentItem = wishList[currentIndex]
      await fulfillWish(currentItem.id)
      setShowModal(false)
      
      // 触发粒子消散动画
      setDissolvingId(currentItem.id)
      
      // 动画完成后刷新数据
      setTimeout(async () => {
        setDissolvingId(null)
        await init()
        // 如果删除的不是最后一个，保持当前索引；否则回退一个
        if (currentIndex >= wishList.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }
      }, 1500) // 动画时长 2.5 秒
      
    } catch (err) {
      console.error('还愿失败:', err)
    }
  }

  const handleSwiperChange = (e: any) => {
    setCurrentIndex(e.detail.current)
  }

  return (
    <View className='index-page'>
      <View className='fulfill-header' onClick={() => Taro.navigateBack()}>
        <Image className='fulfill-back-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/back.png' />
        <Text className='fulfill-back-text'>首页</Text>
      </View>
      
      <Text className='fulfill-title'>我的祈愿（{wishList.length}）</Text>
      
      {wishList.length === 0 ? (
        <View className='empty-state'>
          <Image className='empty-state-image' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/empty-wish.png' />
          <Text className='empty-text-title'>暂无祈愿</Text>
          <Text className='empty-text'>敲击木鱼积累功德，功德圆满时可许下心愿！</Text>
          <Button className='empty-state-button' onClick={() => Taro.navigateTo({ url: '/pages/index/index' })}>去敲木鱼</Button>
        </View>
      ) : (
        <>
          <Swiper 
            className='wish-swiper'
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
                  
                  {dissolvingId === item.id && (
                    <View className='particles-container'>
                      {particles.map((p) => (
                        <View
                          key={p.id}
                          className='particle'
                          style={{
                            '--tx': `${p.tx}rpx`,
                            '--ty': `${p.ty}rpx`,
                            '--delay': `${p.delay}s`,
                            '--size': `${p.size}rpx`,
                            '--opacity': p.opacity,
                          } as React.CSSProperties}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </SwiperItem>
            ))}
          </Swiper>
          
          {/* 自定义分页指示器 */}
          <View className='swiper-dots'>
            {wishList.map((_, index) => (
              <View 
                key={index} 
                className={`swiper-dot ${currentIndex === index ? 'active' : ''}`} 
              />
            ))}
          </View>
          
          {/* 还愿按钮 */}
          <View className='fulfill-btn' onClick={() => handleFulfill(wishList[currentIndex])}>
            已实现，去还愿（{wishList[currentIndex]?.merit_cost}功德）
          </View>
        </>
      )}
      {showModal && (
        <View className='fulfill-modal' onClick={() => setShowModal(false)}>
          <View className='fulfill-modal-content' onClick={(e) => e.stopPropagation()}>
            <Image className='fulfill-modal-image' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/modal-fulfill.png' />
            <Text className='fulfill-modal-text'>还愿后，祈愿牌将归还诸佛</Text>
            <View className='fulfill-modal-buttons'>
              <Button className='fulfill-modal-btn fulfill-modal-btn-confirm' onClick={handleFulfillConfirm}>确认还愿（{wishList[currentIndex]?.merit_cost}功德）</Button>
              <Button className='fulfill-modal-btn fulfill-modal-btn-cancel' onClick={() => setShowModal(false)}>尚未实现</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}