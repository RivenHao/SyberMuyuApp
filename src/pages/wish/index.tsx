import { useState, useEffect, useRef } from "react";
import Taro, { useLoad, useShareAppMessage } from "@tarojs/taro";
import { View, Image, Text, Button } from "@tarojs/components";
import './index.scss';
import { getWishCategoriesAll, createWish, decreaseMerit, increasePoolLevel, getUserInfo, getMuyuConfig, getUserWishes } from "../../apis";
import { isMaxPoolLevel } from "../../config/poolMap";
import { playClickSound } from "../../utils/clickSound";

interface WishItem {
  id: number
  content: string
}

interface WishCategory {
  id: number
  name: string
  icon: string
  items: WishItem[]
}

const randomPick = (arr: WishItem[]): WishItem | null => {
  if (!arr || arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

// 动画阶段：selecting=大类选择, dropping=卡片掉落中, detail=心愿详情
type AnimPhase = 'selecting' | 'dropping' | 'detail'

export default function Wish() {
  const [meritCost, setMeritCost] = useState(0)
  const [categories, setCategories] = useState<WishCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<WishCategory | null>(null)
  const [currentWish, setCurrentWish] = useState<WishItem | null>(null)
  const [shuffleUsed, setShuffleUsed] = useState(false)
  const [createdWishId, setCreatedWishId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [animPhase, setAnimPhase] = useState<AnimPhase>('selecting')
  const [tappedIdx, setTappedIdx] = useState<number>(-1)
  const [detailReady, setDetailReady] = useState(false)
  const animTimerRef = useRef<any>(null)

  useLoad((options: { merit_cost?: string }) => {
    if (options.merit_cost) setMeritCost(Number(options.merit_cost))
  })

  useShareAppMessage(() => {
    if (createdWishId && currentWish) {
      return {
        title: `我许下了一个心愿：${currentWish.content}`,
        path: `/pages/index/index?wish_id=${createdWishId}`,
      }
    }
    return { title: '来许个愿吧', path: '/pages/index/index' }
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, wishes] = await Promise.all([getWishCategoriesAll(), getUserWishes()])
        // 收集用户已有的心愿内容
        const ownedContents = new Set((wishes as any[]).map((w: any) => w.content))
        // 过滤掉已有的心愿
        const filtered = cats.map((cat: WishCategory) => ({
          ...cat,
          items: cat.items.filter((item: WishItem) => !ownedContents.has(item.content))
        }))
        setCategories(filtered)
      } catch (err) {
        console.error('获取数据失败:', err)
      }
    }
    fetchData()
  }, [])

  // 选择大类：触发掉落动画，然后扣功德
  const handleSelectCategory = async (cat: WishCategory, idx: number) => {
    playClickSound()
    const wish = randomPick(cat.items)
    if (!wish) return

    // 阶段1：被点击的卡片掉落，其他卡片淡出
    setTappedIdx(idx)
    setAnimPhase('dropping')
    setCurrentWish(wish)
    setSelectedCategory(cat)

    // 阶段2：掉落动画结束后，切到详情页，心愿卡从上方掉入
    animTimerRef.current = setTimeout(() => {
      setAnimPhase('detail')
      // 延迟一帧再触发入场动画，确保DOM已渲染
      setTimeout(() => setDetailReady(true), 50)
    }, 900)

    try {
      await decreaseMerit(meritCost)
      try {
        const [userInfo, config] = await Promise.all([getUserInfo(), getMuyuConfig()])
        if (!isMaxPoolLevel(userInfo.pool_level ?? 0, config.pool_capacities)) {
          await increasePoolLevel()
        }
      } catch (err) {
        console.error('扩容检查失败:', err)
      }
    } catch (err) {
      console.error('扣除功德失败:', err)
      Taro.showToast({ title: '功德不足', icon: 'none' })
      // 回退动画
      clearTimeout(animTimerRef.current)
      setAnimPhase('selecting')
      setTappedIdx(-1)
      setSelectedCategory(null)
      setCurrentWish(null)
      setDetailReady(false)
    }
  }

  // 换一换（只能用一次）
  const handleShuffle = () => {
    if (!selectedCategory || shuffleUsed) return
    playClickSound()
    const others = selectedCategory.items.filter(i => i.id !== currentWish?.id)
    const pool = others.length > 0 ? others : selectedCategory.items
    setCurrentWish(randomPick(pool))
    setShuffleUsed(true)
  }

  // 收下心愿：创建心愿到还愿池，然后返回首页
  const handleConfirm = async () => {
    if (submitting || !currentWish) return
    setSubmitting(true)
    playClickSound()
    try {
      const res: any = await createWish({ content: currentWish.content, merit_cost: meritCost })
      setCreatedWishId(res.id)
      Taro.showToast({ 
        title: '心愿已收下', 
        icon: 'success',
        duration: 1200,
        complete: () => {
          setTimeout(() => Taro.navigateBack(), 300)
        }
      })
    } catch (err) {
      console.error('创建心愿失败:', err)
      setSubmitting(false)
    }
  }

  return (
    <View className='index-page'>
      <Image className='wish-bg-circle' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wish-bg-circle.png' />
      
      {/* 返回按钮：选完大类后隐藏 */}
      {animPhase === 'selecting' && (
        <View className='wish-title' onClick={() => { playClickSound(); Taro.navigateBack() }}>
          <Image className='wish-title-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/back.png' />
          <Text className='wish-title-text'>返回</Text>
        </View>
      )}

      {/* 大类选择 */}
      {(animPhase === 'selecting' || animPhase === 'dropping') && (
        <View className={`wish-category-list ${animPhase === 'dropping' ? 'wish-category-list--exiting' : ''}`}>
          <Text className={`wish-category-title ${animPhase === 'dropping' ? 'wish-title--fadeout' : ''}`}>取下一个心愿吧</Text>
          <View className='wish-category-grid'>
            {categories.map((cat, idx) => (
              <View 
                key={cat.id} 
                className={`wish-category-item wish-category-item-${idx} ${
                  animPhase === 'dropping' 
                    ? (idx === tappedIdx ? 'wish-card--drop' : 'wish-card--fadeout') 
                    : ''
                }`} 
                onClick={() => animPhase === 'selecting' && handleSelectCategory(cat, idx)}
              >
                <Image 
                  className='wish-category-item-bg' 
                  src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wishContentCard.png' 
                  mode='aspectFit'
                />
                <View className='wish-category-item-content'>
                  <Text className='wish-category-name'>{cat.name}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 心愿展示：从上方掉入 */}
      {animPhase === 'detail' && currentWish && (
        <View className='wish-detail'>
          <View className={`wish-card ${detailReady ? 'wish-card--enter' : 'wish-card--before-enter'}`}>
            <Image 
              className='wish-card-bg' 
              src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wishContentCard.png' 
              mode='aspectFit'
            />
            <View className='wish-card-content'>
              <Text className='wish-text'>{currentWish.content}</Text>
            </View>
          </View>
          {/* 换一个：用过后消失 */}
          {!shuffleUsed && (
            <View className={`wish-shuffle-btn ${detailReady ? 'wish-btn--fadein' : ''}`} onClick={handleShuffle}>🔄 换一个</View>
          )}
          {/* 底部按钮 */}
          <View className={`wish-bottom-actions ${detailReady ? 'wish-btn--fadein' : ''}`}>
            <Button className='wish-action-btn' openType='share' onClick={() => playClickSound()}>
              送给好友
            </Button>
            <View className='wish-action-btn' onClick={handleConfirm}>
              {submitting ? '收下中...' : '收下愿望'}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
