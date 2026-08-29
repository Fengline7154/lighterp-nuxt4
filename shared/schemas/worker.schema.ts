// shared/schemas/worker.schema.ts
import { z } from "zod";

// 身份证号码正则（18位，最后一位可能是X）
const idCardRegex =
  /^[1-9]\d{5}(18|19|20)?\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

// 手机号正则（中国大陆）
const phoneRegex = /^1[3-9]\d{9}$/;

// 虚拟网短号正则（6位数字，以6或7开头，可根据实际情况调整）
const virtualPhoneRegex = /^[6-9]\d{5}$/;

// 紧急联系人手机号正则（同样支持11位或6位虚拟网）
const emergencyPhoneRegex = /^(1[3-9]\d{9}|[6-9]\d{5})$/;

export const createWorkerSchema = z.object({
  // 姓名：1-20个字符，不能为纯数字或特殊符号
  name: z
    .string()
    .min(1, "姓名不能为空")
    .max(20, "姓名不能超过20个字符")
    .regex(
      /^[\u4e00-\u9fa5a-zA-Z·]{1,20}$/,
      "姓名格式不正确，只能包含中文、英文和·",
    ),

  // 工号：后端生成，前端不传或传空字符串，校验时忽略
  code: z.string().optional().default(""),

  // 手机号：支持11位手机号或6位虚拟网短号
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return phoneRegex.test(val) || virtualPhoneRegex.test(val);
      },
      { message: "请输入正确的手机号码（11位手机号或6位虚拟网短号）" },
    ),

  // 身份证号：18位身份证格式
  idCard: z
    .string()
    .optional()
    .refine((val) => !val || idCardRegex.test(val), {
      message: "请输入正确的18位身份证号码",
    }),

  // 部门：1-50个字符
  department: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 1 && val.length <= 50), {
      message: "部门名称长度应在1-50个字符之间",
    }),

  // 职位：1-50个字符
  position: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 1 && val.length <= 50), {
      message: "职位名称长度应在1-50个字符之间",
    }),

  // 入职日期：ISO 8601 格式，且不能是未来日期
  entryDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "入职日期格式无效，请使用ISO 8601格式",
    })
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: "入职日期不能是未来日期",
    }),

  // 紧急联系人：1-20个字符
  emergencyContact: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 1 && val.length <= 20), {
      message: "紧急联系人长度应在1-20个字符之间",
    }),

  // 紧急联系电话：11位中国大陆手机号
  emergencyPhone: z
    .string()
    .optional()
    .refine((val) => !val || emergencyPhoneRegex.test(val), {
      message: "请输入正确的紧急联系电话",
    }),

  // 时薪：非负数，保留两位小数
  hourlyRate: z.coerce
    .number()
    .optional()
    .refine(
      (val) =>
        val === undefined || val === null || (val >= 0 && Number.isFinite(val)),
      { message: "时薪必须是非负数" },
    )
    .transform((val) =>
      val !== undefined && val !== null ? Math.round(val * 100) / 100 : val,
    ),

  // 单价：非负数，保留两位小数
  unitPrice: z.coerce
    .number()
    .optional()
    .refine(
      (val) =>
        val === undefined || val === null || (val >= 0 && Number.isFinite(val)),
      { message: "单价必须是非负数" },
    )
    .transform((val) =>
      val !== undefined && val !== null ? Math.round(val * 100) / 100 : val,
    ),

  // 备注：最多200个字符
  remark: z.string().max(200, "备注不能超过200个字符").optional(),
});

// 如果需要严格的校验（不允许额外字段）
export const strictCreateWorkerSchema = createWorkerSchema.strict();

// 如果需要部分字段必填（例如：创建时必须填写姓名、手机号、部门）
export const createWorkerRequiredSchema = createWorkerSchema.extend({
  name: z.string().min(1, "姓名不能为空").max(20, "姓名不能超过20个字符"),
  phone: z.string().regex(phoneRegex, "请输入正确的手机号码"),
  department: z
    .string()
    .min(1, "部门不能为空")
    .max(50, "部门名称长度应在1-50个字符之间"),
});

// 编辑员工（所有字段可选 + status）
export const updateWorkerSchema = createWorkerSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// 批量创建
export const batchCreateWorkerSchema = z.object({
  workers: z.array(createWorkerSchema).min(1, "至少需要一名员工"),
});
// 导出类型

export type StrictCreateWorkerInput = z.infer<typeof strictCreateWorkerSchema>;
export type CreateWorkerRequiredInput = z.infer<
  typeof createWorkerRequiredSchema
>;
export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
export type BatchCreateWorkerInput = z.infer<typeof batchCreateWorkerSchema>;
