import { MuyuConfigData } from '../apis/muyuConfig'

/**
 * 木鱼默认配置
 * 正式上线时使用此配置，测试阶段从数据库获取
 */
export const DEFAULT_MUYU_CONFIG: MuyuConfigData = {
  // 连击阶段配置
  blue_combo: 5,        // 5连击进入蓝色阶段 (Stage 2)
  red_combo: 10,        // 10连击进入红色阶段 (Stage 3)
  orange_combo: 30,     // 15连击进入橙色阶段 (Stage 4)
  purple_combo: 50,     // 20连击进入紫色/第五阶段 (Stage 5)
  
  // 连击节奏区间（ms）
  combo_interval_min: 500,   // 最小间隔
  combo_interval_max: 1000,  // 最大间隔
  
  // 功德池容量配置（各等级）
  pool_capacities: [100, 200, 300, 400, 500, 1000, 1500, 2000],
  
  // 沉浸模式配置
  immersive_tap_count: 6,    // 敲击6次触发
  immersive_timeout: 2000,   // 2秒无操作恢复
  
  // 各阶段功德加成
  normal_merit: 1,     // 普通阶段 +1
  blue_merit: 2,       // 蓝色阶段 +2
  red_merit: 3,        // 红色阶段 +3
  orange_merit: 4,     // 橙色阶段 +4
  purple_merit: 5      // 第五阶段 +5
}

/**
 * 是否使用服务器配置（测试阶段开启）
 * 正式上线时改为 false
 */
export const USE_SERVER_CONFIG = false
