# THE GOLDEN OAK — KITCHEN PHYSICAL CALIPER MEASUREMENT TEMPLATE (PHASE 7.1)

**Task 3 Deliverable:** Physical Scale Validation Protocol & Kitchen Sign-Off Sheet  
**Status:** All 23 dishes currently keep `scaleValidated: false` and `dimensionSource: 'estimated-typical-portion'` until physical kitchen measurements are recorded below.

---

## 1. Measurement Protocol & Tools Required

1. **Tools:**
   - Digital Vernier Caliper (`0–300 mm`, `±0.1 mm` accuracy) or stainless steel culinary metric ruler.
   - Flat horizontal dining table surface with level reference.
   - Overhead & `45°` camera with X-Rite ColorChecker / metric ruler in frame.
2. **Dimensions to Record per Plated Dish:**
   - **Plate / Vessel Outer Diameter (`cm`)**: Outer rim-to-rim diameter (or major width for oval platters).
   - **Plated Dish Width (`X cm`)**: Left-to-right outer span of the served dish/vessel.
   - **Plated Dish Length / Depth (`Z cm`)**: Front-to-back outer span of the served dish/vessel.
   - **Total Plated Height (`Y cm`)**: Vertical height from the table surface (`Y = 0`) to the highest food topping/garnish peak.
3. **Rule for Flipping `scaleValidated: true`:**
   - Only update a dish entry in `src/data/dish-dimensions.ts` to `dimensionSource: 'caliper-measured'` and `scaleValidated: true` after all four physical caliper fields and a reference photo filename are recorded and verified within `±5%` of the 3D bounding box.

---

## 2. 23-Dish Kitchen Physical Measurement Recording Sheet

| # | Canonical Dish Slug | Est. Plate Dia. | Est. Width (X) | Est. Length (Z) | Est. Height (Y) | Measured Plate Dia. | Measured Width (X) | Measured Length (Z) | Measured Height (Y) | Reference Photo Verified | Current Code Status |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | `tandoori-paneer-pizza` | 30 cm | 30 cm | 30 cm | 3.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 2 | `chicken-tikka-pizza` | 30 cm | 30 cm | 30 cm | 3.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 3 | `mushroom-truffle-pizza` | 30 cm | 30 cm | 30 cm | 3.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 4 | `peri-peri-fiesta-pizza` | 30 cm | 30 cm | 30 cm | 3.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 5 | `bbq-chicken-overload` | 30 cm | 30 cm | 30 cm | 3.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 6 | `classic-smash-burger` | 18 cm | 12 cm | 12 cm | 9.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 7 | `golden-oak-signature-burger` | 18 cm | 12.5 cm | 12.5 cm | 10.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 8 | `crispy-paneer-burger` | 18 cm | 12 cm | 12 cm | 10 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 9 | `wok-tossed-chow-mein` | 18 cm | 18 cm | 18 cm | 8 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 10 | `dynamite-chilli-potatoes` | 20 cm | 20 cm | 20 cm | 5.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 11 | `keema-masala-pizza` | 30 cm | 30 cm | 30 cm | 3.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 12 | `farmhouse-supreme-pizza` | 30 cm | 30 cm | 30 cm | 3.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 13 | `paneer-royale-burger` | 18 cm | 12 cm | 12 cm | 10 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 14 | `truffle-mushroom-cheese-burger` | 18 cm | 12 cm | 12 cm | 10 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 15 | `hakka-street-chow-mein` | 18 cm | 18 cm | 18 cm | 8 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 16 | `golden-chilli-potato` | 20 cm | 20 cm | 20 cm | 5.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 17 | `truffle-mushroom-risotto` | 19 cm | 19 cm | 19 cm | 7 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 18 | `butter-chicken-bao` | 18 cm | 18 cm | 18 cm | 7 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 19 | `dahi-ke-kebab` | 22 cm | 22 cm | 16 cm | 4.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 20 | `crispy-chilli-babycorn` | 20 cm | 20 cm | 20 cm | 5.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 21 | `dim-sum-platter` | 22 cm | 21 cm | 21 cm | 6 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 22 | `kaffir-lime-mocktail` | 8.5 cm | 8 cm | 8 cm | 16 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
| 23 | `golden-oak-burger` | 18 cm | 12.5 cm | 12.5 cm | 10.5 cm | `___._ cm` | `___._ cm` | `___._ cm` | `___._ cm` | `[ ] Pending` | `scaleValidated: false` |
