import React from "react";
import { useNavigate } from "react-router-dom"; // Added
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";
import { formatCurrencyWithSign } from "@/lib/utils";
import type { Account } from "@/services/AccountService";

type Props = {
  account: Account;
  /** Called when the user clicks the **card body** (Quick Actions trigger) */
  onClick?: () => void;
  /** Called when the user clicks the pencil icon (Edit) */
  onEdit?: (a: Account) => void;
  /** Called when the user clicks the trash icon (Delete) */
  onDelete?: (id: string) => void;
};

export default function AccountCard({ account, onClick, onEdit, onDelete }: Props) {
  const nav = useNavigate(); // Added
  const cur = account.currency || "USD";
  const balance = account.currentBalance ?? account.balance ?? 0;
  const balanceText = formatCurrencyWithSign(balance, cur);
  // Color rules:
  // - Positive balances green for most accounts
  // - Credit accounts: positive current balance is red
  // - Negative balances remain red
  const balanceClass = balance > 0
    ? (account.type === "credit" ? "text-red-600" : "text-green-600")
    : (balance < 0 ? "text-red-600" : "");

  return (
    <Card
      className="rounded-xl border p-4 hover:bg-muted/50 cursor-pointer transition"
      onClick={onClick}
      role="button"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground capitalize">{account.type}</div>
          <div className="text-lg font-semibold">{account.name}</div>
          <div className={`mt-2 text-2xl font-bold ${balanceClass}`}>
            {balanceText}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Current Balance</div>
        </div>

        <div className="flex gap-1">
          {account.type === "credit" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                nav(
                  `/transactions?add=1&type=transfer&to=${account.id}` +
                  `&category=${encodeURIComponent("Credit Card Payment")}`
                );
              }}
              aria-label="Pay credit card"
              title="Pay credit card"
            >
              Pay
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEdit?.(account); }}
            aria-label="Edit account"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete?.(account.id); }}
            aria-label="Delete account"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* keep your extra credit-card details below if you have them */}
    </Card>
  );
}
