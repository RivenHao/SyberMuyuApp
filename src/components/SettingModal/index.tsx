import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getSetting, updateSetting, SettingData } from '../../apis'
import './index.scss'

interface SettingModalProps {
  show: boolean
  onClose: () => void
  onSettingChange?: (setting: SettingData) => void
}

export default function SettingModal({ show, onClose, onSettingChange }: SettingModalProps) {
  const [setting, setSetting] = useState<SettingData>({
    sound: true,
    vibration: true,
    immersive_mode: false,
    auto_click: false,
    bgm: false
  })
  const [loading, setLoading] = useState(false)

  // 打开时获取设置
  useEffect(() => {
    if (show) {
      fetchSetting()
    }
  }, [show])

  const fetchSetting = async () => {
    try {
      const res = await getSetting()
      setSetting(res)
    } catch (err) {
      console.error('获取设置失败', err)
    }
  }

  // 切换设置项
  const handleChange = async (key: keyof SettingData, value: boolean) => {
    if (loading) return
    
    setLoading(true)
    const newSetting = { ...setting, [key]: value }
    setSetting(newSetting) // 乐观更新
    onSettingChange?.(newSetting) // 同步给父组件

    try {
      await updateSetting({ [key]: value })
      Taro.showToast({ title: '已更新', icon: 'none', duration: 1000 })
    } catch (err) {
      // 回滚
      setSetting(setting)
      onSettingChange?.(setting)
      Taro.showToast({ title: '更新失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  const settingItems = [
    { key: 'sound', label: '音效', icon: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/set-effect.png' },
    { key: 'vibration', label: '震感', icon: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/set-phone.png' },
    { key: 'bgm', label: '背景音乐', icon: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/set-music.png' },
    { key: 'immersive_mode', label: '沉浸模式', icon: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/set-deep.png' },
    { key: 'auto_click', label: '自动敲击（未开放）', icon: 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/set-knick.png' },
  ]

  return (
    <View className='setting-modal' onClick={onClose}>
      <View className='setting-content' onClick={(e) => e.stopPropagation()}>
        <Image onClick={onClose} className='setting-close' src='https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/icon/set-close.png' />
        <View className='setting-list'>
          {settingItems.map((item) => (
            <View className='setting-item' key={item.key}>
              <View className='setting-info'>
                <Image className='setting-icon' src={item.icon} />
                <Text className='setting-label'>{item.label}</Text>
              </View>
              <View 
                className={`custom-switch ${setting[item.key as keyof SettingData] ? 'active' : ''}`}
                onClick={() => handleChange(item.key as keyof SettingData, !setting[item.key as keyof SettingData])}
              >
                <View className='custom-switch-thumb' />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

