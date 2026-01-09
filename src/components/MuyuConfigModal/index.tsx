import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getMuyuConfig, updateMuyuConfig, resetMuyuConfig, MuyuConfigData } from '../../apis/muyuConfig'
import { DEFAULT_MUYU_CONFIG } from '../../config/muyuConfig'
import './index.scss'

interface MuyuConfigModalProps {
  show: boolean
  onClose: () => void
  onConfigChange?: (config: MuyuConfigData) => void
}

export default function MuyuConfigModal({ show, onClose, onConfigChange }: MuyuConfigModalProps) {
  const [config, setConfig] = useState<MuyuConfigData>(DEFAULT_MUYU_CONFIG)
  const [loading, setLoading] = useState(false)
  const [poolCapacitiesStr, setPoolCapacitiesStr] = useState('')

  // 打开时获取配置
  useEffect(() => {
    if (show) {
      fetchConfig()
    }
  }, [show])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const res = await getMuyuConfig()
      setConfig(res)
      setPoolCapacitiesStr(res.pool_capacities.join(','))
      setInputValues({}) // 重置输入框值
    } catch (err) {
      console.error('获取配置失败', err)
      Taro.showToast({ title: '获取配置失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 用于存储输入框的字符串值（允许为空）
  const [inputValues, setInputValues] = useState<Record<string, string>>({})

  // 更新单个字段
  const handleChange = (key: keyof MuyuConfigData, value: string) => {
    // 先更新输入框显示值
    setInputValues(prev => ({ ...prev, [key]: value }))
    
    // 如果是有效数字，同步更新配置
    const numValue = parseInt(value, 10)
    if (!Number.isNaN(numValue) && numValue >= 0) {
      setConfig(prev => ({ ...prev, [key]: numValue }))
    }
  }

  // 获取输入框显示值
  const getInputValue = (key: keyof MuyuConfigData): string => {
    if (inputValues[key] !== undefined) {
      return inputValues[key]
    }
    return String(config[key])
  }

  // 更新功德池容量
  const handlePoolCapacitiesChange = (value: string) => {
    setPoolCapacitiesStr(value)
  }

  // 保存配置
  const handleSave = async () => {
    try {
      setLoading(true)
      
      // 解析功德池容量
      const poolCapacities = poolCapacitiesStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n) && n > 0)
      if (poolCapacities.length === 0) {
        Taro.showToast({ title: '功德池容量格式错误', icon: 'none' })
        return
      }

      const newConfig = { ...config, pool_capacities: poolCapacities }
      await updateMuyuConfig(newConfig)
      setConfig(newConfig)
      onConfigChange?.(newConfig)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (err) {
      console.error('保存配置失败', err)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 重置为默认配置
  const handleReset = async () => {
    try {
      setLoading(true)
      const res = await resetMuyuConfig()
      setConfig(res)
      setPoolCapacitiesStr(res.pool_capacities.join(','))
      onConfigChange?.(res)
      Taro.showToast({ title: '已重置', icon: 'success' })
    } catch (err) {
      console.error('重置配置失败', err)
      Taro.showToast({ title: '重置失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <View className='muyu-config-modal' onClick={onClose}>
      <View className='config-content' onClick={(e) => e.stopPropagation()}>
        <Text className='config-title'>木鱼配置（测试用）</Text>
        
        <View className='config-scroll'>
          {/* 连击阶段配置 */}
          <View className='config-section'>
            <Text className='section-title'>连击阶段</Text>
            <View className='config-item'>
              <Text className='item-label'>蓝色阶段连击数</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('blue_combo')}
                onInput={(e) => handleChange('blue_combo', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>红色阶段连击数</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('red_combo')}
                onInput={(e) => handleChange('red_combo', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>橙色阶段连击数</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('orange_combo')}
                onInput={(e) => handleChange('orange_combo', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>紫色阶段连击数</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('purple_combo')}
                onInput={(e) => handleChange('purple_combo', e.detail.value)}
              />
            </View>
          </View>

          {/* 连击节奏区间 */}
          <View className='config-section'>
            <Text className='section-title'>连击节奏区间 (ms)</Text>
            <View className='config-item'>
              <Text className='item-label'>最小间隔</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('combo_interval_min')}
                onInput={(e) => handleChange('combo_interval_min', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>最大间隔</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('combo_interval_max')}
                onInput={(e) => handleChange('combo_interval_max', e.detail.value)}
              />
            </View>
          </View>

          {/* 功德池容量 */}
          <View className='config-section'>
            <Text className='section-title'>功德池容量</Text>
            <View className='config-item'>
              <Text className='item-label'>各等级容量(逗号分隔)</Text>
              <Input
                className='item-input wide'
                value={poolCapacitiesStr}
                onInput={(e) => handlePoolCapacitiesChange(e.detail.value)}
                placeholder='10,20,30,40,50,60,70,80'
              />
            </View>
          </View>

          {/* 沉浸模式配置 */}
          <View className='config-section'>
            <Text className='section-title'>沉浸模式</Text>
            <View className='config-item'>
              <Text className='item-label'>触发敲击次数</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('immersive_tap_count')}
                onInput={(e) => handleChange('immersive_tap_count', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>恢复超时 (ms)</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('immersive_timeout')}
                onInput={(e) => handleChange('immersive_timeout', e.detail.value)}
              />
            </View>
          </View>

          {/* 功德加成 */}
          <View className='config-section'>
            <Text className='section-title'>各阶段功德加成</Text>
            <View className='config-item'>
              <Text className='item-label'>普通阶段</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('normal_merit')}
                onInput={(e) => handleChange('normal_merit', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>蓝色阶段</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('blue_merit')}
                onInput={(e) => handleChange('blue_merit', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>红色阶段</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('red_merit')}
                onInput={(e) => handleChange('red_merit', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>橙色阶段</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('orange_merit')}
                onInput={(e) => handleChange('orange_merit', e.detail.value)}
              />
            </View>
            <View className='config-item'>
              <Text className='item-label'>紫色阶段</Text>
              <Input
                className='item-input'
                type='number'
                value={getInputValue('purple_merit')}
                onInput={(e) => handleChange('purple_merit', e.detail.value)}
              />
            </View>
          </View>
        </View>

        {/* 按钮区域 */}
        <View className='config-buttons'>
          <Button className='btn-reset' onClick={handleReset} disabled={loading}>重置默认</Button>
          <Button className='btn-save' onClick={handleSave} disabled={loading}>保存配置</Button>
        </View>

        <View className='config-close' onClick={onClose}>
          <Text>关闭</Text>
        </View>
      </View>
    </View>
  )
}

