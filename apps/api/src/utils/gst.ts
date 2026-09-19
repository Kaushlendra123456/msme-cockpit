// Simple GST calculation helper.
// Indian GST is usually split into CGST + SGST (intra-state) but for a single
// business-facing number we just compute the total GST amount here.

export interface GstBreakdown {
  taxableAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  totalAmount: number;
  cgst: number;
  sgst: number;
}

export const calculateGst = (
  taxableAmount: number,
  gstRatePercent: number
): GstBreakdown => {
  const gstAmount = Number(((taxableAmount * gstRatePercent) / 100).toFixed(2));
  return {
    taxableAmount,
    gstRatePercent,
    gstAmount,
    totalAmount: Number((taxableAmount + gstAmount).toFixed(2)),
    cgst: Number((gstAmount / 2).toFixed(2)),
    sgst: Number((gstAmount / 2).toFixed(2)),
  };
};
