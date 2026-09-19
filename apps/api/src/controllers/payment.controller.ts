import { Request, Response } from "express";
import { z } from "zod";

// Razorpay test-mode order creation stub.
// In production: `npm i razorpay`, initialize with keys from env,
// and call razorpay.orders.create({ amount, currency, receipt }).
// Kept as a clearly-marked stub here because it needs real Razorpay
// test/live API keys to actually function.

const createOrderSchema = z.object({
  amount: z.number().positive(), // in INR
  saleId: z.string().uuid().optional(),
});

export const createPaymentOrder = async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes("xxxx")) {
    return res.status(501).json({
      message:
        "Razorpay is not configured yet. Add real RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET to .env to enable payments.",
    });
  }

  // Placeholder response shape matching what the frontend checkout expects.
  // Replace this block with an actual `razorpay.orders.create(...)` call.
  res.json({
    orderId: `order_stub_${Date.now()}`,
    amount: parsed.data.amount * 100, // paise
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  });
};
