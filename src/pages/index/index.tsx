import { useState, useRef, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'
import fishPng from '../../imgs/fish.png'
import { syncMerit, SettingData, getUserInfo, getSetting, getUserGalleryList } from '../../apis'
import { ensureLogin } from '../../utils/auth'
import WishModal from '../../components/WishModal' // 引入弹窗
import DonateModal from '../../components/DonateModal'
import { getPoolCapacity } from '../../config/poolMap'
import GalleryModal from '../../components/GalleryModal'
import SettingModal from '../../components/SettingModal'
import ParticleCanvas, { ParticleCanvasRef } from '../../components/ParticleCanvas'

import normalSound from '../../audios/normal.mp3'
import blueSound from '../../audios/blue.mp3'
import redSound from '../../audios/red.mp3'
import orangeSound from '../../audios/orange.mp3'
// 定义连击阶段类型
type ComboStage = 'normal' | 'blue' | 'red' | 'orange';

export default function Index() {
  const [merit, setMerit] = useState(0)
  const [isAnimate, setIsAnimate] = useState(false)
  const [meritPoolMax, setMeritPoolMax] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [showSettingModal, setShowSettingModal] = useState(false)
  const lastTapTime = useRef<number>(0)
  const comboCount = useRef<number>(0) // 连击计数器
  const pendingMerit = useRef<number>(0) // 待同步的功德
  const syncTimer = useRef<any>(null) // 同步定时器
  const [stage, setStage] = useState<ComboStage>('normal')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [setting, setSetting] = useState<SettingData>({ sound: true, vibration: true })
  const [allCollected, setAllCollected] = useState(false) // 是否已集齐所有佛理图鉴
  
  // 粒子效果相关
  const particleRef = useRef<ParticleCanvasRef>(null)
  const poolTarget = useRef({ x: 200, y: 100 }) // 功德池目标位置
  const muyuPos = useRef({ x: 200, y: 400 }) // 木鱼位置

  // 不同连击阶段的音效
  const audioContexts = useRef<Record<ComboStage, Taro.InnerAudioContext | null>>({
    normal: null,
    blue: null,
    red: null,
    orange: null
  })

  // 音效资源配置
  const SOUND_URLS: Record<ComboStage, string> = {
    normal: normalSound,  // 基础木鱼声
    blue: blueSound,    // 清脆铃声
    red: redSound,     // 深沉钟声
    orange: orangeSound   // 悠扬禅钟
  }

  // 初始化音频
  useEffect(() => {
    // 创建4个音频实例
    const stageList: ComboStage[] = ['normal', 'blue', 'red', 'orange']
    const ctxMap = audioContexts.current
    
    stageList.forEach(s => {
      const ctx = Taro.createInnerAudioContext()
      ctx.src = SOUND_URLS[s]
      ctxMap[s] = ctx
    })
    
    return () => {
      stageList.forEach(s => {
        ctxMap[s]?.destroy()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 播放敲击音效（根据当前阶段）
  const playTapSound = (currentStage: ComboStage) => {
    if (!setting.sound) return
    const ctx = audioContexts.current[currentStage]
    if (!ctx) return
    ctx.stop()
    ctx.seek(0)
    ctx.play()
  }

  // 初始化
  const init = async () => {
    try {
      // 1. 先确保登录（获取 token）
      await ensureLogin()
      
      // 2. 每次都从服务器获取最新用户数据
      const freshUser = await getUserInfo()
      setUserInfo(freshUser)
      setMeritPoolMax(getPoolCapacity(freshUser.pool_level))
      setMerit(Number(freshUser.current_merit))
      
      // 更新缓存
      Taro.setStorageSync('userInfo', freshUser)
      
      // 3. 获取最新设置
      const settingInfo = await getSetting()
      setSetting(settingInfo)
      
      // 4. 检查是否已集齐所有佛理图鉴
      const galleryRes = await getUserGalleryList()
      setAllCollected(galleryRes.ownedNum === galleryRes.total)
    } catch (err) {
      console.error('初始化失败:', err)
    }
  }
  
  useDidShow(() => {
    init()
    // 获取功德池和木鱼的位置
    setTimeout(() => {
      const query = Taro.createSelectorQuery()
      query.select('.merit-pool-container').boundingClientRect()
      query.select('.muyu-container').boundingClientRect()
      query.exec((res) => {
        if (res[0]) {
          // 功德池中心位置
          poolTarget.current = {
            x: res[0].left + res[0].width / 2,
            y: res[0].top + res[0].height / 2
          }
        }
        if (res[1]) {
          // 木鱼中心位置
          muyuPos.current = {
            x: res[1].left + res[1].width / 2,
            y: res[1].top + res[1].height / 3 // 偏上一点
          }
        }
      })
    }, 500)
  })

  // 功德同步逻辑 (防抖)
  const syncMeritToBackend = () => {
    if (pendingMerit.current <= 0) return;

    const increment = pendingMerit.current;
    pendingMerit.current = 0; // 立即清零，防止重复同步

    // 发送请求（token 会自动从 header 带上）
    syncMerit(increment).then((res: any) => {
      console.log('功德同步成功', res);
    }).catch(err => {
      console.error('功德同步失败', err);
      // 失败了把功德加回去，下次再试
      pendingMerit.current += increment;
    });
  }

  // 祈愿
  const handleWish = () => {
    console.log('祈愿')
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
    console.log('捐香火')
    setShowModal(false)
    setShowDonateModal(true)
  }

  // 敲木鱼
  const handleTap = () => {
    const now = Date.now();
    const interval = now - lastTapTime.current;
    
    // --- 连击逻辑 ---
    // 第一次点击，视为连击开始
    if (lastTapTime.current === 0) {
      comboCount.current = 1;
      if (setting.vibration) Taro.vibrateShort({ type: 'light' });
    } else {
      if (interval >= 750 && interval <= 1500) {
        // 命中节奏 -> 连击 +1
        comboCount.current += 1;
        if (setting.vibration) Taro.vibrateShort({ type: 'medium' });
      } else {
        // 节奏中断 -> 重置为 1
        comboCount.current = 1;
        setStage('normal');
        if (setting.vibration) Taro.vibrateShort({ type: 'light' });
      }
    }
    lastTapTime.current = now;

    // --- 计算阶段颜色和加分 ---
    let meritAdd = 1; // 默认 +1
    let currentStage: ComboStage = 'normal';
    const c = comboCount.current;
    
    if (c >= 15) {
      currentStage = 'orange';
      meritAdd = 4;
    } else if (c >= 10) {
      currentStage = 'red';
      meritAdd = 3;
    } else if (c >= 5) {
      currentStage = 'blue';
      meritAdd = 2;
    }
    
    setStage(currentStage);
    
    // 播放对应阶段的音效
    playTapSound(currentStage)

    // 动画
    setIsAnimate(true)
    setTimeout(() => setIsAnimate(false), 100)

    // 发射粒子效果，粒子到达后再更新进度
    const colors: Record<ComboStage, string> = {
      normal: '#ffffff',
      blue: '#4fc3f7',
      red: '#ff5252',
      orange: '#ffb74d'
    }
    
    // 保存当前要加的值（闭包）
    const addValue = meritAdd
    
    particleRef.current?.emit(
      muyuPos.current.x,
      muyuPos.current.y,
      poolTarget.current.x,
      poolTarget.current.y,
      `功德+${meritAdd}`,
      colors[currentStage],
      // 粒子到达后的回调：更新进度
      () => {
        setMerit(prev => prev + addValue)
        pendingMerit.current += addValue
        
        // 重置/启动防抖定时器
        if (syncTimer.current) clearTimeout(syncTimer.current)
        syncTimer.current = setTimeout(syncMeritToBackend, 1000)
      }
    )
  }

  // 页面卸载时强制同步一次
  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncMeritToBackend();
    }
  }, [])

  return (
    <View className='index-page'>
      <View className='navbar'>
        <View className='navbar-item' onClick={() => setShowSettingModal(true)}>设置</View>
        <View className='navbar-item' onClick={() => Taro.navigateTo({ url: '/pages/fulfill/index' })}>还愿</View>
        <View className='navbar-item' onClick={() => Taro.navigateTo({ url: '/pages/beings/index' })}>众生</View>
        <View className='navbar-item' onClick={() => setShowGalleryModal(true)}>佛理图鉴</View>
      </View>

      <View className='merit-pool-container' onClick={handleWish}>
        <Text className='merit-pool-title'>
          { merit >= meritPoolMax ? '功德池已满，可祈愿' : '功德池' }</Text>
        <View className='merit-pool'>
          <View className='merit-pool-current' style={{ width: `${merit >= meritPoolMax ? 100 : (merit / meritPoolMax) * 100}%` }} />
          <Text> { merit } / { meritPoolMax } </Text>
        </View>
      </View>
      <View className={`muyu-container ${stage}`} onClick={handleTap}>
        <Image src={fishPng} className={`muyu-img ${isAnimate ? 'active' : ''}`} />
      </View>
      
      {/* Canvas 粒子效果层 */}
      <ParticleCanvas ref={particleRef} />
      <WishModal show={showModal} onClose={() => setShowModal(false)} onDonate={handleDonate} meritCost={meritPoolMax} allCollected={allCollected} />
      <DonateModal show={showDonateModal} onClose={() => setShowDonateModal(false)} userInfo={userInfo} onRefresh={init} />
      <GalleryModal show={showGalleryModal} onClose={() => setShowGalleryModal(false)} />
      <SettingModal 
        show={showSettingModal} 
        onClose={() => setShowSettingModal(false)} 
        onSettingChange={setSetting}
      />
    </View>
  )
}
