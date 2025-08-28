// src/utils/transactionDisplay.ts
import { Transaction } from "@/services/TransactionService";

/** Signed value to display for this row + which currency to format with. */
export function calcRowAmount(
  t: Transaction,
  getAccountCurrency?: (id: string) => string
): { value: number; currency: string } {
  const type = String(t.type);
  const currency =
    (getAccountCurrency ? getAccountCurrency(t.accountId) : t.currency) || "USD";

  // possible field names across our code
  const fromId =
    (t as any).fromAccountId ??
    (t as any).sourceAccountId ??
    (t as any).transferFromId ??
    null;
  const toId =
    (t as any).toAccountId ??
    (t as any).destinationAccountId ??
    (t as any).transferToId ??
    null;

  // explicit transfer subtypes first
  if (type === "transfer_out") {
    return { value: -Math.abs(Number(t.amount) || 0), currency };
  }
  if (type === "transfer_in") {
    const toAmt = Number((t as any).convertedAmount ?? t.amount) || 0;
    return { value: Math.abs(toAmt), currency };
  }

  // generic transfer (both sides exist)
  if (type === "transfer" || (fromId && toId)) {
    const isFrom = t.accountId === fromId;
    const isTo = t.accountId === toId;
    const fromAmt = Number(t.amount) || 0;
    const toAmt = Number((t as any).convertedAmount ?? t.amount) || 0;
    if (isFrom) return { value: -Math.abs(fromAmt), currency };
    if (isTo) return { value: Math.abs(toAmt), currency };
  }

  // non-transfer default
  const amt = Number(t.amount) || 0;
  return { value: type === "income" ? Math.abs(amt) : -Math.abs(amt), currency };
}
