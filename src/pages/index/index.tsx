import { useState, useRef, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useLoad } from '@tarojs/taro'
import './index.scss'
import { syncMerit, SettingData, getUserInfo, getSetting, getUserGalleryList, MuyuConfigData, checkShareCard, getWishCategoriesAll, getUserWishes, createWish } from '../../apis'
import { ensureLogin } from '../../utils/auth'
import WishModal from '../../components/WishModal'
import DonateModal from '../../components/DonateModal'
import GalleryModal from '../../components/GalleryModal'
import SettingModal from '../../components/SettingModal'
// import MuyuConfigModal from '../../components/MuyuConfigModal'
import ShareUnlockModal from '../../components/ShareUnlockModal'
import ShareCardModal from '../../components/ShareCardModal'
import ParticleCanvas, { ParticleCanvasRef } from '../../components/ParticleCanvas'
import { DEFAULT_MUYU_CONFIG } from '../../config/muyuConfig'
// import { DEFAULT_MUYU_CONFIG, USE_SERVER_CONFIG } from '../../config/muyuConfig'
import { playClickSound, preloadClickSound } from '../../utils/clickSound'

// 心愿大类主题颜色（渐变）
const WISH_CATEGORY_GRADIENTS: Record<number, string> = {
  1: 'radial-gradient(50% 50% at 50% 50%, #F8B69F 0%, #D4836A 100%)',
  2: 'radial-gradient(50% 50% at 50% 50%, #EBB4CF 0%, #C4809E 100%)',
  3: 'radial-gradient(50% 50% at 50% 50%, #FFE5C8 0%, #D4A872 100%)',
  4: 'radial-gradient(50% 50% at 50% 50%, #FFFAA6 0%, #D4C85A 100%)',
  5: 'radial-gradient(50% 50% at 50% 50%, #CEF1E8 0%, #7DBFAE 100%)',
  6: 'radial-gradient(50% 50% at 50% 50%, #D7FFDF 0%, #8AD49A 100%)',
}

// 图片资源配置 (OSS URL) - 请替换为实际的 OSS 地址
const MUYU_IMGS = {
  body: {
    s1: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-1_new.png',
    s2: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-2_new.png',
    s3: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-3_new.png',
    s4: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-4_new.png',
    s5: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-5_new.png',
  },
  parts: {
    bottom: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-bottom.png',
    center: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-center.png',
    front: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-front.png',
    top: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-top.png',
  }
}

// 定义连击阶段类型 (1-5)
type ComboStage = 1 | 2 | 3 | 4 | 5;

