
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCommandInterpreter } from '../hooks/useCommandInterpreter';
import * as interpreterModule from '../lib/interpreter';

// Mock hooks
const mockAddTransaction = vi.fn();
const mockUpdateProfile = vi.fn();
const mockToast = vi.fn();

vi.mock('../hooks/useTransactions', () => ({
    useTransactions: () => ({
        addTransaction: { mutate: mockAddTransaction },
        editTransaction: { mutate: vi.fn() }
    })
}));

vi.mock('../hooks/useProfile', () => ({
    useProfile: () => ({
        updateProfile: { mutate: mockUpdateProfile }
    })
}));

vi.mock('../hooks/use-toast', () => ({
    useToast: () => ({
        toast: mockToast
    })
}));

// Mock the interpreter module
vi.mock('../lib/interpreter', async (importOriginal) => {
    const actual = await importOriginal<typeof interpreterModule>();
    return {
        ...actual,
        interpretCommand: vi.fn()
    };
});

describe('Financial Command Interpreter Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call updateProfile when intent is SET_VALUE income', async () => {
        vi.mocked(interpreterModule.interpretCommand).mockResolvedValue({
            intent: 'SET_VALUE',
            category: 'income',
            amount: 50000,
            currency: 'INR',
            language_detected: 'English',
            confidence: 0.99
        });

        const { result } = renderHook(() => useCommandInterpreter());

        await act(async () => {
            await result.current.processCommand("Set income to 50000");
        });

        // Use waitFor to handle potential async state updates in the hook if any
        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith(
                expect.objectContaining({ monthly_income: 50000 }),
                expect.any(Object)
            );
        });

        expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should call addTransaction when intent is ADD_VALUE expense', async () => {
        vi.mocked(interpreterModule.interpretCommand).mockResolvedValue({
            intent: 'ADD_VALUE',
            category: 'expense',
            amount: 250,
            currency: 'INR',
            language_detected: 'English',
            confidence: 0.99
        });

        const { result } = renderHook(() => useCommandInterpreter());

        await act(async () => {
            await result.current.processCommand("Spent 250 on coffee");
        });

        await waitFor(() => {
            expect(mockAddTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'expense',
                    amount: 250
                }),
                expect.any(Object)
            );
        });

        expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('should NOT add transaction if intent is SET_VALUE expense (ambiguous safety check)', async () => {
        vi.mocked(interpreterModule.interpretCommand).mockResolvedValue({
            intent: 'SET_VALUE',
            category: 'expense',
            amount: 500,
            currency: 'INR',
            language_detected: 'English',
            confidence: 0.99
        });

        const { result } = renderHook(() => useCommandInterpreter());

        await act(async () => {
            await result.current.processCommand("Expense is 500");
        });

        // Should trigger toast but NOT add transaction or update profile
        expect(mockAddTransaction).not.toHaveBeenCalled();
        expect(mockUpdateProfile).not.toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    });
});
