import { useState, useRef, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss'
import fishPng from '../../imgs/fish.png'
import { syncMerit, getUserInfo } from '../../apis' // 引入 post
import WishModal from '../../components/WishModal' // 引入弹窗
import DonateModal from '../../components/DonateModal'
import { poolMap } from '../../config/poolMap'
import GalleryModal from '../../components/GalleryModal'
// 定义连击阶段类型
type ComboStage = 'normal' | 'blue' | 'red' | 'orange';

interface PopupItem {
  id: number;
  combo: number;
  meritAdd: number; // 新增：单次加分数值
}

export default function Index() {
  const [merit, setMerit] = useState(0)
  const [isAnimate, setIsAnimate] = useState(false)
  const [popups, setPopups] = useState<PopupItem[]>([]) 
  const [meritPoolMax, setMeritPoolMax] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const lastTapTime = useRef<number>(0)
  const comboCount = useRef<number>(0) // 连击计数器
  const pendingMerit = useRef<number>(0) // 待同步的功德
  const syncTimer = useRef<any>(null) // 同步定时器
  const [stage, setStage] = useState<ComboStage>('normal')
  const [userInfo, setUserInfo] = useState<any>(null)

  const init = async () => {
    const res = await getUserInfo()
    setUserInfo(res)
    const { pool_level, current_merit } = res
    setMeritPoolMax(poolMap[pool_level])
    setMerit(Number(current_merit)) // 确保是数字
  }
  
  useDidShow(() => {
    console.log('Page shown.')
    init()
  })

  // 功德同步逻辑 (防抖)
  const syncMeritToBackend = () => {
    if (pendingMerit.current <= 0) return;

    const increment = pendingMerit.current;
    pendingMerit.current = 0; // 立即清零，防止重复同步

    // 发送请求
    syncMerit(increment).then((res: any) => {
      console.log('功德同步成功', res);
      // 可以选择是否用后端返回的 merit 覆盖本地，为了体验流畅通常不覆盖，除非误差太大
    }).catch(err => {
      console.error('功德同步失败', err);
      // 失败了把功德加回去，下次再试
      pendingMerit.current += increment;
    });
  }

  const handleWish = () => {
    console.log('祈愿')
    setShowModal(true)
  }

  const handleDonate = async () => {
    console.log('捐香火')
    setShowModal(false)
    setShowDonateModal(true)
  }

  const handleTap = () => {
    const now = Date.now();
    const interval = now - lastTapTime.current;
    
    // --- 连击逻辑 ---
    // 第一次点击，视为连击开始
    if (lastTapTime.current === 0) {
      comboCount.current = 1;
      Taro.vibrateShort({ type: 'light' });
    } else {
      if (interval >= 750 && interval <= 1500) {
        // 命中节奏 -> 连击 +1
        comboCount.current += 1;
        Taro.vibrateShort({ type: 'medium' });
      } else {
        // 节奏中断 -> 重置为 1
        comboCount.current = 1;
        setStage('normal');
        Taro.vibrateShort({ type: 'light' });
      }
    }
    lastTapTime.current = now;

    // --- 计算阶段颜色和加分 ---
    let meritAdd = 1; // 默认 +1
    const c = comboCount.current;
    
    if (c >= 15) {
      setStage('orange');
      meritAdd = 4;
    } else if (c >= 10) {
      setStage('red');
      meritAdd = 3;
    } else if (c >= 5) {
      setStage('blue');
      meritAdd = 2;
    }

    // 更新本地功德 (UI)
    setMerit(prev => prev + meritAdd)
    
    // 累加待同步功德
    pendingMerit.current += meritAdd;

    // 重置/启动防抖定时器 (2秒无操作自动同步)
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(syncMeritToBackend, 1000);

    // 动画
    setIsAnimate(true)
    setTimeout(() => setIsAnimate(false), 100)

    // 漂浮文字
    const id = Date.now()
    setPopups(prev => [...prev, { id, combo: c, meritAdd }])
    
    setTimeout(() => {
      setPopups(prev => prev.filter(item => item.id !== id)) // 删除漂浮文字
    }, 1000)
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
        <View className='navbar-item'>设置</View>
        <View className='navbar-item' onClick={() => Taro.navigateTo({ url: '/pages/wish/index' })}>还愿</View>
        <View className='navbar-item'>众生</View>
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
      
      {popups.map(item => (
        <Text 
          key={item.id} 
          className='merit-text animate'
        >
          {/* 显示具体的加分值和连击数 */}
          {/* {item.combo > 1 ? `功德+${item.meritAdd} x${item.combo}` : `功德+${item.meritAdd}`} */}
          功德+{item.meritAdd}
        </Text>
      ))}
      <WishModal show={showModal} onClose={() => setShowModal(false)} onDonate={handleDonate} meritCost={meritPoolMax} />
      <DonateModal show={showDonateModal} onClose={() => setShowDonateModal(false)} userInfo={userInfo} onRefresh={init} />
      <GalleryModal show={showGalleryModal} onClose={() => setShowGalleryModal(false)} />
    </View>
  )
}
