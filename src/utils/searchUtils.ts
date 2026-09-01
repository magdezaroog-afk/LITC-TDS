export const normalizeArabic = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ي/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/گ/g, 'ك')
    .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();
};

export const smartSearch = (query: string, text: string): boolean => {
  if (!query) return true;
  if (!text) return false;
  
  const normalizedQuery = normalizeArabic(query);
  const normalizedText = normalizeArabic(text);

  // Split query into words to allow matching in any order (e.g. "تقنية المعلومات" matches "إدارة تقنية المعلومات")
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  
  // Every word in the query must be found in the text
  return queryWords.every(word => normalizedText.includes(word));
};
