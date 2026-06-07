"""
Comprehensive seed script for female (and unisex) clothing database.

Strategy:
 - Delete all previous seed_* entries from DB
 - Collect all 32 images from the female folder
 - Spread them across ALL 16 occasion × style combos (4–5 each)
 - Same image CAN appear in multiple combos (different occasion/style)
 - Also add selected items as Unisex
 - Use real, descriptive names based on image appearance context
"""

import os
import sys
import shutil
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pathlib import Path
from database import SessionLocal, ClothingItem
from config import settings

SOURCE = Path(r"c:\Users\ASUS\Documents\Final Sem\kiosk-app-build\female")

# ─────────────────────────────────────────────
# Curated names + descriptions for all 32 images
# (named by source subfolder → filename)
# ─────────────────────────────────────────────
IMAGE_METADATA = {
    # Business / classic  (img_00002 – img_00005)
    "Business/classic/img_00002_ (1).png": {
        "name": "Structured Blazer Dress",
        "description": "A tailored single-breasted blazer dress in neutral tones, perfect for boardroom confidence.",
        "price": "₹3,499"
    },
    "Business/classic/img_00003_.png": {
        "name": "Pleated Office Skirt Set",
        "description": "Crisp white blouse paired with a high-waisted pleated midi skirt — effortlessly professional.",
        "price": "₹2,999"
    },
    "Business/classic/img_00004_.png": {
        "name": "Pencil Skirt Ensemble",
        "description": "A form-fitted pencil skirt with a tucked satin blouse for a polished business silhouette.",
        "price": "₹2,799"
    },
    "Business/classic/img_00005_.png": {
        "name": "Classic Trouser Suit",
        "description": "Straight-leg trousers with a structured jacket in timeless charcoal — power dressing defined.",
        "price": "₹3,999"
    },
    # Business / Minimal  (img_00006 – img_00009)
    "Business/Minimal/img_00006_.png": {
        "name": "Minimal Column Dress",
        "description": "A sleek column dress in ivory with clean lines — understated luxury for the modern professional.",
        "price": "₹2,599"
    },
    "Business/Minimal/img_00007_.png": {
        "name": "Monochrome Shift Dress",
        "description": "A minimalist shift dress with subtle structured shoulders — simplicity at its finest.",
        "price": "₹2,299"
    },
    "Business/Minimal/img_00008_.png": {
        "name": "Clean-Cut Midi Dress",
        "description": "An understated midi dress in muted sage with a wrap-style neckline for a refined look.",
        "price": "₹2,499"
    },
    "Business/Minimal/img_00009_.png": {
        "name": "Tone-on-Tone Co-ord Set",
        "description": "Matching slim-cut pants and a tucked-in blouse in soft beige — effortless minimalist chic.",
        "price": "₹3,199"
    },
    # Casual / Bohemian  (img_00010 – img_00014)
    "casuls/bohemian/img_00010_.png": {
        "name": "Floral Wrap Maxi Dress",
        "description": "A breezy floral maxi with a deep V-wrap — perfect for weekend brunches and breezy afternoons.",
        "price": "₹1,799"
    },
    "casuls/bohemian/img_00011_ (1).png": {
        "name": "Tiered Boho Sundress",
        "description": "Layered ruffle tiers in earthy terracotta — casual and free-spirited with a folk-art charm.",
        "price": "₹1,599"
    },
    "casuls/bohemian/img_00012_.png": {
        "name": "Embroidered Peasant Blouse",
        "description": "Hand-inspired embroidered details on a flowy off-shoulder blouse — boho done effortlessly.",
        "price": "₹1,499"
    },
    "casuls/bohemian/img_00013_.png": {
        "name": "Printed Midi Skirt Set",
        "description": "A relaxed fit printed top with a swishy midi skirt in earth tones — weekend wanderlust vibes.",
        "price": "₹1,699"
    },
    "casuls/bohemian/img_00014_.png": {
        "name": "Crochet Detail Summer Dress",
        "description": "Lightweight cotton with crochet lace trim for a boho beach or festival look.",
        "price": "₹1,899"
    },
    # Casual / Modern  (img_00015 – img_00024)
    "casuls/modern/img_00015_.png": {
        "name": "High-Waist Wide Leg Set",
        "description": "Wide-leg trousers paired with a cropped top in coordinated neutrals — effortless street-style.",
        "price": "₹1,899"
    },
    "casuls/modern/img_00016_.png": {
        "name": "Oversized Knit Co-ord",
        "description": "A matching oversized ribbed knit set in mocha — cozy chic for a relaxed modern look.",
        "price": "₹2,199"
    },
    "casuls/modern/img_00017_ (1).png": {
        "name": "Asymmetric Hem Mini Dress",
        "description": "A bold asymmetric hem mini in solid color — modern edge for the city girl.",
        "price": "₹1,699"
    },
    "casuls/modern/img_00018_.png": {
        "name": "Cargo Jogger Co-ord Set",
        "description": "Utility-inspired cargo joggers with a matching boxy crop — sporty meets fashion-forward.",
        "price": "₹1,799"
    },
    "casuls/modern/img_00019_.png": {
        "name": "Linen Shirt Dress",
        "description": "A relaxed linen shirt dress with rolled sleeves — easy, breezy modern casual.",
        "price": "₹1,499"
    },
    "casuls/modern/img_00020_.png": {
        "name": "Contrast Stitch Denim Set",
        "description": "Denim wide-leg pants with contrast stitching and a matching jacket — bold street style.",
        "price": "₹2,399"
    },
    "casuls/modern/img_00021_.png": {
        "name": "Satin Slip Midi Dress",
        "description": "A fluid satin slip dress in dusty rose — transition easily from day to dinner.",
        "price": "₹1,999"
    },
    "casuls/modern/img_00022_.png": {
        "name": "Ribbed Tank & Track Pant",
        "description": "Minimalist ribbed tank top with matching track pants in tonal grey — modern athleisure.",
        "price": "₹1,599"
    },
    "casuls/modern/img_00023_.png": {
        "name": "Puff Sleeve Midi Dress",
        "description": "A solid-color midi dress with statement puff sleeves — casual cool with a fashion twist.",
        "price": "₹1,799"
    },
    "casuls/modern/img_00024_.png": {
        "name": "Cut-Out Detail Bodysuit Set",
        "description": "A sleek bodysuit with subtle cut-out details paired with high-rise trousers — modern and bold.",
        "price": "₹2,099"
    },
    # Date  (img_00025 – img_00029)
    "date/img_00025_.png": {
        "name": "Velvet Wrap Evening Dress",
        "description": "A rich velvet wrap dress in deep burgundy — intimate and sophisticated for date nights.",
        "price": "₹3,299"
    },
    "date/img_00026_.png": {
        "name": "Off-Shoulder Ruffle Dress",
        "description": "An off-shoulder dress with cascading ruffles — romantic and feminine for candlelit dinners.",
        "price": "₹2,999"
    },
    "date/img_00027_.png": {
        "name": "Floral Wrap Mini Dress",
        "description": "A charming floral wrap mini — flirty and playful for a casual first date.",
        "price": "₹2,199"
    },
    "date/img_00028_.png": {
        "name": "Slit Slip Satin Dress",
        "description": "An elegant satin slip dress with a thigh-high slit — understated glamour for dinner dates.",
        "price": "₹3,499"
    },
    "date/img_00029_.png": {
        "name": "Lace Trim Bodycon Dress",
        "description": "A delicate lace-trimmed bodycon in blush — effortlessly pretty for romantic evenings.",
        "price": "₹2,699"
    },
    # Party  (img_00030 – img_00033)
    "party/img_00030_.png": {
        "name": "Sequin Mini Dress",
        "description": "A head-turning full-sequin mini — pure sparkle for parties and celebrations.",
        "price": "₹3,999"
    },
    "party/img_00031_.png": {
        "name": "Metallic Bodycon Dress",
        "description": "A figure-hugging metallic dress that catches the light — made for the dance floor.",
        "price": "₹3,499"
    },
    "party/img_00032_ (1).png": {
        "name": "Cutout Halter Party Dress",
        "description": "A bold halter neck with strategic cutouts — edgy and fashion-forward for night events.",
        "price": "₹3,199"
    },
    "party/img_00033_.png": {
        "name": "Ruched Satin Party Dress",
        "description": "Side-ruched satin in electric cobalt — glamorous and statement-making for any party.",
        "price": "₹2,999"
    },
}

