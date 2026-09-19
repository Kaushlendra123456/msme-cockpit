/**
 * Creates stock-alert notifications. Called after any inventory change
 * (sale, manual adjustment) so the Notifications bell always reflects
 * current reality rather than a stale scheduled job.
 */
export const checkAndNotifyStock = async (
  tx: any,
  params: { businessId: string; productId: string; productName: string; stockQuantity: number; minimumStock: number }
) => {
  const { businessId, productId, productName, stockQuantity, minimumStock } = params;

  if (stockQuantity === 0) {
    await tx.notification.create({
      data: {
        businessId,
        type: "OUT_OF_STOCK",
        title: "Out of stock",
        message: `${productName} is now out of stock.`,
        referenceId: productId,
      },
    });
  } else if (stockQuantity <= minimumStock) {
    await tx.notification.create({
      data: {
        businessId,
        type: "LOW_STOCK",
        title: "Low stock alert",
        message: `${productName} has ${stockQuantity} units left (minimum: ${minimumStock}).`,
        referenceId: productId,
      },
    });
  }
};

export const notifyNewSale = async (
  tx: any,
  params: { businessId: string; invoiceNumber: string; totalAmount: number; saleId: string }
) => {
  await tx.notification.create({
    data: {
      businessId: params.businessId,
      type: "NEW_SALE",
      title: "New sale recorded",
      message: `Invoice ${params.invoiceNumber} — ₹${params.totalAmount.toFixed(2)}`,
      referenceId: params.saleId,
    },
  });
};
