import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';

interface TransactionFilterProps {
  selectedTypes: string[];
  onFilterChange: (types: string[]) => void;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({ selectedTypes, onFilterChange }) => {
  const transactionTypes = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'bill_payment', label: 'Bill Payment' },
    { value: 'loan_payment', label: 'Loan Payment' }
  ];

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onFilterChange(newTypes);
  };

  const handleShowAll = () => {
    onFilterChange([]);
  };

  const getFilterLabel = () => {
    if (selectedTypes.length === 0) return 'All Types';
    if (selectedTypes.length === 1) {
      const type = transactionTypes.find(t => t.value === selectedTypes[0]);
      return type?.label || 'Filtered';
    }
    return `${selectedTypes.length} Types`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          {getFilterLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuCheckboxItem
          checked={selectedTypes.length === 0}
          onCheckedChange={handleShowAll}
          className="font-medium"
        >
          Show All
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {transactionTypes.map((type) => (
          <DropdownMenuCheckboxItem
            key={type.value}
            checked={selectedTypes.includes(type.value)}
            onCheckedChange={() => handleTypeToggle(type.value)}
          >
            {type.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TransactionFilter;