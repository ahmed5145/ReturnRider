const MERCHANT_EMOJI: Record<string, string> = {
  amazon: '📦',
  target: '🎯',
  walmart: '🛒',
  nike: '👟',
  asos: '👗',
  bestbuy: '💻',
  gap: '👕',
  oldnavy: '👕',
  homedepot: '🔨',
  costco: '🏪',
  ebay: '🏷️',
};

export function getMerchantEmoji(merchantName: string): string | null {
  const key = merchantName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (MERCHANT_EMOJI[key]) return MERCHANT_EMOJI[key];
  for (const [name, emoji] of Object.entries(MERCHANT_EMOJI)) {
    if (key.includes(name)) return emoji;
  }
  return null;
}
