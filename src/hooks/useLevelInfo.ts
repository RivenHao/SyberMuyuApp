import { useState, useEffect, useMemo } from 'react'
import { getLevelConfig } from '../apis/levelConfig'
import { DEFAULT_LEVEL_CONFIG, LevelConfigItem } from '../config/levelConfig'

export interface LevelInfo {
  /** 当前等级配置 */
  current: LevelConfigItem
  /** 下一级配置，已满级则为 null */
  next: LevelConfigItem | null
  /** 当前等级内的进度 0~1，满级为 1 */
  progress: number
  /** 距下一级还需多少功德，满级为 0 */
  remaining: number
  /** 是否满级 */
  isMax: boolean
}

/**
 * 根据 totalMerit 和 userLevel 计算等级进度信息
 * 初始化时请求后端配置，失败则使用兜底默认值
 */
export function useLevelInfo(totalMerit: number, userLevel: number) {
  const [levelConfig, setLevelConfig] = useState<LevelConfigItem[]>(DEFAULT_LEVEL_CONFIG)

  useEffect(() => {
    getLevelConfig()
      .then(data => {
        if (data && data.length > 0) setLevelConfig(data)
      })
      .catch(() => { /* 使用兜底配置 */ })
  }, [])

  const levelInfo: LevelInfo = useMemo(() => {
    const currentIdx = levelConfig.findIndex(c => c.level === userLevel)
    const current = currentIdx >= 0 ? levelConfig[currentIdx] : levelConfig[0]
    const next = currentIdx < levelConfig.length - 1 ? levelConfig[currentIdx + 1] : null
    const isMax = !next

    let progress = 1
    let remaining = 0
    if (next) {
      const range = next.threshold - current.threshold
      const earned = totalMerit - current.threshold
      progress = range > 0 ? Math.min(1, Math.max(0, earned / range)) : 1
      remaining = Math.max(0, next.threshold - totalMerit)
    }

    return { current, next, progress, remaining, isMax }
  }, [totalMerit, userLevel, levelConfig])

  return { levelConfig, levelInfo }
}
