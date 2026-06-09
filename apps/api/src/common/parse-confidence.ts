/** Human-readable explanation for parse-review confidence scores. */
export function explainParseConfidence(
  confidence: number,
  merchantGuess: string | null,
): string {
  const pct = Math.round(confidence * 100);
  const store = merchantGuess ? `${merchantGuess} sender` : 'shopping mail patterns';

  if (pct >= 80) {
    return `High confidence (${pct}%) — strong return/refund keywords and ${store}.`;
  }
  if (pct >= 50) {
    return `Medium confidence (${pct}%) — looks like a return receipt but some details were unclear. Please verify.`;
  }
  return `Low confidence (${pct}%) — weak return signals. Dismiss if this is marketing or a newsletter.`;
}
