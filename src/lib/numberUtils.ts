import { Language } from './languages';

const NUMBER_MAPPINGS: Record<Language, Record<string, number>> = {
    'en-US': {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
        'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
        'hundred': 100, 'thousand': 1000, 'million': 1000000, 'billion': 1000000000,
        'lakh': 100000, 'crore': 10000000,
        'k': 1000, 'm': 1000000,
    },
    'ta-IN': {
        'ondru': 1, 'irandu': 2, 'moondru': 3, 'naangu': 4, 'aindhu': 5,
        'aaru': 6, 'ezhu': 7, 'ettu': 8, 'onbadhu': 9, 'patthu': 10,
        'sath': 100, // Common slang
        'nooru': 100, 'ayiram': 1000, 'aayiram': 1000,
        'latcham': 100000, 'kodi': 10000000,
        'ambathu': 50, 'aiyiram': 5000, 'pathayiram': 10000,
        // Native script
        'நூறு': 100, 'ஆயிரம்': 1000, 'லட்சம்': 100000, 'கோடி': 10000000,
    },
    'hi-IN': {
        'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
        'che': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
        'sau': 100, 'hazaar': 1000, 'lakh': 100000, 'crore': 10000000,
        'pachas': 50, 'bees': 20, 'tis': 30, 'chalis': 40,
        // Native script
        'सौ': 100, 'हजार': 1000, 'लाख': 100000, 'करोड़': 10000000,
    },
    'mar-IN': {
        'ek': 1, 'be': 2, 'tran': 3, 'char': 4, 'paanch': 5,
        'chha': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
        'so': 100, 'hazaar': 1000, 'lakh': 100000, 'crore': 10000000,
    }
};

export function parseSpokenNumber(text: string, language: Language): number | undefined {
    const lowerText = text.toLowerCase();

    // 1. Try to find direct digits first (e.g., "500")
    const digitMatch = lowerText.match(/(\d+)/);
    if (digitMatch) {
        let val = parseInt(digitMatch[1], 10);
        // Determine context multipliers explicitly mentioned after the digit
        // e.g., "500 aayiram" -> 500 * 1000
        // This is simple looking ahead for multipliers
        const multipliers = NUMBER_MAPPINGS[language] || NUMBER_MAPPINGS['en-US']; // Fallback

        // Check for multipliers in the text
        for (const [word, multiplier] of Object.entries(multipliers)) {
            if (multiplier >= 100 && lowerText.includes(word)) {
                // Avoid double counting if "thousand" is part of "five thousand" vs "5 thousand"
                // But here we are handling "500" digits + "thousand" word
                // Simply return val * multiplier if found? 
                // Better: look for substring after the digit
                if (lowerText.split(digitMatch[1])[1]?.includes(word)) {
                    val *= multiplier;
                    break; // Apply typically largest multiplier found adjacent
                }
            }
        }
        return val;
    }

    // 2. Parse word-based numbers (e.g., "five thousand", "paanch sau")
    // This is a simplified parser that accumulates values
    const mapping = { ...NUMBER_MAPPINGS['en-US'], ...NUMBER_MAPPINGS[language] };
    const words = lowerText.split(/\s+/);

    let total = 0;
    let currentSubTotal = 0;

    for (const word of words) {
        const val = mapping[word];
        if (val !== undefined) {
            if (val >= 100) {
                // It's a multiplier
                if (currentSubTotal === 0) currentSubTotal = 1;
                currentSubTotal *= val;
                // In some languages/phrasings, multipliers accumulate differently, but this covers basic "five thousand"
                if (val >= 1000) {
                    total += currentSubTotal;
                    currentSubTotal = 0;
                }
            } else {
                currentSubTotal += val;
            }
        }
    }

    // Explicitly handle "zero" or "nil" or "null" if needed, though digit match catches "0"
    if (lowerText.includes('zero') || lowerText.includes('pujyam') || lowerText.includes('shunya')) {
        return 0;
    }

    return (total + currentSubTotal) >= 0 ? (total + currentSubTotal) : undefined;
}
