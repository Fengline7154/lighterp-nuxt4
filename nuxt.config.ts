// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2025-07-15",
  modules: [
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
  ],

  runtimeConfig: {
    jwtKey: process.env.NUXT_JWT_PRIVATE_KEY,
    redisHost: process.env.NUXT_REDIS_HOST,
    redisPort: process.env.NUXT_REDIS_PORT,
    redisPass: process.env.NUXT_REDIS_PASSWORD,
    brcyptSalt: process.env.NUXT_BCRYPT_SALT,
    jwtAccessPrivateKey: process.env.NUXT_JWT_ACCESS_PRIVATE_KEY,
    jwtAccessPublicKey: process.env.NUXT_JWT_ACCESS_PUBLIC_KEY,
    jwtRefreshPrivateKey: process.env.NUXT_JWT_REFRESH_PRIVATE_KEY,
    jwtRefreshPublicKey: process.env.NUXT_JWT_REFRESH_PUBLIC_KEY,
    postgresUrl: process.env.NUXT_POSTGRES_URL || process.env.DATABASE_URL,
  },
  nitro: {
    esbuild: {
      options: {
        target: "es2020", // 确认这一行存在
      },
    },
    storage: {
      // 创建一个名为 'redis' 的存储挂载点
      session: {
        driver: "redis",
        url: process.env.NUXT_REDIS_URL,
        db: 0,
        ttl: 3600,
      },
      captcha: {
        driver: "redis",
        url: process.env.NUXT_REDIS_URL,
        db: 1,
        ttl: 180,
      },
      security: {
        driver: "redis",
        url: process.env.NUXT_REDIS_URL,
        db: 2,
        ttl: 3600,
      },
    },
  },
});
