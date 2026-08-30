import { z } from "zod";
import { SIZES } from "@/lib/schemas/product";
import { CustomMeasurementSchema } from "@/lib/schemas/user";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  price: z.number().positive(),
  size: z.enum(SIZES).optional(),
  color: z.string().optional(),
  quantity: z.number().int().positive().max(10),
  customMeasurements: CustomMeasurementSchema.partial().optional(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  items: z
    .array(OrderItemSchema)
    .min(1, "Order must have at least one item"),
  createdAt: z.date().default(() => new Date()),
  status: z.enum(ORDER_STATUSES).default("pending"),
  total: z.number().positive(),
  notes: z.string().max(1000).optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
