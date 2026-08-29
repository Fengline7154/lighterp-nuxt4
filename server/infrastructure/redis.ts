import { useStorage } from "nitropack/runtime";
//定义redis错误类
export class RedisError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly key?: string,
  ) {
    super(message);
    this.name = "RedisError";
  }
}
//==========================配置部分====================================
//数据库用途类型配置
const DATABASE_CONFIG = [
  { name: "session", description: "存储会话信息" },
  { name: "captcha", description: "存储验证码" },
  { name: "security", description: "存储安全相关数据" },
  // 未来可以轻松添加新数据库：
  //不过前提是nuxt配置文件中已经配置了相应的存储挂载点
  // { name: 'cache', description: '缓存数据' },
  // { name: 'queue', description: '队列数据' },
  // { name: 'analytics', description: '分析数据' },
] as const;

// 从配置中提取存储名称数组
const storageNames = DATABASE_CONFIG.map((config) => config.name) as string[];

//根据数据库配置动态生成索引号
type StorageIndex = Exclude<keyof typeof storageNames, keyof any[]>;
//动态生成类型
type StorageName = (typeof storageNames)[number];
//辅助类型
// 辅助类型：将数字字符串转换为数字字面量类型
// type ToNumber<T extends string> = T extends `${infer N extends number}` ? N : never;
// type StorageIndexNumber = ToNumber<keyof typeof storageNames>;

//=========================验证工具=====================================
/**
 * 验证索引是否为有效的数字
 */
function isValidNumberIndex(index: number): index is StorageIndex {
  return Number.isInteger(index) && index >= 0 && index < storageNames.length;
}

/**
 * 验证名称是否为有效的存储名称
 */
function isValidStorageName(name: string): name is StorageName {
  return storageNames.includes(name as StorageName);
}

//=========================执行部分=====================================
//动态创建数据库存储接口，可使用数字索引或数据库名称索引
const getStorage = (index: string | number) => {
  try {
    const numindex = Number(index);
    const strindex = index.toString();
    if (!isNaN(numindex) && isValidNumberIndex(numindex)) {
      return useStorage(storageNames[numindex]);
    } else if (strindex && isValidStorageName(strindex)) {
      return useStorage(strindex as StorageName);
    }
    throw new RedisError("请检查索引名称", "getStorage", strindex);
  } catch (error: any) {
    if (error instanceof RedisError) throw error;
    throw new RedisError(`Redis 连接失败: ${error.message}`, "connect");
  }
};

export interface IRedisClient {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  incr(key: string, by?: number): Promise<number>;
  expire(key: string, ttl: number): Promise<void>;
}
// ========================= 代理部分 =====================================
/**
 * 代理对象，用于提供对 Redis 数据库的访问。
 *
 * @remarks
 * 通过索引或名称访问数据库存储，并返回一个对象，该对象包含对存储的常用操作。
 *
 *
 */

export const redis = new Proxy({} as Record<StorageName, any>, {
  get(target, prop: string) {
    const index = prop;
    try {
      const storage = getStorage(index);
      if (storage) {
        return {
          get: async <T = any>(key: string): Promise<T | null> => {
            try {
              return await storage.getItem<T>(key);
            } catch (error: any) {
              throw new RedisError(`读取失败: ${error.message}`, "get", key);
            }
          },
          set: async (key: string, value: any, ttl?: number): Promise<void> => {
            try {
              await storage.setItem(key, value, { ttl });
            } catch (error: any) {
              throw new RedisError(`写入失败: ${error.message}`, "set", key);
            }
          },
          del: async (key: string): Promise<void> => {
            try {
              await storage.removeItem(key);
            } catch (error: any) {
              throw new RedisError(`删除失败: ${error.message}`, "del", key);
            }
          },
          has: async (key: string): Promise<boolean> => {
            try {
              return await storage.hasItem(key);
            } catch (error: any) {
              throw new RedisError(`检查失败: ${error.message}`, "has", key);
            }
          },
          keys: async (): Promise<string[]> => {
            try {
              return await storage.getKeys();
            } catch (error: any) {
              throw new RedisError(`获取键列表失败: ${error.message}`, "keys");
            }
          },
          incr: async (key: string, by: number = 1): Promise<number> => {
            try {
              const current = (await storage.getItem<number>(key)) || 0;
              const newValue = current + by;
              await storage.setItem(key, newValue);
              return newValue;
            } catch (error: any) {
              throw new RedisError(`递增失败: ${error.message}`, "incr", key);
            }
          },
          expire: async (key: string, ttl: number): Promise<void> => {
            try {
              const value = await storage.getItem(key);
              if (value !== null) {
                await storage.setItem(key, value, { ttl });
              }
            } catch (error: any) {
              throw new RedisError(
                `设置过期时间失败: ${error.message}`,
                "expire",
                key,
              );
            }
          },
        };
      }
      throw new RedisError(`无效的存储名称: ${prop}`, "getStorage", prop);
    } catch (error) {
      // 如果 getStorage 抛出错误，这里会捕获并重新抛出
      throw error;
    }
  },
});

