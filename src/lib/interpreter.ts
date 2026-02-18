
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
                console.error(`❌ Model ${model} FAILED: Status ${response.status}`);
                console.error(`Response Body: ${errorText}`);
                continue;
            }

            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) {
                console.warn(`⚠️ Model ${model} returned empty text. Full Response:`, data);
                continue;
            }

            console.log(`✅ Model ${model} Raw Response:`, rawText);

            // Robust JSON cleaning
            let jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            // Sometimes models return text before/after JSON, try to extract just the JSON object
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            try {
                const result = JSON.parse(jsonStr) as CommandResult;
                return result;
            } catch (parseError) {
                console.error(`❌ JSON Parse Error for model ${model}:`, parseError);
                console.error(`Failed JSON String:`, jsonStr);
                continue; // Try next model if parsing fails
            }

        } catch (error) {
            console.error(`❌ EXCEPTION with model ${model}:`, error);
            lastError = error;
            // continue loop
        }
    }

    // If we get here, all models failed
    console.error("All models failed. Last error:", lastError);
    throw lastError || new Error("Failed to connect to any Gemini model. Please check your API Key.");
}

export async function getFinancialAdvice(data: any, languageCode: string): Promise<string> {
    const apiKey = import.meta.env.VITE_LLM_API_KEY;

    // Fallback if key missing (though app should block earlier)
    if (!apiKey) return "API Key missing.";

    const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-flash-latest"
    ];

    const isSimulation = data.type === 'loan_simulation';

    // Get full language name
    const { SUPPORTED_LANGUAGES } = await import('./languages');
    const langLabel = SUPPORTED_LANGUAGES.find(l => l.code === languageCode)?.label || 'English';

    let instructions = "Keep it short (1-2 sentences).";
    if (isSimulation) {
        instructions = `
        You are a financial advisor talking directly to the user.
        The user has selected ${langLabel} as their language.
        
        TASK:
        Generate a spoken response in ${langLabel} (using ${langLabel} script/characters, NOT transliteration).
        Do NOT say "Report generated". Speak the actual report details immediately.
        
        CONTENT TO COVER:
        1. Start immediately with the new EMI amount. (e.g., "Your new EMI is...").
        2. Compare 'Before' vs 'After' for Debt-to-Income Ratio and Health Score. (e.g., "DTI increases from X to Y").
        3. Mention the Risk Level (${data.risk}).
        4. Read any specific warnings.
        
        Tone: Professional, helpful, and clear.
        Length: Around 4-5 sentences.
        `;
    }

    const prompt = `
    Input Data:
    ${JSON.stringify(data, null, 2)}
    
    Instructions:
    ${instructions}
    
    Generate the spoken response text only (no markdown, no bullets, just the text to speak).
    `;

    let lastError: any = null;

    for (const model of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            console.log(`Attempting Advice Gen with model: ${model}`);
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Model ${model} FAILED: Status ${response.status}`);
                console.error(`Response Body: ${errorText}`);
                continue; // Try next model
            }

            const json = await response.json();
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                console.warn(`⚠️ Model ${model} returned empty text. Full JSON:`, json);
                continue; // Try next model
            }

            return text;

        } catch (e) {
            console.error(`❌ EXCEPTION with model ${model}:`, e);
            // continue loop
        }
    }

    // All models failed. Throw the last error to be caught by the UI.
    const lastErrorMsg = lastError?.message || "All models failed to respond.";
    throw new Error(lastErrorMsg);
}
