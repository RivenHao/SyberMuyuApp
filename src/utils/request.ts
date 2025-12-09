import Taro from '@tarojs/taro'
import { BASE_URL } from '../config/baseUrl'

// 定义接口返回的标准格式
interface ApiResponse<T = any> {
  code: number
  data: T
  msg: string
}

// 拦截器配置
const interceptor = function (chain) {
  const requestParams = chain.requestParams
  // const { url } = requestParams
  // console.log(`http ${requestParams.method || 'GET'} --> ${url} data: `, requestParams.data)

  return chain.proceed(requestParams).then(res => {
    // console.log(`http <-- ${url} result:`, res)
    return res
  })
}

// 添加拦截器
Taro.addInterceptor(interceptor)

/**
 * 封装网络请求
 * @param url 接口地址 (不带 BaseUrl，例如 '/merit')
 * @param method 请求方法
 * @param data 请求参数
 * @param showLoading 是否显示 Loading
 */
export const request = async <T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data: any = {},
  showLoading = false
): Promise<T> => {
  if (showLoading) {
    Taro.showLoading({ title: '加载中...' })
  }

  // 获取 Token (假设存放在 Storage 中)
  const token = Taro.getStorageSync('token')

  try {
    const res = await Taro.request<ApiResponse<T>>({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        // 自动携带 Token
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })

    if (showLoading) {
      Taro.hideLoading()
    }

    // HTTP 状态码错误
    if (res.statusCode !== 200) {
      Taro.showToast({
        title: `网络错误 ${res.statusCode}`,
        icon: 'none'
      })
      return Promise.reject(res)
    }

    // 业务状态码判断 (根据你的后端约定，这里假设 0 是成功)
    if (res.data.code !== 0) {
      // 可以在这里处理特定的错误码，例如登录过期
      if (res.data.code === 401) {
        // 清除 token 并跳转登录等操作
        Taro.removeStorageSync('token')
      }
      
      Taro.showToast({
        title: res.data.msg || '请求失败',
        icon: 'none'
      })
      return Promise.reject(res.data)
    }

    return res.data.data
  } catch (err) {
    if (showLoading) {
      Taro.hideLoading()
    }
    Taro.showToast({
      title: '网络请求异常',
      icon: 'none'
    })
    return Promise.reject(err)
  }
}

// 快捷方法
export const get = <T = any>(url: string, data?: any) => request<T>(url, 'GET', data)
export const post = <T = any>(url: string, data?: any) => request<T>(url, 'POST', data)
export const put = <T = any>(url: string, data?: any) => request<T>(url, 'PUT', data)
export const del = <T = any>(url: string, data?: any) => request<T>(url, 'DELETE', data)

