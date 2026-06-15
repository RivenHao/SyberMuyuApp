export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/wish/index',
    'pages/beings/index',
    'pages/fulfill/index',
    'pages/tip/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  navigateToMiniProgramAppIdList: [
    'wx2e9ed7a0f0747c89'
  ]
})
