// 功德池等级对应的最大功德值（与后端保持一致）
// 后端: server/src/controllers/user.controller.js POOL_CAPACITIES
export const poolMap: Record<number, number> = {
  0: 10,
  1: 20,
  2: 30,
  // 3: 1000,
  // 4: 2000,
  // 5: 3000,
  // 6: 4000,
  // 7: 5000,
}

// 最大池子等级（共8级，索引0-7）
export const MAX_POOL_LEVEL = Object.keys(poolMap).length - 1

// 最大池子容量
export const MAX_POOL_CAPACITY = poolMap[MAX_POOL_LEVEL]

// 获取池子容量（处理超出范围的情况）
export const getPoolCapacity = (level: number): number => {
  // 如果等级超出范围，返回最大容量
  if (level >= MAX_POOL_LEVEL) {
    return MAX_POOL_CAPACITY
  }
  return poolMap[level] ?? MAX_POOL_CAPACITY
}
