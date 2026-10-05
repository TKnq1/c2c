import { PRO_WITHDRAWAL_MS } from "@/lib/constants";

export function canWithdrawPro(proSince: Date | null) {
  if (!proSince) return false;
  return Date.now() - proSince.getTime() <= PRO_WITHDRAWAL_MS;
}
