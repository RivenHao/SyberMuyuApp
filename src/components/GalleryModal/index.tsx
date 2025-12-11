import { useState } from "react";
import { View } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
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
    const init = async() => {
        const res = await getUserGalleryList(Number(Taro.getStorageSync('token')))
        setGalleryList(res.list)
        setTotal(res.total)
        setOwnedNum(res.ownedNum)
    }
    useLoad(()=>{
        console.log('GalleryModal loaded.')
        init()
    })
    if (!show) return null;
    const handleItemClick = (item: any) => {
        console.log(item)
    }
    return (
    <View className='gallery-modal' onClick={onClose}>
        <View className='gallery-modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='gallery-modal-title'>佛理图鉴</View>
            <View className='gallery-modal-total'>已收集：{ownedNum}/{total}</View>
            <View className='gallery-modal-list'>
                {galleryList.map((item) => (
                    <View key={item.id} onClick={() => handleItemClick(item)}>
                        {/* {item.title && <View>{item.title}</View>}
                        {item.description && <View>{item.description}</View>}
                        {item.explanation && <View>{item.explanation}</View>} */}
                        {item.is_owned ? <View className='gallery-modal-item owned' /> : <View className='gallery-modal-item unowned' />}
                    </View>
                ))}
            </View>
        </View>
    </View>
    )
}