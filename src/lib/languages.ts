export type Language = 'en-US' | 'ta-IN' | 'hi-IN' | 'mar-IN';

export const SUPPORTED_LANGUAGES: { code: Language; label: string; voiceCode: string }[] = [
  { code: 'en-US', label: 'English', voiceCode: 'en-US' },
  { code: 'ta-IN', label: 'Tamil', voiceCode: 'ta-IN' },
  { code: 'hi-IN', label: 'Hindi', voiceCode: 'hi-IN' },
  { code: 'mar-IN', label: 'Marwadi', voiceCode: 'hi-IN' }, // Fallback to Hindi for Web Speech API
];

export const KEYWORDS: Record<Language, {
  add_expense: string[];
  add_income: string[];
  check_loan: string[];
  dashboard: string[];
  financial_health: string[];
  edit_transaction: string[];
  delete_transaction: string[];
  reset_data: string[];
}> = {
  'en-US': {
    add_expense: ['add', 'log', 'record', 'spent', 'expense'],
    add_income: ['salary', 'income', 'earning'],
    check_loan: ['loan', 'borrow', 'emi'],
    dashboard: ['dashboard', 'show', 'overview'],
    financial_health: ['health', 'advice', 'financial'],
    edit_transaction: ['change', 'update', 'modify', 'make it', 'correction'],
    delete_transaction: ['delete', 'remove', 'cancel', 'erase'],
    reset_data: ['reset', 'clear', 'wipe', 'delete all', 'start over'],
  },
  'ta-IN': {
    add_expense: ['selavu', 'karchu', 'poodu', 'expense', 'செலவு', 'செலவாச்சு', 'போடு'],
    add_income: ['sambalam', 'varumanam', 'income', 'வருமானம்', 'சம்பளம்', 'காசு'],
    check_loan: ['kadan', 'loan', 'emi', 'கடன்'],
    dashboard: ['dashboard', 'kaattu', 'parvai', 'முகப்பு', 'காட்டு'],
    financial_health: ['nalam', 'alochanai', 'advice', 'நலம்', 'ஆலோசனை'],
    edit_transaction: ['maattru', 'thiruthu', 'change', 'update', 'மாற்று', 'திருத்து'],
    delete_transaction: ['ali', 'neekku', 'delete', 'remove', 'அழி', 'நீக்கு'],
    reset_data: ['reset', 'clear', 'muluvasum ali', 'muthalil irunthu', 'ரீசெட்', 'அழித்துவிடு'],
  },
  'hi-IN': {
    add_expense: ['kharcha', 'vyay', 'lagaya', 'expense', 'खर्चा', 'व्यय', 'लगाया'],
    add_income: ['tankhah', 'aamdani', 'income', 'आमदनी', 'तनख्वाह', 'कमाई'],
    check_loan: ['udhaar', 'loan', 'karz', 'emi', 'लोन', 'उधार', 'कर्ज'],
    dashboard: ['dashboard', 'dikhao', 'overview', 'डैशबोर्ड', 'दिखाओ'],
    financial_health: ['sehat', 'salah', 'advice', 'सेहत', 'सलाह'],
    edit_transaction: ['badlo', 'change', 'theek karo', 'update', 'बदलो', 'ठीक करो'],
    delete_transaction: ['hatao', 'delete', 'nikalo', 'हटाओ', 'निकालो'],
    reset_data: ['reset', 'clear', 'saaf karo', 'sab hatao', 'रीसेट', 'साफ करो'],
  },
  'mar-IN': {
    add_expense: ['kharcho', 'lagayo', 'expense'],
    add_income: ['pagar', 'kamai', 'income'],
    check_loan: ['udhaar', 'loan', 'karz'],
    dashboard: ['dashboard', 'dikhao'],
    financial_health: ['tabiyat', 'salah'],
    edit_transaction: ['badlo', 'change', 'sahi karo'],
    delete_transaction: ['hatao', 'delete'],
    reset_data: ['reset', 'clear', 'saaf karo', 'wipe'],
  }
};

export const RESPONSES: Record<Language, {
  listening: string;
  processing: string;
  success: string;
  error: string;
  unknown: string;
}> = {
  'en-US': {
    listening: 'Listening...',
    processing: 'Processing...',
    success: 'Done.',
    error: 'Sorry, voice recognition failed.',
    unknown: 'I did not understand that command.',
  },
  'ta-IN': {
    listening: 'Kekkirathu...',
    processing: 'Seyalpuduthugirathu...',
    success: 'Mudinthathu.',
    error: 'Mannikkavum, puriyavillai.',
    unknown: 'Kattalai puriyavillai.',
  },
  'hi-IN': {
    listening: 'Sun raha hoon...',
    processing: 'Kaam chal raha hai...',
    success: 'Ho gaya.',
    error: 'Maaf kijiye, samajh nahi aaya.',
    unknown: 'Aadesh samajh nahi aaya.',
  },
  'mar-IN': {
    listening: 'Sunu chu...',
    processing: 'Kaam chalu hai...',
    success: 'Hogyo.',
    error: 'Maaf karjo, samjyo koni.',
    unknown: 'Hukam samjyo koni.',
  }
};
