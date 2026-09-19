import { PrismaClient } from "@prisma/client";

/**
 * Credit ledger core logic, kept separate from the controller so it can be
 * reused (from the sale flow AND from a standalone "record payment" endpoint)
 * and unit-tested without needing an Express request/response.
 */

// Returns true if giving this much additional credit would breach the
// customer's credit limit. A limit of 0 means "no credit allowed at all".
export const wouldExceedCreditLimit = (
  currentOutstanding: number,
  creditLimit: number,
  additionalAmount: number
): boolean => {
  if (creditLimit <= 0) return true;
  return currentOutstanding + additionalAmount > creditLimit;
};

// tx must be a Prisma transaction client (or the main PrismaClient)
export const recordCreditSale = async (
  tx: any,
  params: { businessId: string; customerId: string; amount: number; saleId: string }
) => {
  const customer = await tx.customer.findFirst({
    where: { id: params.customerId, businessId: params.businessId },
  });
  if (!customer) throw { status: 404, message: "Customer not found" };

  if (
    wouldExceedCreditLimit(
      Number(customer.outstandingCredit),
      Number(customer.creditLimit),
      params.amount
    )
  ) {
    throw {
      status: 400,
      message: `Credit limit exceeded. Outstanding: ₹${customer.outstandingCredit}, Limit: ₹${customer.creditLimit}`,
    };
  }

  const newBalance = Number(customer.outstandingCredit) + params.amount;

  await tx.customer.update({
    where: { id: params.customerId },
    data: { outstandingCredit: newBalance },
  });

  await tx.creditLedgerEntry.create({
    data: {
      businessId: params.businessId,
      customerId: params.customerId,
      type: "SALE_ON_CREDIT",
      amount: params.amount,
      balanceAfter: newBalance,
      referenceId: params.saleId,
      note: "Credit sale",
    },
  });
};

export const recordPaymentReceived = async (
  tx: any,
  params: { businessId: string; customerId: string; amount: number; note?: string }
) => {
  const customer = await tx.customer.findFirst({
    where: { id: params.customerId, businessId: params.businessId },
  });
  if (!customer) throw { status: 404, message: "Customer not found" };

  const newBalance = Math.max(0, Number(customer.outstandingCredit) - params.amount);

  await tx.customer.update({
    where: { id: params.customerId },
    data: { outstandingCredit: newBalance },
  });

  return tx.creditLedgerEntry.create({
    data: {
      businessId: params.businessId,
      customerId: params.customerId,
      type: "PAYMENT_RECEIVED",
      amount: params.amount,
      balanceAfter: newBalance,
      note: params.note || "Payment received against credit",
    },
  });
};