export function createRedisClient(namespace: string = "session"): IRedisClient {
  // 获取底层的 unstorage 实例
  const storage = getStorage(namespace);

  return {
    async get<T = any>(key: string): Promise<T | null> {
      try {
        return await storage.getItem<T>(key);
      } catch (error: any) {
        throw new RedisError(`读取失败: ${error.message}`, "get", key);
      }
    },

    async set(key: string, value: any, ttl?: number): Promise<void> {
      try {
        // unstorage 的 setItem 支持 options，其中 ttl 单位为秒
        await storage.setItem(key, value, ttl ? { ttl } : undefined);
      } catch (error: any) {
        throw new RedisError(`写入失败: ${error.message}`, "set", key);
      }
    },

    async del(key: string): Promise<void> {
      try {
        await storage.removeItem(key);
      } catch (error: any) {
        throw new RedisError(`删除失败: ${error.message}`, "del", key);
      }
    },

    async has(key: string): Promise<boolean> {
      try {
        return await storage.hasItem(key);
      } catch (error: any) {
        throw new RedisError(`检查失败: ${error.message}`, "has", key);
      }
    },

    async keys(): Promise<string[]> {
      try {
        return await storage.getKeys();
      } catch (error: any) {
        throw new RedisError(`获取键列表失败: ${error.message}`, "keys");
      }
    },

    async incr(key: string, by: number = 1): Promise<number> {
      try {
        // 注意：unstorage 可能不支持原子递增，这里采用 Read-Modify-Write
        // 在高并发下可能存在竞态条件，如需原子性需使用原生 Redis 客户端
        const current = (await storage.getItem<number>(key)) || 0;
        const newValue = current + by;
        await storage.setItem(key, newValue);
        return newValue;
      } catch (error: any) {
        throw new RedisError(`递增失败: ${error.message}`, "incr", key);
      }
    },

    async expire(key: string, ttl: number): Promise<void> {
      try {
        const value = await storage.getItem(key);
        if (value !== null) {
          await storage.setItem(key, value, { ttl });
        }
      } catch (error: any) {
        throw new RedisError(
          `设置过期时间失败: ${error.message}`,
          "expire",
          key,
        );
      }
    },
  };
}

// function resolveIndex(index: number | string): {
//   storage: ReturnType<typeof useStorage>;
//   numericIndex: number;
//   storageName: string | undefined;
// } {
//   let numericIndex: number;
//   let storageName: string | undefined;

//   if (typeof index === "number") {
//     if (!isValidNumberIndex(index)) {
//       throw new Error(`无效的数字索引: ${index}。`);
//     }
//     numericIndex = index;
//     storageName = storageNames[index];
//   } else {
//     if (!isValidStorageName(index)) {
//       throw new Error(
//         `无效的数据库名称: ${index}。有效名称: ${storageNames.join(", ")}`,
//       );
//     }
//     storageName = index;
//     numericIndex = storageNames.indexOf(storageName);
//   }

