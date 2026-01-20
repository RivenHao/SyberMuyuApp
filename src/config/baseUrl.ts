// 根据 process.env.NODE_ENV 区分环境
export const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：
    // 如果是模拟器，可以使用 http://localhost:3000/api
    // 如果是真机调试，请将 localhost 替换为你电脑的局域网 IP
    // return 'http://172.20.71.0:3000/api'
    return 'http://localhost:3000/api'
    // return 'https://api.cybermuyu.fun/api'
  }
  // 生产环境
  return 'https://api.cybermuyu.fun/api'
}

export const BASE_URL = getBaseUrl()