# ─────────────────────────────────────────────
# Assignment plan: ALL 16 combos, 4-5 images each
# Images are referenced by their relative key above
# Same image key can appear in multiple combos
# ─────────────────────────────────────────────
BC = list(IMAGE_METADATA.keys())[0:4]    # Business/classic
BM = list(IMAGE_METADATA.keys())[4:8]    # Business/Minimal
CB = list(IMAGE_METADATA.keys())[8:13]   # casuls/bohemian
CM = list(IMAGE_METADATA.keys())[13:23]  # casuls/modern
DT = list(IMAGE_METADATA.keys())[23:28]  # date
PT = list(IMAGE_METADATA.keys())[28:32]  # party

COMBO_PLAN = [
    # (occasion, style, gender, [image_keys])
    ("business", "classic",    "Female", BC + [BM[0]]),
    ("business", "minimalist", "Female", BM + [BC[0]]),
    ("business", "modern",     "Female", CM[0:4] + [BM[0]]),
    ("business", "bohemian",   "Female", CB[0:4] + [DT[0]]),
    ("casual",   "classic",    "Female", BC[0:4] + [CM[0]]),
    ("casual",   "modern",     "Female", CM[0:5]),
    ("casual",   "minimalist", "Female", CM[5:9] + [BM[0]]),
    ("casual",   "bohemian",   "Female", CB[0:5]),
    ("party",    "modern",     "Female", PT + [CM[0]]),
    ("party",    "classic",    "Female", PT + [BC[0]]),
    ("party",    "minimalist", "Female", PT + [BM[0]]),
    ("party",    "bohemian",   "Female", PT + [CB[0]]),
    ("date",     "classic",    "Female", DT),
    ("date",     "modern",     "Female", DT[0:4] + [CM[0]]),
    ("date",     "minimalist", "Female", DT[0:4] + [BM[0]]),
    ("date",     "bohemian",   "Female", DT[0:4] + [CB[0]]),
    # Unisex — casual and party modern items
    ("casual",   "modern",     "Unisex", CM[5:10]),
    ("casual",   "minimalist", "Unisex", CM[0:4] + [BM[1]]),
    ("party",    "modern",     "Unisex", PT + [CM[1]]),
    ("casual",   "bohemian",   "Unisex", CB[1:5] + [CM[0]]),
]