//   return {
//     storage: useStorage(storageName),
//     numericIndex,
//     storageName,
//   };
// }

//=========================执行部分=====================================
/**
 * 创建 Redis 操作对象
 */
// function createRedisOperations(
//   storage: ReturnType<typeof useStorage>,
//   meta: {
//     numericIndex: number;
//     storageName: string | undefined;
//   },
// ) {
//   return {
//     // 获取值
//     get: <T = any>(key: string): Promise<T | null> => storage.getItem<T>(key),

//     // 设置值
//     set: (key: string, value: any, ttl?: number): Promise<void> =>
//       storage.setItem(key, value, { ttl }),

//     // 删除
//     del: (key: string): Promise<void> => storage.removeItem(key),

//     // 检查是否存在
//     has: (key: string): Promise<boolean> => storage.hasItem(key),

//     // 获取所有键
//     keys: (): Promise<string[]> => storage.getKeys(),

//     // 递增计数器
//     incr: async (key: string, by: number = 1): Promise<number> => {
//       const current = (await storage.getItem<number>(key)) || 0;
//       const newValue = current + by;
//       await storage.setItem(key, newValue);
//       return newValue;
//     },

//     // 设置过期时间
//     expire: async (key: string, ttl: number): Promise<void> => {
//       const value = await storage.getItem(key);
//       if (value !== null) {
//         await storage.setItem(key, value, { ttl });
//       }
//     },

//     // 获取元数据
//     getMeta: () => ({ ...meta }),
//     getIndex: () => meta.numericIndex,
//     getName: () => meta.storageName,
//   };
// }

/**
 * 创建支持动态索引的 Redis 代理对象
 * 索引会根据 DATABASE_CONFIG 自动生成
 */
// export const redis = new Proxy({} as any, {
//   get(target, prop: string | symbol) {
//     const propStr = prop.toString();

//     // 处理数字索引（包括字符串形式的数字）
//     const numericIndex = Number(propStr);
//     if (!isNaN(numericIndex) && isValidNumberIndex(numericIndex)) {
//       const storage = useStorage(storageNames[numericIndex]);
//       return createRedisOperations(storage, {
//         numericIndex,
//         storageName: storageNames[numericIndex],
//       });
//     }

//     // 处理名称索引
//     if (isValidStorageName(propStr)) {
//       const numericIndex = storageNames.indexOf(propStr);
//       const storage = useStorage(propStr as StorageName);
//       return createRedisOperations(storage, {
//         numericIndex,
//         storageName: propStr,
//       });
//     }

//     // 访问其他属性时返回 undefined
//     return undefined;
//   },
// });
/**



 * 
 */

/**
 * // 封装常用操作
export const redisUtils = {
  // 获取值
  async get<T = any>(key: string): Promise<T | null> {
    return await redis.getItem<T>(key);
  },

  // 设置值
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await redis.setItem(key, value, { ttl });
  },

  // 删除
  async del(key: string): Promise<void> {
    await redis.removeItem(key);
  },

  // 检查是否存在
  async has(key: string): Promise<boolean> {
    return await redis.hasItem(key);
  },

  // 获取所有键（慎用，会阻塞）
  async keys(pattern?: string): Promise<string[]> {
    // 注意：unstorage 的 getKeys 可能不支持 pattern
    // 如需 pattern，建议直接使用原生 Redis 客户端
    return await redis.getKeys();
  },

  // 递增计数器
  async incr(key: string, by: number = 1): Promise<number> {
    const current = (await redis.getItem<number>(key)) || 0;
    const newValue = current + by;
    await redis.setItem(key, newValue);
    return newValue;
  },

  // 设置过期时间
  async expire(key: string, ttl: number): Promise<void> {
    // unstorage 的 setItem 支持 ttl，但需要重新设置
    const value = await redis.getItem(key);
    if (value !== null) {
      await redis.setItem(key, value, { ttl });
    }
  },
};

 */
