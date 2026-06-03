import { describe, it, expect } from 'vitest';
import {
  fisherExact,
  logFactorial,
  logGamma,
  calculateOddsRatio,
  oddsRatioCI,
  significanceLabel,
} from '../src/stats';

describe('logGamma', () => {
  it('computes logGamma(1) = 0 (since Gamma(1) = 1)', () => {
    expect(logGamma(1)).toBeCloseTo(0, 6);
  });

  it('computes logGamma(0.5) = ln(sqrt(pi))', () => {
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 5);
  });

  it('computes logGamma(6) = ln(120)', () => {
    // Gamma(6) = 5! = 120
    expect(logGamma(6)).toBeCloseTo(Math.log(120), 5);
  });
});

describe('logFactorial', () => {
  it('returns 0 for 0 and 1', () => {
    expect(logFactorial(0)).toBe(0);
    expect(logFactorial(1)).toBe(0);
  });

  it('computes ln(5!) correctly', () => {
    // 5! = 120, ln(120) ~ 4.7875
    expect(logFactorial(5)).toBeCloseTo(Math.log(120), 6);
  });

  it('computes ln(10!) correctly', () => {
    // 10! = 3628800
    expect(logFactorial(10)).toBeCloseTo(Math.log(3628800), 5);
  });

  it('computes ln(20!) without overflow', () => {
    // 20! = 2432902008176640000
    const expected = Math.log(2432902008176640000);
    expect(logFactorial(20)).toBeCloseTo(expected, 3);
  });

  it('returns 0 for negative input', () => {
    expect(logFactorial(-5)).toBe(0);
  });
});

describe('fisherExact', () => {
  it('returns p value for the lady tasting tea table [[3,1],[1,3]]', () => {
    // Classic reference: two tailed p ~ 0.4857
    const result = fisherExact(3, 1, 1, 3);
    expect(result.pValue).toBeCloseTo(0.4857, 2);
  });

  it('returns p=1 for a perfectly balanced table', () => {
    const result = fisherExact(5, 5, 5, 5);
    expect(result.pValue).toBeCloseTo(1.0, 1);
  });

  it('returns very low p value for a strong association', () => {
    // Strong association: all food days have symptoms, no non food days do
    const result = fisherExact(10, 0, 0, 10);
    expect(result.pValue).toBeLessThan(0.001);
  });

  it('handles a known 2x2 table [[1,9],[11,3]]', () => {
    // Reference: two tailed p ~ 0.0014
    const result = fisherExact(1, 9, 11, 3);
    expect(result.pValue).toBeCloseTo(0.0014, 2);
  });

  it('handles zero cells with Haldane correction for odds ratio', () => {
    const result = fisherExact(5, 0, 2, 8);
    expect(result.oddsRatio).toBeGreaterThan(1);
    expect(Number.isFinite(result.oddsRatio)).toBe(true);
  });

  it('returns p value between 0 and 1', () => {
    const result = fisherExact(8, 2, 1, 9);
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
  });

  it('handles large cell counts without crashing', () => {
    const result = fisherExact(50, 50, 50, 50);
    expect(result.pValue).toBeCloseTo(1.0, 1);
    expect(result.oddsRatio).toBeCloseTo(1.0, 1);
  });
});

describe('calculateOddsRatio', () => {
  it('returns correct odds ratio for non zero cells', () => {
    // OR = (4*6) / (2*3) = 4.0
    expect(calculateOddsRatio(4, 2, 3, 6)).toBeCloseTo(4.0, 5);
  });

  it('applies Haldane correction when b=0', () => {
    const or = calculateOddsRatio(5, 0, 3, 7);
    expect(Number.isFinite(or)).toBe(true);
    expect(or).toBeGreaterThan(1);
  });

  it('applies Haldane correction when c=0', () => {
    const or = calculateOddsRatio(5, 3, 0, 7);
    expect(Number.isFinite(or)).toBe(true);
    expect(or).toBeGreaterThan(1);
  });

  it('returns 1.0 for a balanced table', () => {
    expect(calculateOddsRatio(5, 5, 5, 5)).toBeCloseTo(1.0, 5);
  });

  it('returns value less than 1 for inverse association', () => {
    // OR = (1*1) / (9*9) = 1/81
    expect(calculateOddsRatio(1, 9, 9, 1)).toBeCloseTo(1 / 81, 5);
  });
});

describe('oddsRatioCI', () => {
  it('returns a confidence interval that contains the odds ratio', () => {
    const ci = oddsRatioCI(10, 5, 3, 12);
    const or = calculateOddsRatio(10, 5, 3, 12);
    expect(ci.lower).toBeLessThan(or);
    expect(ci.upper).toBeGreaterThan(or);
  });

  it('returns wider interval for small sample sizes', () => {
    const ciSmall = oddsRatioCI(2, 1, 1, 2);
    const ciLarge = oddsRatioCI(20, 10, 10, 20);
    const widthSmall = ciSmall.upper - ciSmall.lower;
    const widthLarge = ciLarge.upper - ciLarge.lower;
    expect(widthSmall).toBeGreaterThan(widthLarge);
  });

  it('handles zero cells gracefully', () => {
    const ci = oddsRatioCI(5, 0, 0, 10);
    expect(Number.isFinite(ci.lower)).toBe(true);
    expect(ci.lower).toBeGreaterThan(0);
    expect(ci.upper).toBeGreaterThan(ci.lower);
  });

  it('returns finite bounds for a balanced table', () => {
    const ci = oddsRatioCI(10, 10, 10, 10);
    expect(Number.isFinite(ci.lower)).toBe(true);
    expect(Number.isFinite(ci.upper)).toBe(true);
    // CI should bracket 1.0
    expect(ci.lower).toBeLessThan(1);
    expect(ci.upper).toBeGreaterThan(1);
  });
});

describe('significanceLabel', () => {
  it('returns "very strong" for p < 0.001', () => {
    expect(significanceLabel(0.0005)).toBe('very strong');
  });

  it('returns "strong" for p between 0.001 and 0.01', () => {
    expect(significanceLabel(0.005)).toBe('strong');
  });

  it('returns "moderate" for p between 0.01 and 0.05', () => {
    expect(significanceLabel(0.03)).toBe('moderate');
  });

  it('returns "weak" for p between 0.05 and 0.1', () => {
    expect(significanceLabel(0.07)).toBe('weak');
  });

  it('returns "not significant" for p >= 0.1', () => {
    expect(significanceLabel(0.5)).toBe('not significant');
  });
});
