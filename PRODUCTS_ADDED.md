# HP GLOW Products Migration

This document lists all products that have been added to the database.

## Products Added

### ✨ Tirzepatide (with variations)
- **15mg** - ₱2,499
- **20mg** - ₱2,899  
- **30mg** - ₱3,499

**Description:** Tirzepatide is a dual GIP/GLP-1 receptor agonist. Research-grade peptide for metabolic studies.

---

### ✨ GHK-CU 100mg - ₱1,850
**Description:** GHK-Cu (Copper Peptide) is a copper peptide complex with regenerative properties. Known for its potential in tissue repair, wound healing, and anti-aging research applications.

---

### ✨ NAD+ 500mg - ₱2,499
**Description:** Nicotinamide Adenine Dinucleotide (NAD+) is a coenzyme essential for cellular energy metabolism. Research-grade for anti-aging and cellular function studies.

---

### ✨ Semax 5mg - ₱1,399
**Description:** Semax is a nootropic peptide derived from ACTH that enhances cognitive function, memory, and provides neuroprotective effects in research studies.

---

### ✨ Selank 5mg - ₱1,499
**Description:** Selank is a synthetic peptide analog of tuftsin with nootropic and anxiolytic properties. Research-grade peptide for cognitive enhancement studies.

---

### ✨ Glutathione 1500mg - ₱1,499
**Description:** Glutathione is a powerful antioxidant peptide that supports cellular health and detoxification. Research-grade quality for antioxidant and cellular protection studies.

---

### ✨ Lemon Bottle 10ml - ₱1,299
**Description:** Lemon Bottle fat-dissolving injection solution. Professional-grade cosmetic solution for research purposes.

---

### ✨ PT-141 - ₱1,699
**Description:** PT-141 (Bremelanotide) is a synthetic peptide that acts as a melanocortin receptor agonist. Research-grade peptide for behavioral and physiological studies.

---

### ✨ Kisspeptin 5mg - ₱1,499
**Description:** Kisspeptin is a neuropeptide that plays a crucial role in reproductive function and hormone regulation. Research-grade peptide for endocrine and reproductive studies.

---

## Supplies & Accessories

### ✨ Terumo 30g x 3/8 Syringe - ₱14 per piece
**Description:** Professional medical-grade syringe. Terumo 30 gauge, 3/8 inch needle. Single-use, sterile packaging.

### ✨ Sungshim 31g x 8mm Syringe - ₱10 per piece
**Description:** Professional medical-grade syringe. Sungshim 31 gauge, 8mm needle. Single-use, sterile packaging.

---

## Product Categories

- **Research Peptides** - Tirzepatide, PT-141, Kisspeptin
- **Cosmetic & Skincare** - GHK-CU, Lemon Bottle
- **Wellness & Support** - NAD+, Semax, Selank, Glutathione
- **Supplies & Accessories** - Syringes

---

## Migration File

The migration file is located at:
`supabase/migrations/20250118000000_add_hpglow_products.sql`

## How to Apply

1. **Via Supabase Dashboard:**
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy and paste the contents of the migration file
   - Click "Run"

2. **Via Supabase CLI:**
   ```bash
   supabase db reset
   # or
   supabase migration up
   ```

## Notes

- All products are set to `available: true` and `featured: true` (except syringes)
- Stock quantities are set to 100 for peptides and 500 for syringes
- All products include detailed descriptions, molecular weights, CAS numbers, and storage conditions
- Tirzepatide is set up with product variations for the three different strengths
- The migration also updates site settings to "HP GLOW" and "Luxury Elegance"

