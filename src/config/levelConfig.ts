export interface LevelConfigItem {
  level: number
  threshold: number
  title: string
  level_merit: number
  primary_color: string
}

/** 前端兜底默认 10 级配置，与后端 muyu_level_config 表一致 */
export const DEFAULT_LEVEL_CONFIG: LevelConfigItem[] = [
  { level: 1,  threshold: 0,      title: '初心', level_merit: 0,  primary_color: '#B8B8B8' },
  { level: 2,  threshold: 200,    title: '入定', level_merit: 1,  primary_color: '#83D9FF' },
  { level: 3,  threshold: 800,    title: '静心', level_merit: 2,  primary_color: '#80FFFF' },
  { level: 4,  threshold: 2000,   title: '明悟', level_merit: 3,  primary_color: '#FFB04E' },
  { level: 5,  threshold: 5000,   title: '通玄', level_merit: 4,  primary_color: '#FF7C4B' },
  { level: 6,  threshold: 12000,  title: '圆融', level_merit: 5,  primary_color: '#C97FFF' },
  { level: 7,  threshold: 30000,  title: '觉行', level_merit: 7,  primary_color: '#FFD56B' },
  { level: 8,  threshold: 80000,  title: '妙智', level_merit: 9,  primary_color: '#6BFFB8' },
  { level: 9,  threshold: 200000, title: '无相', level_merit: 12, primary_color: '#FF6BC9' },
  { level: 10, threshold: 500000, title: '圆扣', level_merit: 16, primary_color: '#F5F5DC' },
]
