import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
  const cur = account.currency || "USD";
  const balance = account.currentBalance ?? account.balance ?? 0;

  return (
    <Card
      className="rounded-xl border p-4 hover:bg-muted/50 cursor-pointer transition"
      onClick={onClick}               // ✅ card body => Quick Actions (parent decides)
      role="button"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground capitalize">{account.type}</div>
          <div className="text-lg font-semibold">{account.name}</div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(Math.abs(balance), cur)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Current Balance</div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEdit?.(account); }}    // ✏️ only edit
            aria-label="Edit account"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete?.(account.id); }} // 🗑 only delete
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
