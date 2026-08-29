export const useToast = () => {
  const toast: any = inject("toast", null);

  const extractMessage = (e: any): string => {
    const msg = e?.data?.message || e?.message || "";
    const zodMatch = msg.match(/"message":\s*"([^"]+)"/);
    return zodMatch ? zodMatch[1] : msg;
  };

  return {
    error: (e: any, fallback?: string) => {
      const message = typeof e === "string" ? e : extractMessage(e);
      const finalMessage = message || fallback || "操作失败";

      if (toast?.error) {
        toast.error(finalMessage);
      } else {
        console.error("[Toast Error]", finalMessage);
      }
    },
    success: (msg: string) => {
      if (toast?.success) {
        toast.success(msg);
      } else {
        console.log("[Toast Success]", msg);
      }
    },
  };
};
