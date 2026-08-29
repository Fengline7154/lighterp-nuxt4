/**
 * 说明:用于pinia用户状态管理功能
 * 在调用登录与注册api时使用的接口,
 * 规定了登录与注册返回值的结构,
 */
export interface IPinia {
  success?: boolean;
  jwt?: string;
  expriresIn?: number;
  user: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
    createAt: Date;
    lastLogin: Date;
  };
}
