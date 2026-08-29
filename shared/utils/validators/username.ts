export const isUsername = (
  username: string,
  rule: "Basic" | "GitHubLike" | "CN" | "Strict" = "CN",
): boolean => {
  // 1. 首先检查是否包含不可见控制字符
  const hasControlChars =
    /[\x00-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/.test(username);
  if (hasControlChars) return false;

  // 2. 检查是否包含零宽字符（Zero-width characters）
  const zeroWidthChars = /[\u200B-\u200D\uFEFF]/.test(username);
  if (zeroWidthChars) return false;

  const usernameRegex = {
    Basic: /^[a-zA-Z0-9_]{4,20}$/, //4-20位,大小写字母,数字,下划线
    GitHubLike: /^[a-zA-Z0-9_.-]{3,16}$/, //3-16位，允许字母、数字、_、.、-,如user.name-123
    CN: /^[\u4e00-\u9fa5a-zA-Z0-9]{2,10}$/, //2-10字符,允许中文,数字,字母
    Strict: /^(?![0-9]+$)(?![a-zA-Z]+$)[a-zA-Z0-9_-]{6,12}$/, // 6-12位，至少1字母+1数字，允许 _ 或 -
  };

  return usernameRegex[rule].test(username);
};
