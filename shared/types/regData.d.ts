/**
 * 说明:该接口用于规范传入api/auth/register的数据结构
 * 该api用于账号注册,功能有输入检测,格式检查,用户查重
 * 本接口除了用作注册api的输入,
 * 也作为pinia用户状态管理(stores/auth.ts)
 * 中,注册功能调用注册api时的输出
 *
 * 参数说明:
 * username;用户名
 * password;密码
 * account;邮箱或者手机号,与regtype对应
 * [已弃用]regtype;规定注册时的账号类型phone或者email，现改为自动检测
 */
export interface IRegData {
  code: number;
  message: String;
  user: {
    id: String;
    username: String | null;
    account: String | null;
    password: String | null;
    role: String;
    permissions: string[];
  };
}
