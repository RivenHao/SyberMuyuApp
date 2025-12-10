import { View } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import './index.scss'

export default function GalleryModal() {
    useLoad(()=>{
        console.log('GalleryModal loaded.')
    })
    return (
    <View className='gallery-modal'>
        <View className='gallery-modal-content'>
            <View className='gallery-modal-title'>佛理图鉴</View>
        </View>
    </View>
    )
}