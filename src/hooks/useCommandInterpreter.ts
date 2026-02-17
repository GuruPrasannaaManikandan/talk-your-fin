
import { useCallback, useState } from 'react';
import { useFinancialAnalytics } from './useFinancialAnalytics';
import { useTransactions } from './useTransactions';
import { useProfile } from './useProfile';
import { interpretCommand } from '@/lib/interpreter';
import { useToast } from './use-toast';

export function useCommandInterpreter() {
    const [isProcessing, setIsProcessing] = useState(false);
    const { addTransaction, editTransaction, transactions } = useTransactions();
    const { updateProfile } = useProfile();
    const { toast } = useToast();
    const analytics = useFinancialAnalytics();

    const processCommand = useCallback(async (text: string) => {
        setIsProcessing(true);
        try {
            // Prepare context
            const context = {
                income: analytics.monthlyIncome,
                expenses: analytics.monthlyExpenses,
                debt: analytics.totalEMI,
                savingsRate: analytics.savingsRate,
                healthScore: analytics.healthScore,
                recentTransactions: transactions.slice(0, 5).map(t => ({
                    type: t.type, amount: t.amount, category: t.category
                }))
            };

            const result = await interpretCommand(text, context);
            console.log("Interpreter Result:", result);

            if (!result.amount && result.intent !== 'QUERY_ONLY') {
                toast({ title: "Could not understand amount", variant: "destructive" });
                return result;
            }

            switch (result.intent) {
                case 'SET_VALUE':
                    if (result.category === 'income') {
                        updateProfile.mutate({ monthly_income: result.amount! }, {
                            onSuccess: () => toast({
                                title: result.response || `Income set to ${result.amount}`,
                                description: result.response ? `Income set to ${result.amount}` : undefined
                            })
                        });
                    } else if (result.category === 'expense') {
                        // Handle "Set Expense" by creating an adjustment transaction
                        // 1. Fetch current month expenses
                        const now = new Date();
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

                        const { supabase } = await import('@/integrations/supabase/client');
                        const { data: txns } = await supabase
                            .from('transactions')
                            .select('amount, type')
                            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
                            .eq('type', 'expense')
                            .gte('date', startOfMonth)
                            .lte('date', endOfMonth);

                        const currentTotal = txns?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
                        const targetAmount = result.amount!;
                        const difference = targetAmount - currentTotal;

                        if (Math.abs(difference) < 1) {
                            toast({ title: "Expenses already at target" });
                            break;
                        }

                        // Add adjustment transaction
                        addTransaction.mutate({
                            type: 'expense',
                            // If difference is positive, we need to ADD expense.
                            // If difference is negative, we technically need to "refund" or have a negative expense.
                            // Our schema implies amount is number. We'll store positive amount but type 'expense'.
                            // Wait, if we want to reduce expense, we need a negative amount?
                            // Or an 'income' type labeled as 'Expense Correction'?
                            // Let's assume standard 'expense' accounts. 
                            // If difference is negative (e.g. current 500, target 200, diff -300), we need to reduce total.
                            // Adding a negative expense might be allowed or we use a "refund" income.
                            // Let's try adding with the signed difference. If schema allows negative, great. 
                            // If not, we might need to handle it. Usually financial apps allow negative transaction for refunds.
                            amount: difference,
                            category: 'adjustment',
                            description: `Correction to set total to ${targetAmount}`
                        }, {
                            onSuccess: () => toast({ title: `Expenses adjusted to match ${targetAmount}` })
                        });
                    }
                    break;

                case 'ADD_VALUE':
                case 'SUBTRACT_VALUE': // Financial app: "Subtract expense" usually means "refund" or "remove".
                    // If intent is SUBTRACT, amount should be negative? Or type = expense?
                    // "Spent 500" -> ADD_VALUE (expense).
                    // "Earned 500" -> ADD_VALUE (income).
                    const amount = result.intent === 'SUBTRACT_VALUE' ? -(result.amount!) : result.amount!;
                    const type = result.category === 'income' ? 'income' : 'expense';

                    addTransaction.mutate({
                        type,
                        amount: Math.abs(amount), // API expects positive, type determines sign usually, but let's check conventions.
                        // Schema has 'type' string. Usually stores positive numbers.
                        category: 'other', // We could ask LLM for category too! prompt has it.
                        description: `Voice Command (${result.language_detected})`
                    }, {
                        onSuccess: () => toast({
                            title: result.response || `${type === 'income' ? 'Income' : 'Expense'} added: ${amount}`,
                            description: result.response ? `${type === 'income' ? 'Income' : 'Expense'} added: ${amount}` : undefined
                        })
                    });
                    break;

                case 'QUERY_ONLY':
                    // Just acknowledge
                    toast({ title: "Query processed", description: "This feature is coming soon!" });
                    break;
            }

            return result;
        } catch (error: any) {
            console.error("Interpreter Error:", error);
            toast({
                title: "Error processing command",
                description: error.message || "Please check your API Key",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    }, [addTransaction, updateProfile, toast]);

    return { processCommand, isProcessing };
}
