import Taro from "@tarojs/taro";
import { wxLogin } from "../apis/auth";
import { SettingData } from "../apis/setting";

// 确保已登录，返回 token (用户ID)
let loginPromise: Promise<any> | null = null;
export interface UserInfo {
  avatar_url: string;
  current_merit: number;
  nickname: string;
  openid: string;
  pool_level: number;
  total_merit: number;
}
export const ensureLogin = async (): Promise<{ user: UserInfo, setting: SettingData }> => {
  // 1. 已有 token，直接返回
  //   const token = Taro.getStorageSync('token')
  //   if (token) return Number(token)

  // 2. 正在登录中，复用同一个 Promise（防止并发多次登录）
  if (loginPromise) return loginPromise;

  // 3. 执行登录
  loginPromise = (async () => {
    let res: UserInfo;
    if (process.env.NODE_ENV === "development") {
      const loginRes = await Taro.login();
      if (!loginRes.code) {
        throw new Error("微信登录失败，无法获取 code");
      }
      res = await wxLogin(loginRes.code);
    } else {
      // 生产环境：真实微信登录
      const loginRes = await Taro.login();
      if (!loginRes.code) {
        throw new Error("微信登录失败，无法获取 code");
      }
      res = await wxLogin(loginRes.code);
    }

    Taro.setStorageSync("token", res.openid);
    Taro.setStorageSync("userInfo", res);

    loginPromise = null; // 重置，下次可重新登录
    return res;
  })();

  return loginPromise;
};
