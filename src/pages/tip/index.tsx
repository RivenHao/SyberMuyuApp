import Taro from "@tarojs/taro";
import { playClickSound } from "../../utils/clickSound";
import { View, Text, Image } from "@tarojs/components";
import './index.scss';

export default function Index() {
    return (
        <View className='index-page'>
            <Image className='tip-bg-circle' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/wish/tip-bg.png' />
            <View className='tip-content'>
                <Text className='tip-content-text'>种愿，行善，方得果。</Text>
            </View>
            <View className='tip-button' onClick={() => { playClickSound(); Taro.navigateTo({ url: '/pages/index/index' }) }}>
                我已铭记
            </View>
        </View>
    )
}