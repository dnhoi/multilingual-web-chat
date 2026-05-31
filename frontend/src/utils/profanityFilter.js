/**
 * Profanity & Keyword Filter Utility
 */
import { getPublicBannedKeywords } from '../features/settings/api/settings.api';

let cachedKeywords = [
  'lừa đảo', 'lua dao', 'hack', '18+', 'dcm', 'dkm', 'đánh bạc', 'danh bac', 'cờ bạc', 'co bac'
];
let isLoaded = false;

export const loadBannedKeywords = async () => {
  if (isLoaded) return cachedKeywords;
  try {
    const res = await getPublicBannedKeywords();
    const rawVal = res?.result?.value || res?.data?.value;
    if (rawVal && typeof rawVal === 'string') {
      const words = rawVal.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
      if (words.length > 0) {
        cachedKeywords = words;
      }
    }
    isLoaded = true;
  } catch (e) {
    console.debug('Using default banned keywords fallback:', e.message);
  }
  return cachedKeywords;
};

export const filterProfanity = (text, customKeywords = null) => {
  if (!text || typeof text !== 'string') return text;
  const list = customKeywords || cachedKeywords;

  let filtered = text;
  for (const word of list) {
    if (!word || word.length < 2) continue;
    // Escape regex special chars
    const escaped = word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b|${escaped}`, 'gi');
    filtered = filtered.replace(regex, (match) => '*'.repeat(match.length));
  }
  return filtered;
};

export const containsBannedKeyword = (text, customKeywords = null) => {
  if (!text || typeof text !== 'string') return false;
  const list = customKeywords || cachedKeywords;
  const lower = text.toLowerCase();
  return list.some(w => w && lower.includes(w.toLowerCase()));
};
