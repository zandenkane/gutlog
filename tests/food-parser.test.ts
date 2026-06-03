import { describe, it, expect } from 'vitest';
import { parseFoods, getCategories, getDictionarySize, isKnownAlias } from '../src/food-parser';

describe('parseFoods', () => {
  it('extracts single known food', () => {
    const result = parseFoods('I had some chicken');
    expect(result.tags).toContain('chicken');
    expect(result.categories).toContain('meat');
  });

  it('extracts multiple foods from a sentence', () => {
    const result = parseFoods('scrambled eggs with toast and coffee');
    expect(result.tags).toContain('eggs');
    expect(result.tags).toContain('bread');
    expect(result.tags).toContain('coffee');
    expect(result.categories).toContain('eggs');
    expect(result.categories).toContain('gluten');
    expect(result.categories).toContain('caffeine');
  });

  it('handles aliases (cheddar maps to cheese + dairy)', () => {
    const result = parseFoods('cheddar and crackers');
    expect(result.tags).toContain('cheese');
    expect(result.categories).toContain('dairy');
    expect(result.tags).toContain('crackers');
  });

  it('handles multiword aliases', () => {
    const result = parseFoods('I ate peanut butter on toast');
    expect(result.tags).toContain('peanuts');
    expect(result.categories).toContain('nuts');
    expect(result.tags).toContain('bread');
  });

  it('normalizes input (case, punctuation)', () => {
    const result = parseFoods('PIZZA, BEER, and Chocolate!!!');
    expect(result.tags).toContain('pizza');
    expect(result.tags).toContain('alcohol');
    expect(result.tags).toContain('chocolate');
  });

  it('deduplicates tags', () => {
    const result = parseFoods('cheese cheese cheese');
    const cheeseCount = result.tags.filter(t => t === 'cheese').length;
    expect(cheeseCount).toBe(1);
  });

  it('returns empty arrays for unrecognized text', () => {
    const result = parseFoods('something completely unknown xyz');
    expect(result.tags).toHaveLength(0);
    expect(result.categories).toHaveLength(0);
  });

  it('returns empty arrays for empty input', () => {
    const result = parseFoods('');
    expect(result.tags).toHaveLength(0);
    expect(result.categories).toHaveLength(0);
  });

  it('handles depluralization', () => {
    const result = parseFoods('bananas and apples');
    expect(result.tags).toContain('banana');
    expect(result.tags).toContain('apple');
  });

  it('returns sorted tags', () => {
    const result = parseFoods('wine, salmon, rice, avocado');
    const sorted = [...result.tags].sort();
    expect(result.tags).toEqual(sorted);
  });

  it('maps dairy related foods to the dairy category', () => {
    const result = parseFoods('milk yogurt butter');
    expect(result.categories).toContain('dairy');
    expect(result.tags).toContain('milk');
    expect(result.tags).toContain('yogurt');
    expect(result.tags).toContain('butter');
  });

  it('maps nightshade foods to the nightshades category', () => {
    const result = parseFoods('tomato sauce with eggplant');
    expect(result.categories).toContain('nightshades');
    expect(result.tags).toContain('tomato');
    expect(result.tags).toContain('eggplant');
  });

  it('parses processed food entries', () => {
    const result = parseFoods('hot dog with chips and soda');
    expect(result.tags).toContain('hot dog');
    expect(result.tags).toContain('chips');
    expect(result.tags).toContain('soda');
    expect(result.categories).toContain('processed');
    expect(result.categories).toContain('sugar');
  });

  it('parses baked goods', () => {
    const result = parseFoods('brownie with cookies and a croissant');
    expect(result.tags).toContain('cake');
    expect(result.tags).toContain('cookie');
    expect(result.tags).toContain('pastry');
  });

  it('parses oil types', () => {
    const result = parseFoods('cooked in canola oil and sesame oil');
    expect(result.tags).toContain('canola oil');
    expect(result.tags).toContain('sesame oil');
    expect(result.categories).toContain('oils');
  });

  it('parses supplement entries', () => {
    const result = parseFoods('took whey protein and a probiotic');
    expect(result.tags).toContain('protein powder');
    expect(result.tags).toContain('probiotic');
    expect(result.categories).toContain('supplements');
  });

  it('handles complex real world meal descriptions', () => {
    const result = parseFoods('chicken burrito with sour cream, salsa, cheese, rice, and black beans');
    expect(result.tags).toContain('chicken');
    expect(result.tags).toContain('cream');
    expect(result.tags).toContain('tomato');
    expect(result.tags).toContain('cheese');
    expect(result.tags).toContain('rice');
    expect(result.tags).toContain('beans');
  });

  it('detects fermented foods', () => {
    const result = parseFoods('had some kimchi and kombucha');
    expect(result.tags).toContain('fermented foods');
    expect(result.categories).toContain('fermented');
  });

  it('detects caffeine sources', () => {
    const result = parseFoods('espresso and green tea');
    expect(result.tags).toContain('coffee');
    expect(result.tags).toContain('tea');
    expect(result.categories).toContain('caffeine');
  });

  it('detects legumes', () => {
    const result = parseFoods('hummus with lentil soup');
    expect(result.tags).toContain('beans');
    expect(result.categories).toContain('legumes');
  });

  it('handles soy products', () => {
    const result = parseFoods('tofu stir fry with edamame and soy sauce');
    expect(result.tags).toContain('soy');
    expect(result.tags).toContain('soy sauce');
    expect(result.categories).toContain('soy');
  });
});

describe('getCategories', () => {
  it('returns a sorted array of unique categories', () => {
    const cats = getCategories();
    expect(cats.length).toBeGreaterThan(10);
    const sorted = [...cats].sort();
    expect(cats).toEqual(sorted);
    expect(cats).toContain('dairy');
    expect(cats).toContain('gluten');
    expect(cats).toContain('nuts');
    expect(cats).toContain('nightshades');
    expect(cats).toContain('supplements');
    expect(cats).toContain('processed');
  });
});

describe('getDictionarySize', () => {
  it('returns the total number of food entries', () => {
    const size = getDictionarySize();
    expect(size).toBeGreaterThan(80);
  });
});

describe('isKnownAlias', () => {
  it('returns true for known aliases', () => {
    expect(isKnownAlias('cheese')).toBe(true);
    expect(isKnownAlias('CHEDDAR')).toBe(true);
    expect(isKnownAlias('peanut butter')).toBe(true);
  });

  it('returns false for unknown strings', () => {
    expect(isKnownAlias('xyznonexistent')).toBe(false);
    expect(isKnownAlias('')).toBe(false);
  });
});
