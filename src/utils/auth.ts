import Taro from "@tarojs/taro";
import { wxLogin } from "../apis/auth";
import { SettingData } from "../apis/setting";

// 用户信息类型
export interface UserInfo {
  id: number;
  avatar_url: string;
  current_merit: number;
  nickname: string;
  openid: string;
  pool_level: number;
  total_merit: number;
  overflow_merit: number;
}

// 登录响应类型
interface LoginResponse {
  user: UserInfo;
  setting: SettingData;
}

// 确保已登录，返回用户和设置信息
let loginPromise: Promise<LoginResponse> | null = null;

export const ensureLogin = async (): Promise<LoginResponse> => {
  // 1. 已有 token 和用户信息，直接返回缓存
  const token = Taro.getStorageSync('token');
  const userInfo = Taro.getStorageSync('userInfo');
  const settingInfo = Taro.getStorageSync('settingInfo');
  
  if (token && userInfo) {
    return { user: userInfo, setting: settingInfo };
  }

  // 2. 正在登录中，复用同一个 Promise（防止并发多次登录）
  if (loginPromise) return loginPromise;

  // 3. 执行登录
  loginPromise = (async () => {
    const loginRes = await Taro.login();
    if (!loginRes.code) {
      throw new Error("微信登录失败，无法获取 code");
    }

    // wxLogin 返回 { user, setting }
    const res = await wxLogin(loginRes.code);

    // 检查返回数据结构
    if (!res || !res.user) {
      throw new Error("登录返回数据异常");
    }

    // 存储 token（使用 openid）
    Taro.setStorageSync("token", res.user.openid);
    Taro.setStorageSync("userInfo", res.user);
    Taro.setStorageSync("settingInfo", res.setting);

    loginPromise = null; // 重置，下次可重新登录
    return res as LoginResponse;
  })();

  return loginPromise;
};

// 退出登录
export const logout = () => {
  Taro.removeStorageSync('token');
  Taro.removeStorageSync('userInfo');
  Taro.removeStorageSync('settingInfo');
};
