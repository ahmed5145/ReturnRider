const MERCHANT_RETURN_URLS: Record<string, string> = {
  amazon: 'https://www.amazon.com/gp/css/order-history',
  target: 'https://www.target.com/account/orders',
  walmart: 'https://www.walmart.com/account/orders',
  bestbuy: 'https://www.bestbuy.com/profile/ss/orders/list',
  nike: 'https://www.nike.com/orders',
  asos: 'https://www.asos.com/account/orders',
  gap: 'https://www.gap.com/my-account/orders',
  oldnavy: 'https://oldnavy.gap.com/my-account/orders',
  homedepot: 'https://www.homedepot.com/myaccount/purchase-history',
  costco: 'https://www.costco.com/OrderStatusCmd',
  ebay: 'https://www.ebay.com/mye/myebay/purchase',
  etsy: 'https://www.etsy.com/your/purchases',
  nordstrom: 'https://www.nordstrom.com/my-account/orders',
  zappos: 'https://www.zappos.com/account/orders',
  kohls: 'https://www.kohls.com/myaccount/kohls_login.jsp',
  macys: 'https://www.macys.com/account/orders',
};

export function getMerchantReturnUrl(merchantName: string): string | null {
  const key = merchantName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (MERCHANT_RETURN_URLS[key]) {
    return MERCHANT_RETURN_URLS[key];
  }
  for (const [name, url] of Object.entries(MERCHANT_RETURN_URLS)) {
    if (key.includes(name) || name.includes(key)) {
      return url;
    }
  }
  return null;
}
