# Supplement Tracking Implementation - Chapter 15

## Overview
Implemented the new 5-table supplement ontology as specified in the whitepaper Chapter 15. The system now enforces data integrity by preventing free-text supplement logging and instead using a normalized database schema.

## Database Schema (5 Tables)

### 1. `substances` - The Abstract Parent
- Examples: "Magnesium", "Caffeine", "Vitamin D"
- Target for Examine.com import

### 2. `compounds` - The Specific Chemical Form
- Examples: "Magnesium L-Threonate", "Magnesium Glycinate"
- Links to a parent substance
- Solves the "Magnesium vs Magnesium L-Threonate" problem

### 3. `vendors` - The Manufacturer
- Examples: "Thorne Research", "Nootropics Depot"
- Can be created on-the-fly during product creation

### 4. `products` - The "Bottle"
- Links a compound to a vendor
- Contains critical normalization data:
  - `unit_dosage`: e.g., 144
  - `unit_measure`: e.g., "mg"
  - `form_factor`: e.g., "capsule"
  - `default_intake_form`: e.g., "sublingual" or "oral"
- Example: "Thorne Magtein 144mg capsules (oral)"
- Note: Intake form affects bioavailability and dosing

### 5. `supplement_logs` - The Event
- User action: "I took 2 capsules at 9 PM"
- `calculated_dosage_mg` is auto-calculated by database trigger
- Formula: dosage_amount × product.unit_dosage (converted to mg)

## Key Features Implemented

### Job 1: Add New Product (3-Step Wizard)
**Component:** `AddProductWizard.tsx`

**Step 1 - Find Compound:**
- Search compounds table (pre-populated with common supplements)
- Type "magnesium" → Select "Magnesium L-Threonate"

**Step 2 - Find/Create Vendor:**
- Search vendors table
- Can create new vendor on-the-fly if not found

**Step 3 - Product Details:**
- Name on bottle (e.g., "Magtein")
- Form factor (capsule, tablet, powder, etc.)
- **Default intake method** (oral, sublingual, etc.) - Pre-fills quick log modal
- Dosage per unit (e.g., 144 mg per capsule)

> **Why intake form is on product:** Different intake methods have different bioavailability. For example, sublingual B12 is absorbed differently than oral B12 and typically requires different dosing.

**Backend:** Uses `add_new_product()` RPC function for atomic operation

### Job 2: High-Speed 3-Tap Logging
**Components:** `SupplementLogger.tsx` + `QuickLogModal.tsx`

**"My Cabinet" Widget:**
- Shows all products as clickable buttons
- Displays: Product name + Vendor

**Quick Log Flow:**
1. Tap product button → Modal opens
2. Set dosage amount (defaults to 1)
3. Tap "Log Now" → Done!

**Auto-calculated:** Database trigger calculates `calculated_dosage_mg` automatically

### Job 3: View Logs
**Components:** `SupplementHistory.tsx` + `TodaysLog.tsx`

**Today's Log Widget:**
- Real-time view of today's supplements
- Shows: Time, Product, Dosage, Total mg

**History View:**
- Paginated log history
- Shows: Product, Vendor, Compound, Dosage, Normalized mg
- Search/filter by product name

## Components Created

1. **`add-product-wizard.tsx`** - Multi-step product creation wizard
2. **`quick-log-modal.tsx`** - Fast 3-tap logging interface
3. **`todays-log.tsx`** - Today's supplement log widget
4. **Updated:** `supplement-logger.tsx` - Now shows "My Cabinet" for quick access
5. **Updated:** `supplement-history.tsx` - Uses new schema with rich compound data
6. **Updated:** `supplement-stats.tsx` - Adherence tracking with new schema
7. **Updated:** `cabinet/page.tsx` - Product management with new schema

## Database Functions

### `add_new_product()` RPC
```sql
-- Atomic operation that:
-- 1. Finds or creates vendor
-- 2. Creates product linking compound + vendor
-- 3. Returns the new product
```

### `calculate_normalized_dosage()` Trigger
```sql
-- Automatically runs on INSERT/UPDATE of supplement_logs
-- Calculates: dosage_amount × unit_dosage
-- Handles unit conversion: g → mg, mcg → mg
```

## Seeded Data

The database is pre-populated with:

**15 Common Substances:**
- Magnesium, Vitamin D, Omega-3, Zinc, Vitamin C
- Caffeine, L-Theanine, Creatine, B12, Iron
- Calcium, Ashwagandha, Rhodiola, CoQ10, Curcumin

**40+ Common Compounds:**
- Multiple forms per substance (e.g., Magnesium L-Threonate, Magnesium Glycinate, etc.)

**12 Common Vendors:**
- Thorne Research, Nootropics Depot, Life Extension, NOW Foods, etc.

## User Flow Examples

### Adding First Product:
1. Navigate to Cabinet → "Add New Supplement"
2. Search "magnesium" → Select "Magnesium L-Threonate"
3. Search "thorne" → Select "Thorne Research"
4. Enter "Magtein", select "capsule", enter "144 mg"
5. Save → Product added to cabinet

### Logging Daily Supplement:
1. Dashboard → See "My Cabinet" with product buttons
2. Tap "Magtein" button
3. Modal shows: Dosage [2] capsules, Intake [Oral], Time [now]
4. Tap "Log Now" → Entry created with auto-calculated 288mg total

### Viewing Impact:
- **Today's Log:** Shows "9:41 PM - Magtein (2 capsules, 288 mg)"
- **History:** Filterable log with full compound information
- **Stats:** Adherence tracking and streak counting

## Data Integrity Benefits

✅ **No more "magnesium" text entries** - Only structured compound references
✅ **Vendor tracking** - Know which brand you're taking
✅ **Automatic dosage calculation** - Database handles mg normalization
✅ **Research-ready data** - Can run real analysis on specific compounds
✅ **Global research potential** - Can aggregate "Magnesium L-Threonate" effects across all users

## Migration Path

Old tables renamed to `OLD_*` prefix:
- `OLD_supplement_logs`
- `OLD_supplement_products`
- `OLD_supplement_components`
- `OLD_product_component_link`

Data is preserved but not migrated. Users will need to re-add products using the new wizard.

## Technical Notes

### Modal Implementation
All modals use React Portals (`createPortal`) to render at `document.body` level, ensuring:
- Proper z-index stacking (z-[9999])
- No CSS conflicts with parent containers
- Dark backdrop (bg-black/80) with blur effect
- Click-outside-to-close functionality
- Prevent body scroll while open

### Intake Form Integration
- Added `default_intake_form` column to `products` table
- Quick Log Modal pre-fills intake method from product specification
- User can still override for specific logs if needed
- Important for substances where route matters (e.g., sublingual vs oral B12)

## Next Steps

1. **Optional:** Create data migration script to port old data to new schema
2. **Future:** Integrate Examine.com API to auto-populate substance data
3. **Future:** Add PsychonautWiki API integration for nootropics data
4. **Future:** Implement Supplement Intelligence Engine for impact analysis
