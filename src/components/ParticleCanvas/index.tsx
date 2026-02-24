import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

// 粒子类
class Particle {
  x: number
  y: number
  offsetX: number  // 相对文字的偏移
  offsetY: number
  targetX: number
  targetY: number
  size: number
  color: string
  alpha: number
  arrived: boolean
  delay: number
  life: number
  flying: boolean  // 是否开始飞向目标

  constructor(x: number, y: number, targetX: number, targetY: number, color: string, delay: number = 0) {
    this.x = x
    this.y = y
    this.offsetX = (Math.random() - 0.5) * 40  // 水平分散适中
    this.offsetY = (Math.random() - 0.5) * 60  // 竖直分散更大
    this.targetX = targetX
    this.targetY = targetY
    this.size = Math.random() * 1 + 2  // 更小的粒子
    this.color = color
    this.alpha = 0
    this.arrived = false
    this.delay = delay
    this.life = 120
    this.flying = false
  }

  update(frameCount: number, shouldFly: boolean, textX: number, textY: number) {
    if (frameCount < this.delay) return
    
    // 渐显（和文字渐隐同步）
    if (this.alpha < 1 && this.life > 30) {
      this.alpha = Math.min(1, this.alpha + 0.06)
    }
    
    if (!this.flying) {
      // 跟随文字位置（轻微漂移）
      this.x = textX + this.offsetX
      this.y = textY + this.offsetY
      // 偏移慢慢扩大，产生"散开"效果
      this.offsetX *= 1.02
      this.offsetY *= 1.02
      
      if (shouldFly) {
        this.flying = true
      }
    } else {
      // 飞向目标
      this.life--
      if (this.life <= 0) {
        this.arrived = true
        this.alpha = 0
        return
      }
      
      if (this.life < 30) {
        this.alpha = Math.max(0, this.alpha - 0.05)
      }

      const dx = this.targetX - this.x
      const dy = this.targetY - this.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 20) {
        this.arrived = true
        this.alpha = 0
      } else {
        const speed = Math.min(0.08, 8 / dist)
        this.x += dx * speed
        this.y += dy * speed
        this.x += Math.sin(frameCount * 0.1) * 0.5
      }
    }
  }

  draw(ctx: any, frameCount: number) {
    if (frameCount < this.delay) return
    if (this.alpha <= 0) return
    
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.globalAlpha = this.alpha
    ctx.fill()
    
    ctx.shadowBlur = 6
    ctx.shadowColor = this.color
    ctx.fill()
    ctx.shadowBlur = 0
    
    ctx.globalAlpha = 1
  }
}

// 粒子组
interface ParticleGroup {
  particles: Particle[]
  phase: 'float' | 'explode' | 'converge'
  frameCount: number
  text: string
  textX: number
  textY: number
  textStartY: number
  textAlpha: number
  textScale: number
  color: string
  meritValue: number
  withParticles: boolean
  onComplete?: () => void
}

export interface ParticleCanvasRef {
  emit: (x: number, y: number, targetX: number, targetY: number, text: string, color: string, withParticles: boolean, onComplete?: () => void) => void
}

const ParticleCanvas = forwardRef<ParticleCanvasRef, object>((_, ref) => {
  const canvasRef = useRef<any>(null)
  const ctxRef = useRef<any>(null)
  const particleGroups = useRef<ParticleGroup[]>([])
  const animationRef = useRef<number>(0)
  const canvasInfo = useRef({ width: 0, height: 0, dpr: 1 })

  // 初始化 Canvas
  useEffect(() => {
    const query = Taro.createSelectorQuery()
    query.select('#particle-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio
        
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)
        
        canvasRef.current = canvas
        ctxRef.current = ctx
        canvasInfo.current = {
          width: res[0].width,
          height: res[0].height,
          dpr
        }
        
        // 开始动画循环
        startAnimation()
      })

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // 动画循环
  const startAnimation = () => {
    const animate = () => {
      const ctx = ctxRef.current
      if (!ctx) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const { width, height } = canvasInfo.current
      ctx.clearRect(0, 0, width, height)

      // 更新和绘制所有粒子组
      particleGroups.current = particleGroups.current.filter(group => {
        group.frameCount++
        
        // 文字飘动一段时间后，开始"转化"为粒子
        const transformStartFrame = 60  // 转化开始帧（多飘0.5s）
        const particleFlyFrame = 90     // 粒子飞向目标帧
        
        // 文字往上飘
        group.textY -= 2.2
        
        // 绘制文字
        if (group.textAlpha > 0) {
          // 有粒子模式：从 transformStartFrame 开始渐隐
          // 无粒子模式：晚一点渐隐
          if (group.withParticles) {
            if (group.frameCount >= transformStartFrame) {
              group.textAlpha -= 0.04  // 和粒子渐显同步
            }
          } else {
            if (group.frameCount > 70) {
              group.textAlpha -= 0.02
            }
          }
          
          ctx.save()
          ctx.font = 'bold 22px sans-serif'
          ctx.fillStyle = group.color
          ctx.globalAlpha = Math.max(0, group.textAlpha)
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          ctx.shadowBlur = 12
          ctx.shadowColor = group.color
          ctx.fillText(group.text, group.textX, group.textY)
          ctx.shadowBlur = 0
          
          ctx.restore()
          ctx.globalAlpha = 1
        }

        // 无粒子模式：文字消失后移除
        if (!group.withParticles) {
          if (group.textAlpha <= 0) {
            if (group.onComplete) {
              group.onComplete()
            }
            return false
          }
          return true
        }

        // 有粒子模式：粒子和文字渐隐同步出现
        if (group.frameCount >= transformStartFrame) {
          // 第一帧：设置粒子初始位置到当前文字位置
          if (group.frameCount === transformStartFrame) {
            group.particles.forEach(p => {
              p.x = group.textX + (Math.random() - 0.5) * 60
              p.y = group.textY + (Math.random() - 0.5) * 30
            })
          }
          
          let allArrived = true
          const particleFrame = group.frameCount - transformStartFrame
          const shouldFly = group.frameCount >= particleFlyFrame
          
          group.particles.forEach(p => {
            p.update(particleFrame, shouldFly, group.textX, group.textY)
            p.draw(ctx, particleFrame)
            if (!p.arrived) allArrived = false
          })

          if (allArrived && group.textAlpha <= 0) {
            if (group.onComplete) {
              group.onComplete()
            }
            return false
          }
        }
        
        return true
      })

      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
  }

  // 发射粒子
  const emit = (x: number, y: number, targetX: number, targetY: number, text: string, color: string, withParticles: boolean, onComplete?: () => void) => {
    const particles: Particle[] = []
    if (withParticles) {
      const count = 25 + Math.floor(Math.random() * 10)  // 更多粒子
      for (let i = 0; i < count; i++) {
        const delay = Math.floor(Math.random() * 30)  // 延迟更分散，形成流线
        particles.push(new Particle(x, y, targetX, targetY, color, delay))
      }
    }

    const match = text.match(/\d+/)
    const meritValue = match ? parseInt(match[0]) : 1

    particleGroups.current.push({
      particles,
      phase: 'float',
      frameCount: 0,
      text,
      textX: x,
      textY: y,
      textStartY: y,
      textAlpha: 1,
      textScale: 1,
      color,
      meritValue,
      withParticles,
      onComplete
    })
  }

  useImperativeHandle(ref, () => ({
    emit
  }))

  return (
    <Canvas
      type='2d'
      id='particle-canvas'
      className='particle-canvas'
      disableScroll
    />
  )
})

export default ParticleCanvas
