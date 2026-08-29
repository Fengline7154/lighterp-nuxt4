import { z } from "zod";

export const useSafeFetch = async <T>(
  url: string | ComputedRef<string>,
  schema: z.ZodSchema<T>,
  opts?: any,
) => {
  const { data, ...rest } = await useFetch(url, opts);

  const parsed = computed(() => {
    if (!data.value)
      return { success: false, data: null as T | null, error: "无数据" };
    const result = schema.safeParse(data.value);
    if (!result.success) {
      console.warn(`[useSafeFetch] ${url} 数据格式异常:`, result.error.issues);
      return {
        success: false,
        data: null as T | null,
        error: result.error.message,
      };
    }
    return { success: true, data: result.data, error: null };
  });

  return { parsed, ...rest };
};
