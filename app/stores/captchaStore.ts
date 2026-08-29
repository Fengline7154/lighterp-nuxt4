//验证码状态管理，用于登录，注册，手机号绑定等辅助验证场合
export const useCaptchaStore = defineStore("captcha", {
  state: () => ({
    sessionId: "",
    lastFetchTime: 0,
  }),
  actions: {
    setSessionId(id: string) {
      this.sessionId = id;
      this.lastFetchTime = Date.now();
    },

    clearSessionId() {
      this.sessionId = "";
    },

    getSessionId(): string | null {
      return this.sessionId || null;
    },
  },
});
