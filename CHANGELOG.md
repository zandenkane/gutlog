# Changelog

## 0.1.0 (2026-05-28)

Initial release.

- Meal logging with free text input and automatic food tag extraction
- Symptom logging with preset list, custom entry, and severity slider
- Food parser with dictionary of 91 foods across 20 categories (dairy, gluten, grains, nuts, nightshades, eggs, soy, seafood, meat, fruits, vegetables, legumes, caffeine, alcohol, sugar, fermented, additives, oils, processed, supplements)
- Correlation engine using Fisher's exact test on 2x2 contingency tables
- 95% confidence intervals for odds ratios (Woolf logit method)
- Significance labels (very strong, strong, moderate, weak, not significant)
- Configurable time windows (3h, 6h, 12h, 24h, 48h, 72h)
- Summary dashboard with totals and top foods/symptoms
- History view with chronological entry feed and delete functionality
- Analysis view with ranked food/symptom correlation results
- JSON data export and import with validation
- All data stored locally in IndexedDB via Dexie.js
- PWA support with service worker for offline access
- Mobile first responsive design with automatic dark mode
