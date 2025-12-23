import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

// 粒子类
class Particle {
  x: number
  y: number
  targetX: number
  targetY: number
  size: number
  color: string
  alpha: number
  arrived: boolean
  delay: number
  life: number  // 生命值

  constructor(x: number, y: number, targetX: number, targetY: number, color: string, delay: number = 0) {
    this.x = x
    this.y = y
    this.targetX = targetX
    this.targetY = targetY
    this.size = Math.random() * 3 + 2
    this.color = color
    this.alpha = 0
    this.arrived = false
    this.delay = delay
    this.life = 120  // 最多存活 120 帧（约 2 秒）
  }

  update(frameCount: number) {
    // 延迟出现
    if (frameCount < this.delay) return
    
    // 生命减少
    this.life--
    if (this.life <= 0) {
      this.arrived = true
      this.alpha = 0
      return
    }
    
    // 渐显
    if (this.alpha < 1 && this.life > 30) {
      this.alpha = Math.min(1, this.alpha + 0.15)
    }
    
    // 快消失时渐隐
    if (this.life < 30) {
      this.alpha = Math.max(0, this.alpha - 0.05)
    }

    // 飞向目标
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist < 20) {
      // 到达目标，快速消失
      this.arrived = true
      this.alpha = 0
    } else {
      // 飞向目标，速度随距离变化
      const speed = Math.min(0.08, 8 / dist)
      this.x += dx * speed
      this.y += dy * speed
      // 轻微曲线
      this.x += Math.sin(frameCount * 0.1) * 0.5
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
    
    // 发光效果
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
  meritValue: number  // 这次要加的功德值
  onComplete?: () => void  // 完成回调
}

export interface ParticleCanvasRef {
  emit: (x: number, y: number, targetX: number, targetY: number, text: string, color: string, onComplete?: () => void) => void
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
        
        // 文字一直往上飘，同时渐隐
        // 从第 50 帧开始，粒子逐渐出现并飞向目标
        const particleStartFrame = 50
        
        // 文字始终在飘动和渐隐
        if (group.textAlpha > 0) {
          // 文字持续往上飘（更快一点）
          group.textY -= 2.2
          
          // 从第 40 帧开始渐隐
          if (group.frameCount > 40) {
            group.textAlpha -= 0.035
          }
          
          ctx.save()
          ctx.font = 'bold 22px sans-serif'  // 字号调小
          ctx.fillStyle = group.color
          ctx.globalAlpha = Math.max(0, group.textAlpha)
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          // 文字发光
          ctx.shadowBlur = 12
          ctx.shadowColor = group.color
          ctx.fillText(group.text, group.textX, group.textY)
          ctx.shadowBlur = 0
          
          ctx.restore()
          ctx.globalAlpha = 1
        }

        // 粒子从第 25 帧开始出现
        if (group.frameCount >= particleStartFrame) {
          // 更新粒子起始位置到当前文字位置
          if (group.frameCount === particleStartFrame) {
            group.particles.forEach(p => {
              p.x = group.textX + (Math.random() - 0.5) * 40
              p.y = group.textY + (Math.random() - 0.5) * 20
            })
          }
          
          let allArrived = true
          const particleFrame = group.frameCount - particleStartFrame
          
          group.particles.forEach(p => {
            p.update(particleFrame)
            p.draw(ctx, particleFrame)
            if (!p.arrived) allArrived = false
          })

          // 所有粒子消失后移除，并触发回调
          if (allArrived && group.textAlpha <= 0) {
            // 触发完成回调（更新进度）
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
  const emit = (x: number, y: number, targetX: number, targetY: number, text: string, color: string, onComplete?: () => void) => {
    const particles: Particle[] = []
    const count = 15 + Math.floor(Math.random() * 8)

    for (let i = 0; i < count; i++) {
      const delay = Math.floor(Math.random() * 20)
      particles.push(new Particle(x, y - 80, targetX, targetY, color, delay))
    }

    // 从文字中提取数值
    const match = text.match(/\d+/)
    const meritValue = match ? parseInt(match[0]) : 1

    particleGroups.current.push({
      particles,
      phase: 'float',
      frameCount: 0,
      text,
      textX: x,
      textY: y - 80,
      textStartY: y - 80,
      textAlpha: 1,
      textScale: 1,
      color,
      meritValue,
      onComplete
    })
  }

  // 暴露方法给父组件
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

