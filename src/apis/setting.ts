import { get, put } from '../utils/request'

// 设置项类型
export interface SettingData {
  sound?: boolean       // 音效
  vibration?: boolean   // 震感
  immersive_mode?: boolean // 沉浸模式
  auto_click?: boolean  // 自动点击
  bgm?: boolean         // 背景音乐
}

// 获取用户设置
export const getSetting = () => {
  return get('/setting')
}

// 更新用户设置（支持部分更新）
export const updateSetting = (data: SettingData) => {
  return put('/setting', data)
}

