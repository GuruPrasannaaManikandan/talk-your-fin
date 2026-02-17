
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env manually since we are running outside Vite
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.config({ path: envPath });

const apiKey = process.env.VITE_LLM_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in .env");
    process.exit(1);
}

console.log(`🔑 Checking models for API Key: ${apiKey.substring(0, 10)}...`);

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            return;
        }

        const data = await response.json();
        console.log("\n✅ AVAILABLE MODELS:");
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("No models found in response.");
            console.log(data);
        }
    } catch (error) {
        console.error("❌ Network Error:", error);
    }
}

listModels();
