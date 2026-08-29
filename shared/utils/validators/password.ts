export const isPassword = (
  password: string,
  safeLevel: "strong" | "medium" | "basic" | "secure" = "basic",
): boolean => {
  if (safeLevel === "secure") {
    if (password.length < 8) return false;
    let complexity = 0;
    if (/[a-z]/.test(password)) complexity++;
    if (/[A-Z]/.test(password)) complexity++;
    if (/\d/.test(password)) complexity++;
    if (/[^a-zA-Z\d]/.test(password)) complexity++;
    return complexity >= 3;
  }
  // 原有逻辑不变
  const passwordRegex = {
    strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
    medium: /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/,
    basic: /^.{6,}$/,
  };
  return passwordRegex[safeLevel].test(password);
};
