import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export function useLoans() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('loans-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_history' }, () => {
        queryClient.invalidateQueries({ queryKey: ['loans'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addLoan = useMutation({
    mutationFn: async (loan: {
      loan_amount: number;
      interest_rate: number;
      tenure: number;
      emi: number;
      risk_score: number;
      risk_level: string;
      debt_to_income: number;
    }) => {
      const { error } = await supabase.from('loan_history').insert({
        user_id: user!.id,
        ...loan,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loans'] }),
  });

  return { loans, isLoading, addLoan };
}
