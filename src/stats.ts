/**
 * Pure math functions for statistical analysis.
 * Fisher's exact test and odds ratio, written from scratch for minimal bundle size.
 */

/** Log gamma function using Lanczos approximation for numerical stability. */
export function logGamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Log of n! using log gamma: ln(n!) = logGamma(n+1). */
export function logFactorial(n: number): number {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 0;
  return logGamma(n + 1);
}

/**
 * Hypergeometric probability for a single cell value in a 2x2 table.
 * P(a | row/col margins fixed) = C(r1,a)*C(r2,c1-a) / C(n,c1)
 */
function hypergeometricProb(a: number, r1: number, r2: number, c1: number, c2: number): number {
  const n = r1 + r2;
  const logP =
    logFactorial(r1) + logFactorial(r2) + logFactorial(c1) + logFactorial(c2) -
    logFactorial(n) - logFactorial(a) - logFactorial(r1 - a) -
    logFactorial(c1 - a) - logFactorial(r2 - c1 + a);
  return Math.exp(logP);
}

export interface FisherResult {
  pValue: number;
  oddsRatio: number;
}

/**
 * Fisher's exact test (two tailed) on a 2x2 contingency table.
 *
 * Table layout:
 *   [[a, b],
 *    [c, d]]
 *
 * Where:
 *   a = food present AND symptom present
 *   b = food present AND symptom absent
 *   c = food absent AND symptom present
 *   d = food absent AND symptom absent
 */
export function fisherExact(a: number, b: number, c: number, d: number): FisherResult {
  const r1 = a + b;
  const r2 = c + d;
  const c1 = a + c;
  const c2 = b + d;

  const pObserved = hypergeometricProb(a, r1, r2, c1, c2);

  // Two tailed: sum probabilities of all tables as or more extreme
  const minA = Math.max(0, c1 - r2);
  const maxA = Math.min(r1, c1);

  let pValue = 0;
  for (let i = minA; i <= maxA; i++) {
    const p = hypergeometricProb(i, r1, r2, c1, c2);
    if (p <= pObserved + 1e-10) {
      pValue += p;
    }
  }

  pValue = Math.min(1, Math.max(0, pValue));

  const oddsRatio = calculateOddsRatio(a, b, c, d);

  return { pValue, oddsRatio };
}

/** Odds ratio with Haldane correction (add 0.5) when any cell is zero. */
export function calculateOddsRatio(a: number, b: number, c: number, d: number): number {
  if (b === 0 || c === 0) {
    return ((a + 0.5) * (d + 0.5)) / ((b + 0.5) * (c + 0.5));
  }
  return (a * d) / (b * c);
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
}

/**
 * Compute the 95% confidence interval for an odds ratio
 * using the Woolf logit method with Haldane correction.
 *
 * Returns the lower and upper bounds. If the odds ratio is
 * not finite, returns { lower: 0, upper: Infinity }.
 */
export function oddsRatioCI(a: number, b: number, c: number, d: number): ConfidenceInterval {
  const ha = a + 0.5;
  const hb = b + 0.5;
  const hc = c + 0.5;
  const hd = d + 0.5;

  const logOR = Math.log((ha * hd) / (hb * hc));
  const se = Math.sqrt(1 / ha + 1 / hb + 1 / hc + 1 / hd);

  // z = 1.96 for 95% confidence
  const z = 1.96;
  const lower = Math.exp(logOR - z * se);
  const upper = Math.exp(logOR + z * se);

  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    return { lower: 0, upper: Infinity };
  }
  return { lower, upper };
}

/**
 * Determine the significance level label for a given p value.
 * Returns a human readable string.
 */
export function significanceLabel(p: number): string {
  if (p < 0.001) return 'very strong';
  if (p < 0.01) return 'strong';
  if (p < 0.05) return 'moderate';
  if (p < 0.1) return 'weak';
  return 'not significant';
}
