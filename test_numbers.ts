import { parseSpokenNumber } from './src/lib/numberUtils';

const tests = [
    { text: "five thousand", lang: "en-US", expected: 5000 },
    { text: "5000", lang: "en-US", expected: 5000 },
    { text: "one lakh", lang: "en-US", expected: 100000 },
    { text: "selavu aindhu aayiram", lang: "ta-IN", expected: 5000 },
    { text: "kharcha paanch hazaar", lang: "hi-IN", expected: 5000 },
    { text: "expense 500", lang: "en-US", expected: 500 },
    { text: "income 1.5 lakh", lang: "en-US", expected: 150000 },
];

tests.forEach(t => {
    const result = parseSpokenNumber(t.text, t.lang as any);
    console.log(`Input: "${t.text}" (${t.lang}) -> Parsed: ${result} | Expected: ${t.expected} | Pass: ${result === t.expected}`);
});
