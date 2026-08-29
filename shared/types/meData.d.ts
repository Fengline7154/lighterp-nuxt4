/**
 * 保证用户数据类型安全,用于token设置，数据过滤等
 * 获取用户信息时的数据结构
 * 说明:
 * user:返回不包含敏感信息的用户数据
 * success:成功状态
 */
export interface IUser {
  id: string;
  username: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  permissions?: string[];
  createAt?: Date;
  lastLoginAt?: Date;
}
