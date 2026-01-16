import Taro from '@tarojs/taro'

const CLICK_SOUND_URL = 'https://flow-miniprogram.oss-cn-hangzhou.aliyuncs.com/cybermuyu/audio/normal.mp3'
const POOL_SIZE = 4

let pool: Taro.InnerAudioContext[] | null = null
let index = 0

const isSoundEnabled = () => {
  const setting = Taro.getStorageSync('setting')
  if (setting && typeof setting.sound === 'boolean') return setting.sound
  return true
}

const ensurePool = () => {
  if (pool) return
  pool = []
  for (let i = 0; i < POOL_SIZE; i++) {
    const ctx = Taro.createInnerAudioContext()
    ctx.src = CLICK_SOUND_URL
    pool.push(ctx)
  }
}

export const playClickSound = () => {
  if (!isSoundEnabled()) return
  ensurePool()
  if (!pool || pool.length === 0) return
  const ctx = pool[index % pool.length]
  index = (index + 1) % pool.length
  ctx.stop()
  ctx.seek(0)
  ctx.play()
}
