import { useState, useEffect } from 'react'
import { View, Text, Switch } from '@tarojs/components'
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
    { key: 'sound', label: '音效', desc: '敲击木鱼时播放音效' },
    { key: 'vibration', label: '震感', desc: '敲击木鱼时震动反馈' },
    { key: 'bgm', label: '背景音乐', desc: '播放禅意背景音乐' },
    { key: 'immersive_mode', label: '沉浸模式', desc: '隐藏顶部状态栏' },
    { key: 'auto_click', label: '自动敲击', desc: '自动积累功德' },
  ]

  return (
    <View className='setting-modal' onClick={onClose}>
      <View className='setting-content' onClick={(e) => e.stopPropagation()}>
        <Text className='setting-title'>设置</Text>
        
        <View className='setting-list'>
          {settingItems.map((item) => (
            <View className='setting-item' key={item.key}>
              <View className='setting-info'>
                <Text className='setting-label'>{item.label}</Text>
                <Text className='setting-desc'>{item.desc}</Text>
              </View>
              <Switch
                checked={setting[item.key as keyof SettingData] || false}
                onChange={(e) => handleChange(item.key as keyof SettingData, e.detail.value)}
                color='#d4a574'
              />
            </View>
          ))}
        </View>

        <View className='setting-close' onClick={onClose}>
          <Text>关闭</Text>
        </View>
      </View>
    </View>
  )
}

