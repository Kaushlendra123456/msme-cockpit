import { calculateGst } from "../src/utils/gst";

describe("calculateGst", () => {
  it("calculates GST correctly for a standard 18% rate", () => {
    const result = calculateGst(1000, 18);
    expect(result.gstAmount).toBe(180);
    expect(result.totalAmount).toBe(1180);
    expect(result.cgst).toBe(90);
    expect(result.sgst).toBe(90);
  });

  it("returns zero GST when the rate is 0%", () => {
    const result = calculateGst(500, 0);
    expect(result.gstAmount).toBe(0);
    expect(result.totalAmount).toBe(500);
  });

  it("handles fractional rates like 5.5% correctly", () => {
    const result = calculateGst(200, 5.5);
    expect(result.gstAmount).toBe(11);
    expect(result.totalAmount).toBe(211);
  });

  it("never produces a negative GST amount for valid positive inputs", () => {
    const result = calculateGst(999.99, 12);
    expect(result.gstAmount).toBeGreaterThanOrEqual(0);
  });

  it("splits CGST and SGST evenly", () => {
    const result = calculateGst(1000, 18);
    expect(result.cgst + result.sgst).toBeCloseTo(result.gstAmount, 2);
  });
});
