import { useState, useRef, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow, useShareAppMessage, useLoad } from '@tarojs/taro'
import './index.scss'
import { syncMerit, SettingData, getUserInfo, getSetting, getUserGalleryList, getMuyuConfig, MuyuConfigData, checkShareCard } from '../../apis'
import { ensureLogin } from '../../utils/auth'
import WishModal from '../../components/WishModal'
import DonateModal from '../../components/DonateModal'
import GalleryModal from '../../components/GalleryModal'
import SettingModal from '../../components/SettingModal'
import MuyuConfigModal from '../../components/MuyuConfigModal'
import ShareUnlockModal from '../../components/ShareUnlockModal'
import ShareCardModal from '../../components/ShareCardModal'
import ParticleCanvas, { ParticleCanvasRef } from '../../components/ParticleCanvas'
import { DEFAULT_MUYU_CONFIG, USE_SERVER_CONFIG } from '../../config/muyuConfig'
import { playClickSound } from '../../utils/clickSound'

// 图片资源配置 (OSS URL) - 请替换为实际的 OSS 地址
const MUYU_IMGS = {
  body: {
    s1: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-1.png',
    s2: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-2.png',
    s3: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-3.png',
    s4: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-4.png',
    s5: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/homePage/muyu-body-5.png',
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
  const [showMuyuConfigModal, setShowMuyuConfigModal] = useState(false)
  const [muyuConfig, setMuyuConfig] = useState<MuyuConfigData>(DEFAULT_MUYU_CONFIG)
  const lastTapTime = useRef<number>(0)
  const comboCount = useRef<number>(0) // 连击计数器
  const pendingMerit = useRef<number>(0) // 待同步的功德
  const syncTimer = useRef<any>(null) // 同步定时器
  const [stage, setStage] = useState<ComboStage>(1) // 默认为阶段 1
  const [userInfo, setUserInfo] = useState<any>(null)
  const [setting, setSetting] = useState<SettingData>({ sound: true, vibration: true })
  const [immersiveHidden, setImmersiveHidden] = useState(false) // 沉浸模式是否隐藏UI
  const [allCollected, setAllCollected] = useState(false) // 是否已集齐所有佛理图鉴
  const [shareCardInfo, setShareCardInfo] = useState<any>(null) // 当前分享的卡片信息
  const [showShareUnlockModal, setShowShareUnlockModal] = useState(false) // 分享解锁结果弹窗（已拥有时显示）
  const [shareUnlockResult, setShareUnlockResult] = useState<{ success: boolean; cardTitle?: string }>({ success: false })
  const [showShareCardModal, setShowShareCardModal] = useState(false) // 分享卡片翻牌弹窗（未拥有时显示）
  const [pendingShareCard, setPendingShareCard] = useState<any>(null) // 待翻牌的分享卡片
  const tapCount = useRef<number>(0) // 累计敲击次数（沉浸模式用）
  const immersiveTimer = useRef<any>(null) // 沉浸模式恢复定时器
  const comboResetTimer = useRef<any>(null) // 连击重置定时器
  
  // 粒子效果相关
  const particleRef = useRef<ParticleCanvasRef>(null)
  const poolTarget = useRef({ x: 200, y: 100 }) // 功德池目标位置
  const muyuPos = useRef({ x: 200, y: 400 }) // 木鱼位置

  // 不同连击阶段的音效上下文（小池子，允许连点时重叠播放）
  const audioContexts = useRef<Record<ComboStage, Taro.InnerAudioContext[]>>({
    1: [], 2: [], 3: [], 4: [], 5: []
  })
  const audioIndex = useRef<Record<ComboStage, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  })

  // 音效资源配置映射
  const SOUND_URLS: Record<ComboStage, string> = {
    1: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/audio/normal.mp3',
    2: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/audio/normal.mp3',
    3: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/audio/blue.mp3',
    4: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/audio/red.mp3',
    5: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/audio/orange.mp3'
  }

  // 初始化音频
  useEffect(() => {
    const POOL_SIZE = 8
    const stageList: ComboStage[] = [1, 2, 3, 4, 5]
    const ctxMap = audioContexts.current
    
    stageList.forEach(s => {
      const pool: Taro.InnerAudioContext[] = []
      for (let i = 0; i < POOL_SIZE; i++) {
        const ctx = Taro.createInnerAudioContext()
        ctx.src = SOUND_URLS[s]
        pool.push(ctx)
      }
      ctxMap[s] = pool
    })
    
    return () => {
      stageList.forEach(s => {
        ctxMap[s].forEach(ctx => ctx.destroy())
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 播放敲击音效（根据当前阶段）
  const playTapSound = (currentStage: ComboStage) => {
    if (!setting.sound) return
    const pool = audioContexts.current[currentStage]
    if (!pool.length) return
    const idx = audioIndex.current[currentStage] % pool.length
    audioIndex.current[currentStage] = idx + 1
    const ctx = pool[idx]
    // 直接播放，池子有8个实例，连击时轮流使用，无需 stop/seek
    ctx.play()
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
      
      let config = DEFAULT_MUYU_CONFIG
      if (USE_SERVER_CONFIG) {
        try {
          config = await getMuyuConfig()
          setMuyuConfig(config)
        } catch (err) {
          console.error('获取木鱼配置失败，使用默认配置:', err)
        }
      }
      
      const freshUser = await getUserInfo()
      setUserInfo(freshUser)
      setMeritPoolMax(getPoolCapacity(freshUser.pool_level, config))
      setMerit(Number(freshUser.current_merit))
      
      Taro.setStorageSync('userInfo', freshUser)
      
      const settingInfo = await getSetting()
      setSetting(settingInfo)
      Taro.setStorageSync('setting', settingInfo)
      
      const galleryRes = await getUserGalleryList()
      setAllCollected(galleryRes.ownedNum === galleryRes.total)
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
          // 主体图 375×812，发光层 375×345，取木鱼区域顶部作为基准点
          const woodTopRatio = 1 - (345 / 812)
          const woodTop = res[1].top + res[1].height * woodTopRatio
          muyuPos.current = {
            x: res[1].left + res[1].width / 2,
            y: woodTop
          }
        }
      })
    }, 500)
  })

  // 处理分享链接进入时的卡片展示
  useLoad((options: { cardId?: string }) => {
    if (options.cardId) {
      const cardId = Number(options.cardId)
      if (cardId > 0) {
        // 延迟执行，等待登录完成
        setTimeout(async () => {
          try {
            const result: any = await checkShareCard(cardId)
            const { card, isOwned } = result || {}
            
            if (!card) {
              console.log('卡片不存在')
              return
            }
            
            if (isOwned) {
              // 已拥有，显示提示弹窗
              setShareUnlockResult({ 
                success: false, 
                cardTitle: card.title 
              })
              setShowShareUnlockModal(true)
            } else {
              // 未拥有，显示翻牌弹窗
              setPendingShareCard(card)
              setShowShareCardModal(true)
            }
          } catch (err: any) {
            console.log('检查卡片失败:', err?.msg || err)
          }
        }, 500)
      }
    }
  })

  // 分享卡片给好友
  useShareAppMessage(() => {
    // 如果有当前抽到的卡片，分享时带上卡片ID
    if (shareCardInfo?.id) {
      return {
        title: '送你一张佛理卡片，试试提问吧',
        path: `/pages/index/index?cardId=${shareCardInfo.id}`,
        imageUrl: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/share/share-card.png'
      }
    }
    // 默认分享
    return {
      title: '答案已存在，你准备好提问了吗？',
      path: '/pages/index/index',
      imageUrl: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/share/share-card.png'
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
  const handleTap = () => {
    const now = Date.now();
    const interval = now - lastTapTime.current;
    
    const { combo_interval_min, combo_interval_max } = muyuConfig;
    
    if (lastTapTime.current === 0) {
      comboCount.current = 1;
      if (setting.vibration) Taro.vibrateShort({ type: 'light' });
    } else {
      if (interval >= combo_interval_min && interval <= combo_interval_max) {
        comboCount.current += 1;
        if (setting.vibration) Taro.vibrateShort({ type: 'medium' });
      } else {
        comboCount.current = 1;
        setStage(1); // 重置为阶段 1
        if (setting.vibration) Taro.vibrateShort({ type: 'light' });
      }
    }
    lastTapTime.current = now;

    // 超过连击窗口后自动重置阶段（不需要等第二次敲击）
    if (comboResetTimer.current) clearTimeout(comboResetTimer.current);
    comboResetTimer.current = setTimeout(() => {
      comboCount.current = 0;
      lastTapTime.current = 0;
      setStage(1);
    }, combo_interval_max + 250);

    // --- 计算阶段颜色和加分 ---
    const { 
      blue_combo, red_combo, orange_combo, purple_combo, 
      normal_merit, blue_merit, red_merit, orange_merit, purple_merit
    } = muyuConfig;

    let meritAdd = normal_merit;
    let currentStage: ComboStage = 1;
    const c = comboCount.current;
    
    if (c >= purple_combo) {
      currentStage = 5;
      meritAdd = purple_merit;
    } else if (c >= orange_combo) {
      currentStage = 4;
      meritAdd = orange_merit;
    } else if (c >= red_combo) {
      currentStage = 3;
      meritAdd = red_merit;
    } else if (c >= blue_combo) {
      currentStage = 2;
      meritAdd = blue_merit;
    } else {
      currentStage = 1;
      meritAdd = normal_merit;
    }
    
    // 音效优先播放，减少感知延迟
    playTapSound(currentStage)
    
    setStage(currentStage);
    
    // 沉浸模式逻辑
    const { immersive_tap_count, immersive_timeout } = muyuConfig;
    if (setting.immersive_mode) {
      tapCount.current += 1;
      if (tapCount.current >= immersive_tap_count) {
        setImmersiveHidden(true);
      }
      if (immersiveTimer.current) {
        clearTimeout(immersiveTimer.current);
      }
      immersiveTimer.current = setTimeout(() => {
        setImmersiveHidden(false);
        tapCount.current = 0;
      }, immersive_timeout);
    }

    setIsAnimate(true)
    setTimeout(() => setIsAnimate(false), 100)

    // 粒子颜色映射
    const colors: Record<ComboStage, string> = {
      1: '#ffffff',
      2: '#83d9ff', // 蓝青
      3: '#80ffff', // 黄绿
      4: '#ffb04e', // 橙黄
      5: '#ff7c4b'  // 红橙
    }
    
    const addValue = meritAdd
    
    // 只要是连击（comboCount >= 2），就显示粒子效果，和阶段无关
    const withParticles = comboCount.current >= 2

    particleRef.current?.emit(
      muyuPos.current.x,
      muyuPos.current.y,
      poolTarget.current.x,
      poolTarget.current.y,
      `功德+${meritAdd}`,
      colors[currentStage],
      withParticles,
      () => {
        setMerit(prev => prev + addValue)
        pendingMerit.current += addValue
        
        if (syncTimer.current) clearTimeout(syncTimer.current)
        syncTimer.current = setTimeout(syncMeritToBackend, 1000)
      }
    )
  }

  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      if (comboResetTimer.current) clearTimeout(comboResetTimer.current);
      syncMeritToBackend();
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
        <View className='navbar-item' onClick={() => { playClickSound(); setShowMuyuConfigModal(true) }}>
          配置
        </View>
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
      <WishModal show={showModal} onClose={() => setShowModal(false)} onDonate={handleDonate} meritCost={meritPoolMax} allCollected={allCollected} />
      <DonateModal 
        show={showDonateModal} 
        onClose={() => { setShowDonateModal(false); setShareCardInfo(null); }} 
        userInfo={userInfo} 
        onRefresh={init} 
        poolCapacities={muyuConfig.pool_capacities}
        onCardChange={setShareCardInfo}
      />
      <GalleryModal show={showGalleryModal} onClose={() => setShowGalleryModal(false)} />
      <SettingModal 
        show={showSettingModal} 
        onClose={() => setShowSettingModal(false)} 
        onSettingChange={setSetting}
      />
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
      <ShareUnlockModal
        show={showShareUnlockModal}
        onClose={() => setShowShareUnlockModal(false)}
        success={shareUnlockResult.success}
        cardTitle={shareUnlockResult.cardTitle}
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
    </View>
  )
}
