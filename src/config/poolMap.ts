// 默认功德池容量配置（后期上线可改回此值）
export const DEFAULT_POOL_CAPACITIES = [10, 20, 30, 40, 50, 60, 70, 80]

// 根据容量数组获取最大等级
export const getMaxPoolLevel = (capacities: number[] = DEFAULT_POOL_CAPACITIES): number => {
  return capacities.length - 1
}

// 根据容量数组获取最大容量
export const getMaxPoolCapacity = (capacities: number[] = DEFAULT_POOL_CAPACITIES): number => {
  return capacities[capacities.length - 1] ?? DEFAULT_POOL_CAPACITIES[DEFAULT_POOL_CAPACITIES.length - 1]
}

// 获取池子容量（处理超出范围的情况）
// capacities: 从服务端获取的容量数组，默认使用 DEFAULT_POOL_CAPACITIES
export const getPoolCapacity = (level: number, capacities: number[] = DEFAULT_POOL_CAPACITIES): number => {
  const maxLevel = capacities.length - 1
  // 如果等级超出范围，返回最大容量
  if (level >= maxLevel) {
    return capacities[maxLevel]
  }
  return capacities[level] ?? capacities[maxLevel]
}

// 检查是否已达到最大等级
export const isMaxPoolLevel = (level: number, capacities: number[] = DEFAULT_POOL_CAPACITIES): boolean => {
  return level >= capacities.length - 1
}
