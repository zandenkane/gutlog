/**
 * Parses free text meal descriptions into normalized food tags.
 * Uses a curated keyword dictionary and plain string matching.
 * Returns both specific tags ("cheese") and category tags ("dairy").
 */

interface FoodMapping {
  tag: string;
  category: string;
  aliases: string[];
}

const FOOD_DICTIONARY: FoodMapping[] = [
  // Dairy
  { tag: 'milk', category: 'dairy', aliases: ['milk', 'whole milk', 'skim milk', '2% milk'] },
  { tag: 'cheese', category: 'dairy', aliases: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'brie', 'gouda', 'swiss', 'feta', 'ricotta', 'cream cheese'] },
  { tag: 'yogurt', category: 'dairy', aliases: ['yogurt', 'yoghurt', 'greek yogurt'] },
  { tag: 'butter', category: 'dairy', aliases: ['butter'] },
  { tag: 'cream', category: 'dairy', aliases: ['cream', 'heavy cream', 'sour cream', 'whipped cream'] },
  { tag: 'ice cream', category: 'dairy', aliases: ['ice cream', 'icecream', 'gelato'] },

  // Gluten / grains
  { tag: 'bread', category: 'gluten', aliases: ['bread', 'toast', 'sourdough', 'baguette', 'ciabatta', 'rye bread'] },
  { tag: 'pasta', category: 'gluten', aliases: ['pasta', 'spaghetti', 'penne', 'linguine', 'fettuccine', 'macaroni', 'noodle', 'noodles', 'lasagna'] },
  { tag: 'wheat', category: 'gluten', aliases: ['wheat', 'flour', 'whole wheat'] },
  { tag: 'cereal', category: 'gluten', aliases: ['cereal', 'granola', 'oatmeal', 'oats', 'porridge'] },
  { tag: 'pizza', category: 'gluten', aliases: ['pizza'] },
  { tag: 'crackers', category: 'gluten', aliases: ['crackers', 'cracker', 'pretzels', 'pretzel'] },
  { tag: 'rice', category: 'grains', aliases: ['rice', 'brown rice', 'white rice', 'fried rice', 'risotto'] },
  { tag: 'corn', category: 'grains', aliases: ['corn', 'cornmeal', 'polenta', 'tortilla', 'tortillas'] },

  // Nuts and seeds
  { tag: 'peanuts', category: 'nuts', aliases: ['peanut', 'peanuts', 'peanut butter'] },
  { tag: 'almonds', category: 'nuts', aliases: ['almond', 'almonds', 'almond butter', 'almond milk'] },
  { tag: 'cashews', category: 'nuts', aliases: ['cashew', 'cashews'] },
  { tag: 'walnuts', category: 'nuts', aliases: ['walnut', 'walnuts'] },
  { tag: 'pecans', category: 'nuts', aliases: ['pecan', 'pecans'] },
  { tag: 'pistachios', category: 'nuts', aliases: ['pistachio', 'pistachios'] },
  { tag: 'seeds', category: 'nuts', aliases: ['sunflower seeds', 'pumpkin seeds', 'sesame', 'chia', 'flax', 'flaxseed'] },

  // Nightshades
  { tag: 'tomato', category: 'nightshades', aliases: ['tomato', 'tomatoes', 'tomato sauce', 'marinara', 'ketchup', 'salsa'] },
  { tag: 'pepper', category: 'nightshades', aliases: ['pepper', 'peppers', 'bell pepper', 'bell peppers', 'jalapeno', 'chili', 'chili pepper', 'capsicum'] },
  { tag: 'potato', category: 'nightshades', aliases: ['potato', 'potatoes', 'fries', 'french fries', 'hash browns', 'tater tots'] },
  { tag: 'eggplant', category: 'nightshades', aliases: ['eggplant', 'aubergine'] },

  // Eggs
  { tag: 'eggs', category: 'eggs', aliases: ['egg', 'eggs', 'scrambled eggs', 'fried egg', 'omelette', 'omelet', 'frittata'] },

  // Soy
  { tag: 'soy', category: 'soy', aliases: ['soy', 'soy sauce', 'tofu', 'tempeh', 'edamame', 'soybean', 'soybeans', 'soy milk'] },

  // Seafood
  { tag: 'fish', category: 'seafood', aliases: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'sardine', 'sardines', 'anchovy', 'anchovies', 'sushi', 'sashimi'] },
  { tag: 'shellfish', category: 'seafood', aliases: ['shrimp', 'prawns', 'crab', 'lobster', 'clams', 'mussels', 'oysters', 'scallops', 'shellfish'] },

  // Meat
  { tag: 'chicken', category: 'meat', aliases: ['chicken', 'chicken breast', 'chicken thigh', 'chicken wing', 'chicken wings'] },
  { tag: 'beef', category: 'meat', aliases: ['beef', 'steak', 'hamburger', 'burger', 'ground beef', 'meatball', 'meatballs', 'roast beef'] },
  { tag: 'pork', category: 'meat', aliases: ['pork', 'bacon', 'ham', 'sausage', 'pork chop', 'prosciutto', 'salami', 'pepperoni'] },
  { tag: 'turkey', category: 'meat', aliases: ['turkey'] },
  { tag: 'lamb', category: 'meat', aliases: ['lamb'] },

  // Fruits
  { tag: 'citrus', category: 'fruits', aliases: ['orange', 'oranges', 'lemon', 'lime', 'grapefruit', 'tangerine', 'clementine', 'citrus'] },
  { tag: 'berries', category: 'fruits', aliases: ['strawberry', 'strawberries', 'blueberry', 'blueberries', 'raspberry', 'raspberries', 'blackberry', 'blackberries', 'berries'] },
  { tag: 'banana', category: 'fruits', aliases: ['banana', 'bananas'] },
  { tag: 'apple', category: 'fruits', aliases: ['apple', 'apples', 'applesauce'] },
  { tag: 'avocado', category: 'fruits', aliases: ['avocado', 'guacamole'] },
  { tag: 'grapes', category: 'fruits', aliases: ['grape', 'grapes', 'raisins'] },
  { tag: 'mango', category: 'fruits', aliases: ['mango'] },
  { tag: 'pineapple', category: 'fruits', aliases: ['pineapple'] },
  { tag: 'melon', category: 'fruits', aliases: ['melon', 'watermelon', 'cantaloupe', 'honeydew'] },

  // Vegetables
  { tag: 'onion', category: 'vegetables', aliases: ['onion', 'onions', 'shallot', 'shallots', 'scallion', 'scallions', 'green onion'] },
  { tag: 'garlic', category: 'vegetables', aliases: ['garlic'] },
  { tag: 'broccoli', category: 'vegetables', aliases: ['broccoli'] },
  { tag: 'spinach', category: 'vegetables', aliases: ['spinach'] },
  { tag: 'lettuce', category: 'vegetables', aliases: ['lettuce', 'salad', 'romaine', 'arugula', 'kale'] },
  { tag: 'carrot', category: 'vegetables', aliases: ['carrot', 'carrots'] },
  { tag: 'celery', category: 'vegetables', aliases: ['celery'] },
  { tag: 'mushroom', category: 'vegetables', aliases: ['mushroom', 'mushrooms'] },
  { tag: 'beans', category: 'legumes', aliases: ['beans', 'black beans', 'kidney beans', 'chickpeas', 'hummus', 'lentils', 'lentil'] },
  { tag: 'peas', category: 'legumes', aliases: ['peas', 'green peas', 'snap peas'] },
  { tag: 'cabbage', category: 'vegetables', aliases: ['cabbage', 'coleslaw', 'sauerkraut'] },
  { tag: 'cucumber', category: 'vegetables', aliases: ['cucumber', 'pickles', 'pickle'] },
  { tag: 'cauliflower', category: 'vegetables', aliases: ['cauliflower'] },
  { tag: 'asparagus', category: 'vegetables', aliases: ['asparagus'] },

  // Drinks
  { tag: 'coffee', category: 'caffeine', aliases: ['coffee', 'espresso', 'latte', 'cappuccino'] },
  { tag: 'tea', category: 'caffeine', aliases: ['tea', 'green tea', 'black tea', 'chai'] },
  { tag: 'alcohol', category: 'alcohol', aliases: ['beer', 'wine', 'cocktail', 'vodka', 'whiskey', 'whisky', 'rum', 'gin', 'tequila', 'sake', 'champagne'] },
  { tag: 'soda', category: 'sugar', aliases: ['soda', 'cola', 'coke', 'sprite', 'pop'] },
  { tag: 'juice', category: 'sugar', aliases: ['juice', 'orange juice', 'apple juice'] },

  // Sweeteners and processed
  { tag: 'chocolate', category: 'sugar', aliases: ['chocolate', 'cocoa', 'cacao'] },
  { tag: 'sugar', category: 'sugar', aliases: ['sugar', 'candy', 'sweets', 'syrup', 'honey', 'caramel'] },
  { tag: 'artificial sweetener', category: 'additives', aliases: ['aspartame', 'sucralose', 'stevia', 'splenda', 'diet soda', 'sugar free'] },

  // Condiments and spices
  { tag: 'vinegar', category: 'fermented', aliases: ['vinegar'] },
  { tag: 'fermented foods', category: 'fermented', aliases: ['kimchi', 'kombucha', 'miso', 'fermented'] },
  { tag: 'msg', category: 'additives', aliases: ['msg', 'monosodium glutamate'] },
  { tag: 'soy sauce', category: 'soy', aliases: ['soy sauce'] },

  // Oils
  { tag: 'olive oil', category: 'oils', aliases: ['olive oil'] },
  { tag: 'coconut', category: 'oils', aliases: ['coconut', 'coconut oil', 'coconut milk', 'coconut cream'] },
  { tag: 'canola oil', category: 'oils', aliases: ['canola oil', 'canola'] },
  { tag: 'sesame oil', category: 'oils', aliases: ['sesame oil'] },
  { tag: 'vegetable oil', category: 'oils', aliases: ['vegetable oil'] },

  // Baked goods and sweets
  { tag: 'cake', category: 'sugar', aliases: ['cake', 'cupcake', 'brownie', 'brownies'] },
  { tag: 'cookie', category: 'sugar', aliases: ['cookie', 'cookies', 'biscuit', 'biscuits'] },
  { tag: 'donut', category: 'sugar', aliases: ['donut', 'donuts', 'doughnut', 'doughnuts'] },
  { tag: 'pastry', category: 'sugar', aliases: ['pastry', 'croissant', 'muffin', 'scone', 'danish'] },
  { tag: 'pie', category: 'sugar', aliases: ['pie'] },

  // Processed foods
  { tag: 'hot dog', category: 'processed', aliases: ['hot dog', 'hotdog'] },
  { tag: 'deli meat', category: 'processed', aliases: ['deli meat', 'bologna', 'pastrami', 'corned beef'] },
  { tag: 'frozen meal', category: 'processed', aliases: ['frozen meal', 'frozen dinner', 'tv dinner'] },
  { tag: 'chips', category: 'processed', aliases: ['chips', 'potato chips', 'doritos', 'cheetos'] },
  { tag: 'popcorn', category: 'grains', aliases: ['popcorn'] },

  // High FODMAP / common triggers
  { tag: 'dried fruit', category: 'fruits', aliases: ['dried fruit', 'dates', 'prunes', 'dried apricots', 'dried mango'] },
  { tag: 'high fructose corn syrup', category: 'additives', aliases: ['high fructose corn syrup', 'hfcs'] },
  { tag: 'protein powder', category: 'supplements', aliases: ['protein powder', 'whey', 'whey protein', 'casein'] },
  { tag: 'fiber supplement', category: 'supplements', aliases: ['fiber supplement', 'psyllium', 'metamucil'] },
  { tag: 'probiotic', category: 'supplements', aliases: ['probiotic', 'probiotics'] },
];

