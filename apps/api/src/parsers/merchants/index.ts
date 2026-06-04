import { ParseInput, ParsedReceipt } from '../types';
import { parseAmazon } from './amazon.parser';
import { parseAsos } from './asos.parser';
import { parseBestBuy } from './bestbuy.parser';
import { parseGap } from './gap.parser';
import { parseNike } from './nike.parser';
import { parseTarget } from './target.parser';
import { parseWalmart } from './walmart.parser';
import { parseGeneric } from './generic.parser';

type MerchantParser = (input: ParseInput) => ParsedReceipt | null;

const PARSERS: { domain: string; parse: MerchantParser }[] = [
  { domain: 'amazon.com', parse: parseAmazon },
  { domain: 'asos.com', parse: parseAsos },
  { domain: 'nike.com', parse: parseNike },
  { domain: 'target.com', parse: parseTarget },
  { domain: 'walmart.com', parse: parseWalmart },
  { domain: 'bestbuy.com', parse: parseBestBuy },
  { domain: 'gap.com', parse: parseGap },
  { domain: 'oldnavy.com', parse: parseGap },
  { domain: 'homedepot.com', parse: parseGeneric },
  { domain: 'costco.com', parse: parseGeneric },
];

export function parseReceipt(input: ParseInput): ParsedReceipt | null {
  const fromLower = input.from.toLowerCase();
  for (const { domain, parse } of PARSERS) {
    if (fromLower.includes(domain)) {
      const result = parse(input);
      if (result) return result;
    }
  }
  return parseGeneric(input);
}

export const SUPPORTED_MERCHANTS = PARSERS.map((p) => p.domain);
