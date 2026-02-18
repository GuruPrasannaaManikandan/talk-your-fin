
import { SYSTEM_PROMPT } from './prompts';

export interface CommandResult {
    intent: 'SET_VALUE' | 'ADD_VALUE' | 'SUBTRACT_VALUE' | 'QUERY_ONLY' | 'SIMULATE_LOAN';
    category: 'income' | 'expense' | 'savings' | 'other' | 'loan';
    amount: number | null;
    currency: string | null;
    language_detected: string;
    confidence: number;
    response?: string;
}

export async function interpretCommand(text: string, context?: any): Promise<CommandResult> {
    const apiKey = import.meta.env.VITE_LLM_API_KEY;

    if (!apiKey) {
        console.error("VITE_LLM_API_KEY is missing!");
        throw new Error("LLM API Key is missing. Please add VITE_LLM_API_KEY to your .env file.");
    }

    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-flash-latest",
        "gemini-2.5-flash"
    ];

    const contextString = context ? `
CURRENT FINANCIAL CONTEXT:
Income: ${context.income}
Expenses: ${context.expenses}
Debt/Loans: ${context.debt}
Savings Rate: ${context.savingsRate}%
Health Score: ${context.healthScore}
Recent Transactions: ${JSON.stringify(context.recentTransactions)}
` : "";

    const payload = {
        contents: [{
            parts: [{
                text: `${SYSTEM_PROMPT}

${contextString}

User Command: "${text}"

Respond with ONLY the JSON.`
            }]
        }]
    };

    let lastError = null;

    for (const model of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            console.log(`Attempting LLM call with model: ${model}`);
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                // If 404, try next model. For other errors (403, 500), maybe throw immediately? 
                // Let's safe-fail and try others just in case permission varies by model.
                console.warn(`Model ${model} failed: ${response.status} ${errorText}`);
                lastError = new Error(`LLM Error (${model}): ${response.status} ${errorText}`);
                continue;
            }

            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) throw new Error("Empty response from LLM");

            // Clean markdown manually if present
            const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(jsonStr) as CommandResult;

        } catch (error) {
            console.warn(`Error with model ${model}:`, error);
            lastError = error;
            // continue loop
        }
    }

    // If we get here, all models failed
    console.error("All models failed. Last error:", lastError);
    throw lastError || new Error("Failed to connect to any Gemini model. Please check your API Key.");
}

export async function getFinancialAdvice(data: any, language: string): Promise<string> {
    const apiKey = import.meta.env.VITE_LLM_API_KEY;

    // Fallback if key missing (though app should block earlier)
    if (!apiKey) return "API Key missing.";

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const isSimulation = data.type === 'loan_simulation';

    let instructions = "Keep it short (1-2 sentences).";
    if (isSimulation) {
        instructions = "Provide a comprehensive spoken summary. detailedly Compare 'Before' vs 'After' for Debt-to-Income, Health Score, and Stress Risk. State the new EMI explicitly. Explain the risk level and read any warnings clearly.";
    }

    const prompt = `
    You are a financial assistant.
    The user speaks: ${language}.
    
    Convert this financial data into a helpful, natural spoken response in ${language}.
    ${instructions}
    
    Data:
    ${JSON.stringify(data, null, 2)}
    
    Response (Text only, no markdown):
    `;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "Error generating advice.";
    } catch (e) {
        console.error("Advice Gen Error", e);
        return "Sorry, I could not generate advice right now.";
    }
}