export default function Index() {
  const [merit, setMerit] = useState(0)
  const [isAnimate, setIsAnimate] = useState(false)
  const [meritPoolMax, setMeritPoolMax] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [showSettingModal, setShowSettingModal] = useState(false)
  // const [showMuyuConfigModal, setShowMuyuConfigModal] = useState(false)
  // const [muyuConfig, setMuyuConfig] = useState<MuyuConfigData>(DEFAULT_MUYU_CONFIG)
  const muyuConfig = DEFAULT_MUYU_CONFIG
  const lastTapTime = useRef<number>(0)
  const comboCount = useRef<number>(0) // 连击计数器
  const pendingMerit = useRef<number>(0) // 待同步的功德
  const syncTimer = useRef<any>(null) // 同步定时器
  const [stage, setStage] = useState<ComboStage>(1) // 默认为阶段 1
  const [userInfo, setUserInfo] = useState<any>(null)
  const [_setting, setSetting] = useState<SettingData>({ sound: true, vibration: true })
  const settingRef = useRef<SettingData>({ sound: true, vibration: true })
  const [immersiveHidden, setImmersiveHidden] = useState(false) // 沉浸模式是否隐藏UI
  const [allCollected, setAllCollected] = useState(false) // 是否已集齐所有佛理图鉴
  const [allWishesCollected, setAllWishesCollected] = useState(false) // 是否已集齐所有心愿
  const [shareCardInfo, setShareCardInfo] = useState<any>(null) // 当前分享的卡片信息
  const [showShareUnlockModal, setShowShareUnlockModal] = useState(false) // 分享解锁结果弹窗（已拥有时显示）
  const [shareUnlockCardTitle, setShareUnlockCardTitle] = useState<string | undefined>(undefined)
  const [showShareCardModal, setShowShareCardModal] = useState(false) // 分享卡片翻牌弹窗（未拥有时显示）
  const [pendingShareCard, setPendingShareCard] = useState<any>(null) // 待翻牌的分享卡片
  const [showSharedWishModal, setShowSharedWishModal] = useState(false) // 分享心愿弹窗
  const [sharedWishInfo, setSharedWishInfo] = useState<any>(null) // 分享心愿信息
  const tapCount = useRef<number>(0) // 累计敲击次数（沉浸模式用）
  const immersiveTimer = useRef<any>(null) // 沉浸模式恢复定时器
  const comboResetTimer = useRef<any>(null) // 连击重置定时器
  const animateTimer = useRef<any>(null) // 缩放动画定时器
  const isAnimateRef = useRef(false) // 缩放动画状态 ref，避免闭包陈旧
  const stageRef = useRef<ComboStage>(1) // 用 ref 跟踪阶段，避免不必要的 re-render
  
  // 粒子效果相关
  const particleRef = useRef<ParticleCanvasRef>(null)
  const poolTarget = useRef({ x: 200, y: 100 }) // 功德池目标位置
  const muyuPos = useRef({ x: 200, y: 400 }) // 木鱼位置

  // 音效池
  const audioPool = useRef<Taro.InnerAudioContext[]>([])
  const audioIndex = useRef<number>(0)

  // 预加载音效（页面加载时立即初始化）
  useEffect(() => {
    // 预加载敲击音效
    const TAP_SOUND_URL = '/assets/audio/tap.m4a'
    // 池子大小 6，确保连点时不会轮转到还在播放的 context
    const POOL_SIZE = 6
    for (let i = 0; i < POOL_SIZE; i++) {
      const ctx = Taro.createInnerAudioContext()
      ctx.src = TAP_SOUND_URL
      audioPool.current.push(ctx)
    }
    
    // 预加载按钮点击音效
    preloadClickSound()
    
    // 组件卸载时清理音频
    return () => {
      audioPool.current.forEach(ctx => ctx.destroy())
    }
  }, [])

  // 播放敲击音效
  const playTapSound = () => {
    if (!settingRef.current.sound) return
    
    const pool = audioPool.current
    if (!pool.length) return
    
    // 纯轮转：不 stop 当前正在播的，直接用下一个 context
    // stop() + seek() 在真机上是异步的，会引入几十ms延迟
    // 池子有 5 个 context，足够覆盖连点间隔
    const idx = audioIndex.current % pool.length
    audioIndex.current = idx + 1
    pool[idx].play()
  }

  // 根据配置获取功德池容量
  const getPoolCapacity = (level: number, config: MuyuConfigData): number => {
    const capacities = config.pool_capacities
    if (level >= capacities.length) {
      return capacities[capacities.length - 1]
    }
    return capacities[level] ?? capacities[capacities.length - 1]
  }

  // 初始化
  const init = async () => {
    try {
      await ensureLogin()
      
      // 服务器配置（调试时打开）
      // let config = DEFAULT_MUYU_CONFIG
      // if (USE_SERVER_CONFIG) {
      //   try {
      //     config = await getMuyuConfig()
      //     setMuyuConfig(config)
      //   } catch (err) {
      //     console.error('获取木鱼配置失败，使用默认配置:', err)
      //   }
      // }
      
      const freshUser = await getUserInfo()
      setUserInfo(freshUser)
      setMeritPoolMax(getPoolCapacity(freshUser.pool_level, muyuConfig))
      setMerit(Number(freshUser.current_merit))
      
      Taro.setStorageSync('userInfo', freshUser)
      
      const settingInfo = await getSetting()
      setSetting(settingInfo)
      settingRef.current = settingInfo
      Taro.setStorageSync('setting', settingInfo)
      
      const galleryRes = await getUserGalleryList()
      setAllCollected(galleryRes.ownedNum === galleryRes.total)

      // 检查是否已集齐所有心愿
      const [wishCats, userWishes] = await Promise.all([getWishCategoriesAll(), getUserWishes()])
      const ownedContents = new Set((userWishes as any[]).map((w: any) => w.content))
      const totalWishItems = wishCats.reduce((sum: number, cat: any) => sum + (cat.items?.length || 0), 0)
      const remainingItems = wishCats.reduce((sum: number, cat: any) => 
        sum + (cat.items?.filter((item: any) => !ownedContents.has(item.content)).length || 0), 0)
      setAllWishesCollected(totalWishItems > 0 && remainingItems === 0)
    } catch (err) {
      console.error('初始化失败:', err)
    }
  }
  
  useDidShow(() => {
    init()
    setTimeout(() => {
      const query = Taro.createSelectorQuery()
      query.select('.merit-pool-container').boundingClientRect()
      query.select('.muyu-container').boundingClientRect()
      query.exec((res) => {
        if (res[0]) {
          poolTarget.current = {
            x: res[0].left + res[0].width / 2,
            y: res[0].top + res[0].height / 2
          }
        }
        if (res[1]) {
          // 主体图 375×345，取木鱼容器顶部作为文字起始基准点
          muyuPos.current = {
            x: res[1].left + res[1].width / 2,
            y: res[1].top
          }
        }
      })
    }, 500)
  })

  // 处理分享链接进入时的卡片展示
  useLoad((options: { cardId?: string; category_id?: string; wish_item_id?: string }) => {
    if (options.cardId) {
      const cardId = Number(options.cardId)
      if (cardId > 0) {
        setTimeout(async () => {
          try {
            const result: any = await checkShareCard(cardId)
            const { card, isOwned } = result || {}
            
            if (!card) {
              console.log('卡片不存在')
              return
            }
            
            if (isOwned) {
              setShareUnlockCardTitle(card.title)
              setShowShareUnlockModal(true)
            } else {
              setPendingShareCard(card)
              setShowShareCardModal(true)
            }
          } catch (err: any) {
            console.log('检查卡片失败:', err?.msg || err)
          }
        }, 500)
      }
    }

    // 处理分享心愿链接
    if (options.category_id && options.wish_item_id) {
      const categoryId = Number(options.category_id)
      const wishItemId = Number(options.wish_item_id)
      setTimeout(async () => {
        try {
          const cats = await getWishCategoriesAll()
          const cat = cats.find((c: any) => c.id === categoryId)
          const wishItem = cat?.items?.find((i: any) => i.id === wishItemId)
          if (wishItem) {
            setSharedWishInfo({ content: wishItem.content, category_id: categoryId })
            setShowSharedWishModal(true)
          }
        } catch (err: any) {
          console.log('获取分享心愿失败:', err?.msg || err)
        }
      }, 500)
    }
  })

  // 分享卡片给好友
  useShareAppMessage(() => {
    // 如果有当前抽到的卡片，分享时带上卡片ID
    if (shareCardInfo?.id) {
      return {
        title: '送你一张佛理卡片，试试提问吧',
        path: `/pages/index/index?cardId=${shareCardInfo.id}`,
        imageUrl: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/share-card.png'
      }
    }
    // 默认分享
    return {
      title: '攒功德去许愿，捐香火得图鉴',
      path: '/pages/index/index',
      imageUrl: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/share-main.png'
    }
  })

  // 功德同步逻辑 (防抖)
  const syncMeritToBackend = () => {
    if (pendingMerit.current <= 0) return;

    const increment = pendingMerit.current;
    pendingMerit.current = 0; 

    syncMerit(increment).then((res: any) => {
      console.log('功德同步成功', res);
    }).catch(err => {
      console.error('功德同步失败', err);
      pendingMerit.current += increment;
    });
  }

  // 祈愿
  const handleWish = () => {
    if (merit >= meritPoolMax) {
      setShowModal(true)
    } else {
      Taro.showToast({
        title: '功德不足，请继续积累',
        icon: 'none',
      })
      return
    }
  }

  // 捐香火
  const handleDonate = async () => {
    setShowModal(false)
    setShowDonateModal(true)
  }

  // 敲木鱼
  const handleTap = (e: any) => {
    // 防止多指同时触发：只响应单指触摸
    if (e.touches && e.touches.length > 1) return
    
    const now = Date.now()
    const interval = now - lastTapTime.current
    const s = settingRef.current
    
    const { combo_interval_min, combo_interval_max } = muyuConfig
    
    if (lastTapTime.current === 0) {
      comboCount.current = 1
      if (s.vibration) Taro.vibrateShort({ type: 'light' }).catch(() => {})
    } else if (interval >= combo_interval_min && interval <= combo_interval_max) {
      comboCount.current += 1
      if (s.vibration) Taro.vibrateShort({ type: 'medium' }).catch(() => {})
    } else {
      comboCount.current = 1
      if (s.vibration) Taro.vibrateShort({ type: 'light' }).catch(() => {})
    }
    lastTapTime.current = now

    // 超过连击窗口后自动重置阶段
    if (comboResetTimer.current) clearTimeout(comboResetTimer.current)
    comboResetTimer.current = setTimeout(() => {
      comboCount.current = 0
      lastTapTime.current = 0
      stageRef.current = 1
      setStage(1)
    }, combo_interval_max + 250)

    // --- 计算阶段和加分 ---
    const { 
      blue_combo, red_combo, orange_combo, purple_combo, 
      normal_merit, blue_merit, red_merit, orange_merit, purple_merit
    } = muyuConfig

    let meritAdd = normal_merit
    let currentStage: ComboStage = 1
    const c = comboCount.current
    
    if (c >= purple_combo) { currentStage = 5; meritAdd = purple_merit }
    else if (c >= orange_combo) { currentStage = 4; meritAdd = orange_merit }
    else if (c >= red_combo) { currentStage = 3; meritAdd = red_merit }
    else if (c >= blue_combo) { currentStage = 2; meritAdd = blue_merit }
    
    // 音效最优先
    playTapSound()
    
    // 只在阶段变化时触发 re-render
    if (currentStage !== stageRef.current) {
      stageRef.current = currentStage
      setStage(currentStage)
    }
    
    // 沉浸模式逻辑
    const { immersive_tap_count, immersive_timeout } = muyuConfig
    if (s.immersive_mode) {
      tapCount.current += 1
      if (tapCount.current >= immersive_tap_count) {
        setImmersiveHidden(true)
      }
      if (immersiveTimer.current) clearTimeout(immersiveTimer.current)
      immersiveTimer.current = setTimeout(() => {
        setImmersiveHidden(false)
        tapCount.current = 0
      }, immersive_timeout)
    }

    // 缩放动画：清除上一个定时器，避免快速连击时堆积
    if (animateTimer.current) clearTimeout(animateTimer.current)
    if (!isAnimateRef.current) {
      isAnimateRef.current = true
      setIsAnimate(true)
    }
    animateTimer.current = setTimeout(() => {
      isAnimateRef.current = false
      setIsAnimate(false)
    }, 100)

    // 立即更新功德
    setMerit(prev => prev + meritAdd)
    pendingMerit.current += meritAdd
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(syncMeritToBackend, 1000)
    
    // 粒子颜色映射
    const colors: Record<ComboStage, string> = {
      1: '#ffffff',
      2: '#83d9ff',
      3: '#80ffff',
      4: '#ffb04e',
      5: '#ff7c4b'
    }
    
    const withParticles = comboCount.current >= 2

    particleRef.current?.emit(
      muyuPos.current.x,
      muyuPos.current.y,
      poolTarget.current.x,
      poolTarget.current.y,
      `功德+${meritAdd}`,
      colors[currentStage],
      withParticles
    )
  }

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
      if (comboResetTimer.current) clearTimeout(comboResetTimer.current)
      if (animateTimer.current) clearTimeout(animateTimer.current)
      syncMeritToBackend()
    }
  }, [])

  return (
    <View className='index-page'>
      <View 
        className={`navbar ${immersiveHidden ? 'immersive-hidden' : ''}`}
      >
        <View className='navbar-item' onClick={() => { playClickSound(); setShowSettingModal(true) }}>
          <Image src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/set_new.png' style={{ width:'78rpx', height:'62rpx' }} />
        </View>
        <View className='navbar-item' onClick={() => { playClickSound(); setShowGalleryModal(true) }}>
          <Image src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/catlog_new.png' style={{ width:'72rpx', height:'62rpx' }} />
        </View>
        <View className='navbar-item' onClick={() => { playClickSound(); Taro.navigateTo({ url: '/pages/fulfill/index' }) }}>
          <Image src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/wish_new.png' style={{ width:'80rpx', height:'62rpx' }} />
        </View>
        <View className='navbar-item' onClick={() => { playClickSound(); Taro.navigateTo({ url: '/pages/beings/index' }) }}>
          <Image src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/live_new.png' style={{ width:'76rpx', height:'62rpx' }} />
        </View>
        {/* 配置按钮（调试时打开）
        <View className='navbar-item' onClick={() => { playClickSound(); setShowMuyuConfigModal(true) }}>
          配置
        </View>
        */}
      </View>

      <View 
        className='merit-pool-container'
        onClick={() => { playClickSound(); handleWish() }}
      >
        <View className='merit-pool' style={{ borderColor: merit >= meritPoolMax ? '#FDC74E' : '#454545' }}>
          <View className='merit-pool-current' style={{ width: `${merit >= meritPoolMax ? 100 : (merit / meritPoolMax) * 100}%` }} />
          { merit >= meritPoolMax && (
            <>
              <Text className={`merit-pool-title ${immersiveHidden ? 'immersive-hidden' : ''}`}>池已满，点击祈愿</Text>
            </>
          )
        }
        <Text className='merit-pool-container-text'> { merit } / { meritPoolMax } </Text>
        </View>
      </View>
      
      {/* 木鱼后方光晕 */}
      <View className={`muyu-glow ${stage >= 2 ? `stage-${stage}` : ''}`} />
      
      {/* 木鱼容器：动态添加 stage 类名 */}
      <View className={`muyu-container stage-${stage} ${isAnimate ? 'active' : ''}`} onTouchStart={handleTap}>
        {/* 底层：木鱼主体（预加载所有阶段，通过 opacity 切换，防止闪烁） */}
        {Object.keys(MUYU_IMGS.body).map((key, index) => {
          const imgStage = index + 1;
          // key 是 s1, s2... index 是 0, 1...
          // 我们需要判断当前 stage 是否匹配
          const isCurrent = stage === imgStage;
          return (
            <Image 
              key={key}
              src={MUYU_IMGS.body[key as keyof typeof MUYU_IMGS.body]} 
              className={`muyu-img layer-base ${isCurrent ? 'show' : ''}`} 
            />
          )
        })}
        
        {/* 发光部件层（预加载，通过 opacity 切换） */}
        <Image 
          src={MUYU_IMGS.parts.bottom} 
          className={`muyu-img layer-light light-bottom ${stage >= 2 ? 'show' : ''}`} 
        />
        <Image 
          src={MUYU_IMGS.parts.center} 
          className={`muyu-img layer-light light-center ${stage >= 3 ? 'show' : ''}`} 
        />
        <Image 
          src={MUYU_IMGS.parts.front} 
          className={`muyu-img layer-light light-front ${stage >= 4 ? 'show' : ''}`} 
        />
        <Image 
          src={MUYU_IMGS.parts.top} 
          className={`muyu-img layer-light light-top ${stage >= 5 ? 'show' : ''}`} 
        />
      </View>
      
      <ParticleCanvas ref={particleRef} />
      <WishModal show={showModal} onClose={() => setShowModal(false)} onDonate={handleDonate} meritCost={meritPoolMax} allCollected={allCollected} allWishesCollected={allWishesCollected} />
      <DonateModal 
        show={showDonateModal} 
        onClose={() => { setShowDonateModal(false); setShareCardInfo(null); }} 
        userInfo={userInfo} 
        onRefresh={init} 
        poolCapacities={DEFAULT_MUYU_CONFIG.pool_capacities}
        onCardChange={setShareCardInfo}
      />
      <GalleryModal 
        show={showGalleryModal} 
        onClose={() => setShowGalleryModal(false)} 
        onCardSelect={setShareCardInfo}
      />
      <SettingModal 
        show={showSettingModal} 
        onClose={() => setShowSettingModal(false)} 
        onSettingChange={(s) => { setSetting(s); settingRef.current = s }}
      />
      {/* 配置弹窗（调试时打开）
      {USE_SERVER_CONFIG && (
        <MuyuConfigModal
          show={showMuyuConfigModal}
          onClose={() => setShowMuyuConfigModal(false)}
          onConfigChange={(newConfig) => {
            setMuyuConfig(newConfig)
            if (userInfo) {
              setMeritPoolMax(getPoolCapacity(userInfo.pool_level, newConfig))
            }
          }}
        />
      )}
      */}
      <ShareUnlockModal
        show={showShareUnlockModal}
        onClose={() => setShowShareUnlockModal(false)}
        cardTitle={shareUnlockCardTitle}
      />
      <ShareCardModal
        show={showShareCardModal}
        onClose={() => {
          setShowShareCardModal(false)
          setPendingShareCard(null)
        }}
        cardInfo={pendingShareCard}
        onUnlockSuccess={init}
      />
      {/* 分享心愿弹窗 */}
      {showSharedWishModal && sharedWishInfo && (
        <View className='shared-wish-modal' onClick={() => setShowSharedWishModal(false)}>
          <View className='shared-wish-detail' onClick={(e) => e.stopPropagation()}>
            <View className='shared-wish-card'>
              <Image 
                className='shared-wish-card-bg' 
                src={`https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wish_card_${sharedWishInfo.category_id || 1}.png`} 
                mode='aspectFit'
              />
              <View className='shared-wish-card-content'>
                <Text className='shared-wish-card-text'>{sharedWishInfo.content}</Text>
              </View>
            </View>
            <View className='shared-wish-btn' style={{ background: WISH_CATEGORY_GRADIENTS[sharedWishInfo.category_id] || 'radial-gradient(50% 50% at 50% 50%, #DABD83 0%, #C68F42 100%)' }} onClick={async () => {
              playClickSound()
              try {
                const userWishes = await getUserWishes()
                const alreadyOwned = (userWishes as any[]).some((w: any) => w.content === sharedWishInfo.content)
                if (alreadyOwned) {
                  Taro.showToast({ title: '你已拥有这个心愿', icon: 'none' })
                } else {
                  await createWish({ content: sharedWishInfo.content, merit_cost: 0 })
                  Taro.showToast({ title: '收下心愿成功', icon: 'none' })
                }
                setShowSharedWishModal(false)
              } catch (err) {
                console.error('接收心愿失败:', err)
              }
            }}>
              <Text>收下好友祝福</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
