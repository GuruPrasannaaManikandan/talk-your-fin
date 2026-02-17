import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['salary', 'freelance', 'investment', 'groceries', 'rent', 'utilities', 'food', 'transport', 'entertainment', 'healthcare', 'education', 'shopping', 'other'];

export function TransactionPanel() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { toast } = useToast();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    addTransaction.mutate({ type, amount: amt, category }, {
      onSuccess: () => {
        setAmount('');
        toast({ title: `${type === 'income' ? 'Income' : 'Expense'} added: ₹${amt.toLocaleString()}` });
      },
    });
  };

  const recentTxns = transactions.slice(0, 10);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={type === 'income' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setType('income')}
          >
            Income
          </Button>
          <Button
            variant={type === 'expense' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setType('expense')}
          >
            Expense
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
            />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleAdd} className="w-full" disabled={addTransaction.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Add {type}
        </Button>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {recentTxns.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 text-sm">
              <div className="flex items-center gap-2">
                <span className={tx.type === 'income' ? 'text-primary' : 'text-destructive'}>
                  {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                </span>
                <span className="text-muted-foreground">{tx.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{tx.date}</span>
                <button
                  onClick={() => deleteTransaction.mutate(tx.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {recentTxns.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">No transactions yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