/** Build lookup map: alias -> { tag, category } */
const aliasMap = new Map<string, { tag: string; category: string }>();
for (const entry of FOOD_DICTIONARY) {
  for (const alias of entry.aliases) {
    aliasMap.set(alias.toLowerCase(), { tag: entry.tag, category: entry.category });
  }
}

/** All known multiword aliases sorted longest first for greedy matching. */
const multiWordAliases = Array.from(aliasMap.keys())
  .filter(a => a.includes(' '))
  .sort((a, b) => b.length - a.length);

export interface ParseResult {
  tags: string[];
  categories: string[];
}

/**
 * Parse a free text meal description into food tags and categories.
 * Returns deduplicated arrays of specific tags and category tags.
 */
export function parseFoods(description: string): ParseResult {
  const tags = new Set<string>();
  const categories = new Set<string>();

  // Normalize: lowercase, strip nonalphanumeric except spaces
  let text = description.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Match multiword aliases first (greedy, longest first)
  for (const alias of multiWordAliases) {
    if (text.includes(alias)) {
      const match = aliasMap.get(alias)!;
      tags.add(match.tag);
      categories.add(match.category);
      // Remove matched text to avoid partial rematching
      text = text.replace(new RegExp(escapeRegex(alias), 'g'), ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // Split remaining text into single words and match
  const words = text.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    const match = aliasMap.get(word);
    if (match) {
      tags.add(match.tag);
      categories.add(match.category);
      continue;
    }
    // Try depluralization (strip trailing 's' or 'es')
    if (word.endsWith('es') && word.length > 3) {
      const singularEs = aliasMap.get(word.slice(0, -2));
      if (singularEs) {
        tags.add(singularEs.tag);
        categories.add(singularEs.category);
        continue;
      }
    }
    if (word.endsWith('s') && word.length > 3) {
      const singularS = aliasMap.get(word.slice(0, -1));
      if (singularS) {
        tags.add(singularS.tag);
        categories.add(singularS.category);
      }
    }
  }

  return {
    tags: Array.from(tags).sort(),
    categories: Array.from(categories).sort(),
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Return the full list of categories in the food dictionary. */
export function getCategories(): string[] {
  const cats = new Set<string>();
  for (const entry of FOOD_DICTIONARY) {
    cats.add(entry.category);
  }
  return Array.from(cats).sort();
}

/** Return the total number of entries in the food dictionary. */
export function getDictionarySize(): number {
  return FOOD_DICTIONARY.length;
}

/** Check whether a specific alias is recognized by the parser. */
export function isKnownAlias(alias: string): boolean {
  return aliasMap.has(alias.toLowerCase());
}
