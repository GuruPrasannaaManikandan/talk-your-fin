
const https = require('https');
const fs = require('fs');
const path = require('path');

// Basic .env parser since we can't rely on dotenv package being installed globally
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                if (key === 'VITE_LLM_API_KEY') return value;
            }
        }
    } catch (e) {
        return null;
    }
    return null;
}

const apiKey = loadEnv();

if (!apiKey) {
    console.error("❌ No API Key found in .env");
    process.exit(1);
}

console.log(`🔑 Checking models for API Key: ${apiKey.substring(0, 10)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("❌ API Error:", json.error.message);
            } else if (json.models) {
                console.log("\n✅ AVAILABLE MODELS:");
                json.models.forEach(m => {
                    console.log(`- ${m.name}`);
                });
            } else {
                console.log("Response:", json);
            }
        } catch (e) {
            console.error("Failed to parse response:", data);
        }
    });
}).on('error', (e) => {
    console.error("❌ Network Error:", e.message);
});