def main():
    db = SessionLocal()

    # ── Step 1: Remove all previous seed_* entries
    old_seeds = db.query(ClothingItem).filter(
        ClothingItem.garment_image.like("%seed_%")
    ).all()
    deleted_paths = set()
    for item in old_seeds:
        # Track files to delete
        if item.garment_image.startswith("/api/clothing/images/"):
            fname = item.garment_image.split("/")[-1]
            deleted_paths.add(settings.GARMENTS_DIR / fname)
        if item.preview_image.startswith("/api/clothing/images/"):
            fname = item.preview_image.split("/")[-1]
            deleted_paths.add(settings.GARMENTS_DIR / fname)
        db.delete(item)
    db.commit()
    # Clean up old seed files from disk
    for p in deleted_paths:
        if p.exists():
            p.unlink()
    print(f"Removed {len(old_seeds)} old seed entries from DB.")

    # ── Step 2: Cache — copy each unique source image once → new filename
    img_to_url: dict[str, str] = {}  # image_key → /api/clothing/images/xxx.png

    def get_or_copy(img_key: str) -> str:
        if img_key in img_to_url:
            return img_to_url[img_key]
        src = SOURCE / img_key
        if not src.exists():
            print(f"  [WARN] Not found: {src}")
            return ""
        ext = src.suffix
        new_fname = f"seed_{uuid.uuid4().hex[:10]}{ext}"
        dest = settings.GARMENTS_DIR / new_fname
        shutil.copy2(src, dest)
        url = f"/api/clothing/images/{new_fname}"
        img_to_url[img_key] = url
        return url

    # ── Step 3: Insert all combos
    inserted = 0
    for (occasion, style, gender, img_keys) in COMBO_PLAN:
        for img_key in img_keys:
            url = get_or_copy(img_key)
            if not url:
                continue
            meta = IMAGE_METADATA.get(img_key, {})
            item = ClothingItem(
                name=meta.get("name", "Stylish Dress"),
                category="dress",
                occasion=occasion,
                style=style,
                gender=gender,
                garment_image=url,
                preview_image=url,
                description=meta.get("description", ""),
                price=meta.get("price", "₹1,999"),
            )
            db.add(item)
            inserted += 1

    db.commit()
    db.close()

    print(f"Inserted {inserted} items across {len(COMBO_PLAN)} combos.")
    print(f"Unique images copied to storage: {len(img_to_url)}")

    # ── Summary table
    from collections import Counter
    print("\n--- Combo coverage ---")
    combo_counts = Counter()
    for (occ, sty, gen, keys) in COMBO_PLAN:
        combo_counts[(occ, sty, gen)] += len(keys)
    for (occ, sty, gen), cnt in sorted(combo_counts.items()):
        print(f"  {gen:8} | {occ:10} / {sty:12} → {cnt} items")

if __name__ == "__main__":
    main()
