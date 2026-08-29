import { isEmail } from "./email";
import { isPhone } from "./phone";

export const accountType = (account: string) => {
  if (isEmail(account, "simple")) {
    return "email";
  }
  if (isPhone(account, "zh")) {
    return "phone";
  }
  return "either";
};

export function formatAccount(account: string, type: "email" | "phone") {
  const trimmed = account.trim();
  if (type === "email") {
    return trimmed.toLowerCase();
  }
  return trimmed;
}
