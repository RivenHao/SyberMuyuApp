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

// 许愿图片资源（大类封面 + 小类卡片）
const WISH_OSS = 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish'
const getCategoryCover = (id: number) => `${WISH_OSS}/wish_tree_new_${id}.png`
const getWishCardCover = (id: number) => `${WISH_OSS}/wish_card_${id}.png`
const getWishSwitchBtn = (id: number) => `${WISH_OSS}/wish_switch_${id}.png`
const getWishBgCircle = (id: number) => `${WISH_OSS}/wish_circle_${id}.png`
// 「换一个」文字颜色映射（按大类 id）
// 大类主题颜色映射（用于文字颜色、光晕等）
const CATEGORY_COLORS: Record<number, string> = {
  1: '#F8B69F',
  2: '#EBB4CF',
  3: '#FFE5C8',
  4: '#FFFAA6',
  5: '#CEF1E8',
  6: '#D7FFDF',
}

// 动画阶段：selecting=大类选择, confirmed=已选中待确认, dropping=卡片掉落中, detail=心愿详情
type AnimPhase = 'selecting' | 'confirmed' | 'dropping' | 'detail'

export default function Wish() {
  const [meritCost, setMeritCost] = useState(0)
  const [categories, setCategories] = useState<WishCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<WishCategory | null>(null) // TODO: 调试用，改回 null
  const [currentWish, setCurrentWish] = useState<WishItem | null>(null) // TODO: 调试用，改回 null
  const [shuffleUsed, setShuffleUsed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [animPhase, setAnimPhase] = useState<AnimPhase>('selecting') // TODO: 调试用，改回 'selecting'
  const [tappedIdx, setTappedIdx] = useState<number>(-1)
  const [detailReady, setDetailReady] = useState(false) // TODO: 调试用，改回 false
  const animTimerRef = useRef<any>(null)
  const [shuffleSpinning, setShuffleSpinning] = useState(false)
  const [textFading, setTextFading] = useState(false)

  useLoad((options: { merit_cost?: string }) => {
    if (options.merit_cost) setMeritCost(Number(options.merit_cost))
  })

  useShareAppMessage(() => {
    if (currentWish && selectedCategory) {
      return {
        title: '好友送你一份心愿祝福',
        path: `/pages/index/index?category_id=${selectedCategory.id}&wish_item_id=${currentWish.id}`,
        imageUrl: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wish_share.png'
      }
    }
    return { title: '来许个愿吧', path: '/pages/index/index', imageUrl: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wish_share.png' }
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

  // 选择大类：高亮选中，显示确认按钮
  const handleSelectCategory = (cat: WishCategory, idx: number) => {
    playClickSound()
    if (!cat.items || cat.items.length === 0) {
      Taro.showToast({ title: '已摘下所有心愿牌，试试其他类型', icon: 'none' })
      return
    }
    setSelectedCategory(cat)
    setTappedIdx(idx)
    setAnimPhase('confirmed')
  }

  // 确认取下心愿：触发掉落动画，扣功德
  const handleConfirmPick = async () => {
    if (!selectedCategory) return
    playClickSound()
    const wish = randomPick(selectedCategory.items)
    if (!wish) return

    setCurrentWish(wish)
    setAnimPhase('dropping')

    // 掉落动画结束后，切到详情页
    animTimerRef.current = setTimeout(() => {
      setAnimPhase('detail')
      setTimeout(() => setDetailReady(true), 100)
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
    setShuffleSpinning(true)
    setTextFading(true)
    const others = selectedCategory.items.filter(i => i.id !== currentWish?.id)
    const pool = others.length > 0 ? others : selectedCategory.items
    setTimeout(() => {
      setCurrentWish(randomPick(pool))
      setTextFading(false)
    }, 250)
    setShuffleUsed(true)
  }

  // 收下心愿：创建心愿到还愿池，然后返回首页
  const handleConfirm = async () => {
    if (submitting || !currentWish) return
    setSubmitting(true)
    playClickSound()
    try {
      await createWish({ content: currentWish.content, merit_cost: meritCost })
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
      <Image className='wish-bg-circle' src={selectedCategory ? getWishBgCircle(selectedCategory.id) : `${WISH_OSS}/wish-bg-circle.png`} />
      
      {/* 返回按钮：选完大类后隐藏 */}
      {(animPhase === 'selecting' || animPhase === 'confirmed') && (
        <View className='wish-title' onClick={() => { 
          playClickSound()
          Taro.navigateBack()
        }}>
          <Image className='wish-title-icon' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/back.png' />
          <Text className='wish-title-text'>返回</Text>
        </View>
      )}

      {/* 大类选择 */}
      {(animPhase === 'selecting' || animPhase === 'confirmed' || animPhase === 'dropping') && (
        <View className={`wish-category-list ${animPhase === 'dropping' ? 'wish-category-list--exiting' : ''}`}>
          <Text className={`wish-category-title ${animPhase === 'dropping' ? 'wish-title--fadeout' : ''}`}>取下一个心愿吧</Text>
          <View className='wish-category-grid'>
            <Image className={`wish-tree ${animPhase === 'dropping' ? 'wish-card--fadeout' : ''}`} src="https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wish_tree.png" />
            {categories.map((cat, idx) => {
              return (
                <View 
                  key={cat.id} 
                  className={`wish-category-item wish-category-item-${idx} ${
                    animPhase === 'dropping' 
                      ? (idx === tappedIdx ? 'wish-card--drop' : 'wish-card--fadeout') 
                      : ''
                  }`}
                  onClick={() => (animPhase === 'selecting' || animPhase === 'confirmed') && handleSelectCategory(cat, idx)}
                >
                  <Image 
                    className='wish-category-item-bg' 
                    src={getCategoryCover(cat.id)} 
                    mode='aspectFit'
                    style={{ opacity: animPhase === 'confirmed' && tappedIdx === idx ? 0 : 1 }}
                  />
                  <Image 
                    className='wish-category-item-bg wish-category-item-bg--selected' 
                    src={`${WISH_OSS}/wish_select_${cat.id}.png`} 
                    mode='aspectFit'
                    style={{ opacity: animPhase === 'confirmed' && tappedIdx === idx ? 1 : 0 }}
                  />
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* 心愿展示：从上方掉入 */}
      {animPhase === 'detail' && currentWish && (
        <View className='wish-detail'>
          <View className={`wish-card ${detailReady ? 'wish-card--enter' : 'wish-card--before-enter'}`}>
            <Image 
              className='wish-card-bg' 
              src={selectedCategory ? getWishCardCover(selectedCategory.id) : `${WISH_OSS}/wishContentCard.png`} 
              mode='aspectFit'
            />
            <View className='wish-card-content'>
              <Text className={`wish-text ${textFading ? 'wish-text--fading' : ''}`}>{currentWish.content}</Text>
            </View>
          </View>
          {/* 换一个：用过后置灰 */}
          {detailReady && (
            <View className={`wish-shuffle-btn wish-btn--fadein ${shuffleUsed ? 'disabled' : ''}`} onClick={handleShuffle}>
              <Image className={`wish-switch-btn ${shuffleSpinning ? 'spinning' : ''}`} src={selectedCategory ? getWishSwitchBtn(selectedCategory.id) : 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/wish_switch_1.png'}/>
              <Text className="wish-switch-text" style={{ color: selectedCategory ? (CATEGORY_COLORS[selectedCategory.id]) : '#000000' }}>换一个</Text>
            </View>
          )}
          {/* 底部按钮 */}
          {detailReady && (
            <View className='wish-bottom-actions wish-btn--fadein'>
              <Button className='wish-action-btn' openType='share' onClick={() => playClickSound()}>
                祝福好友
              </Button>
              <View className='wish-action-btn' onClick={handleConfirm}>
                {submitting ? '祈福...' : '收下心愿'}
              </View>
            </View>
          )}
        </View>
      )}
      {/* 确认取下按钮 */}
      {animPhase === 'confirmed' && (
        <View className='wish-confirm-pick' onClick={handleConfirmPick}>
          <Text className='wish-confirm-pick-text'>取下心愿</Text>
        </View>
      )}
    </View>
  )
}
