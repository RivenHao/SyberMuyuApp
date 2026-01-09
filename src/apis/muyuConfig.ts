import { get, put, post } from '../utils/request'

// 木鱼配置类型
export interface MuyuConfigData {
  // 连击阶段配置
  blue_combo: number       // 蓝色阶段连击次数 (Stage 2)
  red_combo: number        // 红色阶段连击次数 (Stage 3)
  orange_combo: number     // 橙色阶段连击次数 (Stage 4)
  purple_combo: number     // 紫色/第五阶段连击次数 (Stage 5) - 新增
  
  // 连击节奏区间
  combo_interval_min: number  // 连击节奏最小间隔(ms)
  combo_interval_max: number  // 连击节奏最大间隔(ms)
  // 功德池容量配置
  pool_capacities: number[]   // 各等级功德池容量数组
  // 沉浸模式配置
  immersive_tap_count: number // 沉浸模式触发敲击次数
  immersive_timeout: number   // 沉浸模式恢复超时时间(ms)
  // 各阶段功德加成
  normal_merit: number     // 普通阶段功德加成
  blue_merit: number       // 蓝色阶段功德加成
  red_merit: number        // 红色阶段功德加成
  orange_merit: number     // 橙色阶段功德加成
  purple_merit: number     // 紫色/第五阶段功德加成 - 新增
}

// 获取木鱼配置
export const getMuyuConfig = (): Promise<MuyuConfigData> => {
  return get('/muyu-config')
}

// 更新木鱼配置（支持部分更新）
export const updateMuyuConfig = (data: Partial<MuyuConfigData>) => {
  return put('/muyu-config', data)
}

// 重置为默认配置
export const resetMuyuConfig = (): Promise<MuyuConfigData> => {
  return post('/muyu-config/reset')
}
