import { useState, useEffect, useMemo } from "react";
import { View, Text, Image, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import './index.scss'
import { getUserGalleryList } from "../../apis";
import { playClickSound } from '../../utils/clickSound'

interface GalleryModalProps {
  show: boolean
  onClose: () => void
  onCardSelect?: (cardInfo: any) => void // 选中卡片时通知父组件（用于分享）
}

// 卡片封面图片 URL（按品级）
const CARD_COVERS: Record<number | string, string> = {
  1: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/gallery/cardlevel1.png',
  2: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/gallery/cardlevel2.png',
  3: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/gallery/cardlevel3.png',
  locked: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/gallery/unknowncard.png'
}

const ITEMS_PER_PAGE = 9

export default function GalleryModal({ show, onClose, onCardSelect }: GalleryModalProps) {
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [ownedNum, setOwnedNum] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const init = async() => {
    const res = await getUserGalleryList()
    setGalleryList(res.list)
    setTotal(res.total)
    setOwnedNum(res.ownedNum)
  }

  useEffect(() => {
    if (show) {
      init()
      setCurrentPage(0)
    } else {
      setSelectedCard(null)
    }
  }, [show])

  // 计算总页数
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))
  }, [total])

  // 当前页的卡片
  const currentCards = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE
    return galleryList.slice(start, start + ITEMS_PER_PAGE)
  }, [galleryList, currentPage])

  if (!show) return null;

  // 切换页面
  const goToPage = (page: number) => {
    playClickSound()
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page)
    }
  }

  const handleItemClick = (item: any) => {
    if (item.is_owned) {
      playClickSound()
      setSelectedCard(item)
      onCardSelect?.(item) // 通知父组件当前选中的卡片
    } else {
      Taro.showToast({ title: '尚未解锁', icon: 'none' })
    }
  }

  const handleCloseDetail = () => {
    playClickSound()
    setSelectedCard(null)
    onCardSelect?.(null) // 清除选中状态
  }

  const handleClose = () => {
    playClickSound()
    onClose()
  }

  return (
    <View className='gallery-modal' onClick={handleClose}>
      <View className='gallery-modal-content' onClick={(e) => e.stopPropagation()}>
      {/* 收集进度 */}
      <View className='gallery-progress'>
        <Text className='gallery-progress-text'>已收集：{ownedNum}/{total}</Text>
      </View>

      {/* 卡片网格容器 */}
      <View className='gallery-grid-container'>
          {currentCards.map((item) => (
              <Image 
                key={item.id} 
                onClick={() => handleItemClick(item)}
                className='gallery-card-item'
                src={item.is_owned ? CARD_COVERS[item.rarity] : CARD_COVERS['locked']}
              />
          ))}
      </View>

      {/* 分页控制 */}
      <View className='gallery-pagination'>
        <View 
          className={`page-arrow prev ${currentPage === 0 ? 'disabled' : ''}`}
          onClick={() => goToPage(currentPage - 1)}
        />
        <Text className='page-num'>{currentPage + 1}/{totalPages}</Text>
        <View 
          className={`page-arrow next ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
          onClick={() => goToPage(currentPage + 1)}
        />
      </View>

      {/* 卡片详情弹窗 */}
      {selectedCard && (
        <View className='gallery-card-modal' onClick={handleCloseDetail}>
          <View className='gallery-card-wrapper' onClick={(e) => e.stopPropagation()}>
            {/* 卡片正面 */}
            <View className={`gallery-card-front rarity-${selectedCard.rarity}`}>
              {selectedCard.title && (
                <Text className='gallery-card-title'>{selectedCard.title}</Text>
              )}
              <View className='gallery-card-text'>
                {selectedCard.description && (
                  <Text className='gallery-card-content'>
                    {selectedCard.description.replace(/\\n/g, '\n')}
                  </Text>
                )}
                {selectedCard.explanation && (
                  <Text className='gallery-card-source'>
                    {selectedCard.rarity === 3 ? '心法真诠：' : '注解：'}
                    {selectedCard.explanation.replace(/\\n/g, '\n')}
                  </Text>
                )}
              </View>
            </View>
            {/* 按钮 */}
            <View className={`gallery-card-buttons rarity-${selectedCard.rarity}`}>
              <Button 
                className='gallery-card-btn share-btn' 
                openType='share'
                onClick={() => playClickSound()}
              >祝福好友</Button>
              <View className='gallery-card-btn' onClick={handleCloseDetail}>
                <Text className='gallery-card-btn-text'>关闭</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      </View>
    </View>
  )
}
