import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import './index.scss'
import { getUserGalleryList } from "../../apis";

interface GalleryModalProps {
    show: boolean
    onClose: () => void
}
export default function GalleryModal({ show, onClose }: GalleryModalProps) {
    const [galleryList, setGalleryList] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [ownedNum, setOwnedNum] = useState(0);
    const [selectedCard, setSelectedCard] = useState<any>(null); // 当前选中的卡片

    const init = async() => {
        // token 自动从 header 带上
        const res = await getUserGalleryList()
        setGalleryList(res.list)
        setTotal(res.total)
        setOwnedNum(res.ownedNum)
    }

    // 每次打开时刷新数据
    useEffect(() => {
        if (show) {
            init()
        } else {
            setSelectedCard(null) // 关闭时重置选中状态
        }
    }, [show])

    if (!show) return null;

    const handleItemClick = (item: any) => {
        // 只有已拥有的才能查看详情
        if (item.is_owned) {
            setSelectedCard(item)
        } else {
            Taro.showToast({ title: '尚未解锁', icon: 'none' })
        }
    }

    const handleCloseDetail = () => {
        setSelectedCard(null)
    }

    return (
    <View className='gallery-modal' onClick={onClose}>
        <View className='gallery-modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='gallery-modal-title'>佛理图鉴</View>
            <View className='gallery-modal-total'>已收集：{ownedNum}/{total}</View>
            <View className='gallery-modal-list'>
                {galleryList.map((item) => (
                    <View key={item.id} onClick={() => handleItemClick(item)}>
                        {item.is_owned ? <View className='gallery-modal-item owned' /> : <View className='gallery-modal-item unowned' />}
                    </View>
                ))}
            </View>
        </View>

        {/* 卡片详情弹层 */}
        {selectedCard && (
            <View className='card-detail-overlay' onClick={handleCloseDetail}>
                <View className='card-detail' onClick={(e) => e.stopPropagation()}>
                    <Text className='card-title'>{selectedCard.title}</Text>
                    <Text className='card-content'>{selectedCard.description}</Text>
                    <Text className='card-source'>—— {selectedCard.explanation}</Text>
                    <View className='card-close' onClick={handleCloseDetail}>关闭</View>
                </View>
            </View>
        )}
    </View>
    )
}