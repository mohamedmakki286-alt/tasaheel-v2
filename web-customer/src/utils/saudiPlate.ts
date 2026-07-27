export const SAUDI_PLATE_LETTERS: Record<string, string> = {
  ا: 'A', أ: 'A', إ: 'A', آ: 'A', ب: 'B', ح: 'J', د: 'D', ر: 'R',
  س: 'S', ص: 'X', ط: 'T', ع: 'E', ق: 'G', ك: 'K', ل: 'L',
  م: 'Z', ن: 'N', ه: 'H', ة: 'H', و: 'U', ى: 'V', ي: 'V',
};

export const toEnglishPlateLetters = (letters: string) =>
  [...letters].map((letter) => SAUDI_PLATE_LETTERS[letter]).filter(Boolean).join(' ');

export const toArabicPlateDigits = (digits: string) =>
  [...digits].map((digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)] || digit).join(' ');
