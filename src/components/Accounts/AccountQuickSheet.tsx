import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";

type Account = {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | string;
  currency?: string;
  balance?: number;
  creditLimit?: number;
  statementAmount?: number;
  paidThisCycle?: number;
  owedOnStatement?: number;
};

export default function AccountQuickSheet({
  open,
  onOpenChange,
  account,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: Account | null;
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
}) {
  const nav = useNavigate();
  const isCredit = account?.type === "credit";

  const stats = useMemo(() => {
    if (!account) return null;
    const cur = account.currency || "USD";
    const items: Array<{ label: string; value: string }> = [];

    items.push({
      label: isCredit ? "Current Balance" : "Current Balance",
      value: formatCurrency(Math.abs(account.balance || 0), cur),
    });

    if (isCredit) {
      const limit = account.creditLimit || 0;
      const avail = Math.max(limit - (account.balance || 0), 0);
      items.push({ label: "Credit Limit", value: formatCurrency(limit, cur) });
      items.push({ label: "Available Credit", value: formatCurrency(avail, cur) });
      items.push({
        label: "Paid this cycle",
        value: formatCurrency(Math.abs(account.paidThisCycle || 0), cur),
      });
      items.push({
        label: "Owed on statement",
        value: formatCurrency(Math.abs(account.owedOnStatement || 0), cur),
      });
    }

    return items;
  }, [account, isCredit]);

  if (!account) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {account.name}
            <Badge variant="outline" className="uppercase">
              {account.type}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Quick actions and a snapshot of this account.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Overview */}
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Overview</div>
            <div className="grid grid-cols-1 gap-2">
              {stats?.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(account);
                }}
              >
                Edit account
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(account.id);
                }}
              >
                Delete account
              </Button>

              <Button
                onClick={() => {
                  // Prefill Add Transaction with this account as the selected account
                  onOpenChange(false);
                  nav(`/transactions?add=1&accountId=${account.id}`);
                }}
              >
                Add transaction
              </Button>

              {isCredit && (
                <Button
                  onClick={() => {
                    // Prefill as a transfer *to* this credit card with a special category
                    onOpenChange(false);
                    nav(
                      `/transactions?add=1&type=transfer&to=${account.id}` +
                        `&category=${encodeURIComponent("Credit Card Payment")}`
                    );
                  }}
                >
                  Pay credit card
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
