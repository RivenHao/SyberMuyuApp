import { get } from '../utils/request'
import { LevelConfigItem } from '../config/levelConfig'

/** 获取等级配置列表 */
export const getLevelConfig = () => {
  return get<LevelConfigItem[]>('/level-config')
}
