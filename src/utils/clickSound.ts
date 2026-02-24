import Taro from '@tarojs/taro'

const CLICK_SOUND_URL = 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/audio/normal.mp3'
const POOL_SIZE = 2 // 点击音效 2 个实例

let pool: Taro.InnerAudioContext[] | null = null
let index = 0
let initialized = false

const isSoundEnabled = () => {
  const setting = Taro.getStorageSync('setting')
  if (setting && typeof setting.sound === 'boolean') return setting.sound
  return true
}

// 预加载音效池
export const preloadClickSound = () => {
  if (initialized) return
  initialized = true
  pool = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const ctx = Taro.createInnerAudioContext()
    ctx.startTime = 0.4
    ctx.src = CLICK_SOUND_URL
    pool.push(ctx)
  }
}

export const playClickSound = () => {
  if (!isSoundEnabled()) return
  if (!pool || pool.length === 0) return
  const ctx = pool[index % pool.length]
  index = (index + 1) % pool.length
  ctx.stop()
  ctx.play()
}
