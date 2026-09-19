import { wouldExceedCreditLimit } from "../src/services/credit.service";

describe("wouldExceedCreditLimit", () => {
  it("blocks any credit when the customer's limit is 0", () => {
    expect(wouldExceedCreditLimit(0, 0, 1)).toBe(true);
  });

  it("allows a sale that stays within the limit", () => {
    expect(wouldExceedCreditLimit(2000, 5000, 1000)).toBe(false);
  });

  it("blocks a sale that would exceed the limit", () => {
    expect(wouldExceedCreditLimit(4500, 5000, 1000)).toBe(true);
  });

  it("allows a sale that lands exactly on the limit", () => {
    expect(wouldExceedCreditLimit(4000, 5000, 1000)).toBe(false);
  });

  it("blocks further credit once the customer is already over their limit", () => {
    expect(wouldExceedCreditLimit(5500, 5000, 100)).toBe(true);
  });
});
