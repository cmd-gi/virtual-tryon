"""
Comprehensive seed script for MALE (and Unisex) clothing database.

Strategy:
 - ONLY removes old male seed_male_* entries (leaves female untouched)
 - Copies all 28 male images to storage/garments/
 - Spreads across ALL 16 occasion x style combos (4-5 each) as Male
 - Adds selected items as Unisex across key combos
 - garment_image AND preview_image are both always set to the same valid URL
"""

import os
import sys
import shutil
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pathlib import Path
from database import SessionLocal, ClothingItem
from config import settings

SOURCE = Path(r"c:\Users\ASUS\Documents\Final Sem\kiosk-app-build\male")

# ─────────────────────────────────────────────
# Curated metadata for all 28 male images
# Key format: relative path inside SOURCE dir
# ─────────────────────────────────────────────
IMAGE_METADATA = {
    # Business / Classic (clasiics) — 4 images
    "Busineess/clasiics/img_00036_.png": {
        "name": "Classic Two-Piece Suit",
        "description": "A sharp two-piece suit in charcoal grey with subtle pinstripes — boardroom authority.",
        "price": "₹5,999"
    },
    "Busineess/clasiics/img_00038_.png": {
        "name": "Oxford Button-Down & Trousers",
        "description": "Crisp white Oxford shirt tucked into slim flat-front trousers — timeless office elegance.",
        "price": "₹3,499"
    },
    "Busineess/clasiics/img_00039_.png": {
        "name": "Navy Blazer Ensemble",
        "description": "A classic navy blazer over a light blue shirt with khaki chinos — smart casual authority.",
        "price": "₹4,299"
    },
    "Busineess/clasiics/img_00040_.png": {
        "name": "Formal Waistcoat Set",
        "description": "A three-piece waistcoat suit in deep charcoal — distinguished and powerful for formal occasions.",
        "price": "₹6,499"
    },
    # Business / Modern — 4 images
    "Busineess/modern/img_00041_.png": {
        "name": "Slim Fit Turtleneck Suit",
        "description": "A modern slim-fit suit paired with a black turtleneck — sleek sophistication without a tie.",
        "price": "₹5,499"
    },
    "Busineess/modern/img_00043_.png": {
        "name": "Contemporary Linen Blazer",
        "description": "An unstructured linen blazer in sand beige — modern, breathable, and effortlessly stylish.",
        "price": "₹3,999"
    },
    "Busineess/modern/img_00045_.png": {
        "name": "Monochrome Business Set",
        "description": "Head-to-toe tonal dressing in muted olive — a modern minimalist take on business attire.",
        "price": "₹4,499"
    },
    "Busineess/modern/img_00046_.png": {
        "name": "Tailored Jogger Suit",
        "description": "Elevated jogger pants with a matching structured jacket — the new-era business casual.",
        "price": "₹3,799"
    },
    # Casual / Classic — 6 images
    "casules/classics/img_00047_.png": {
        "name": "Chino & Polo Set",
        "description": "Classic slim chinos paired with a cotton polo — preppy weekend style done right.",
        "price": "₹2,499"
    },
    "casules/classics/img_00048_.png": {
        "name": "Slim Jeans & Oxford Shirt",
        "description": "Dark slim-fit jeans with an untucked Oxford shirt — effortlessly classic casual.",
        "price": "₹2,199"
    },
    "casules/classics/img_00049_.png": {
        "name": "Crew Neck Sweater & Chinos",
        "description": "A ribbed crew neck sweater over chinos in neutral tones — classic, comfortable, and put-together.",
        "price": "₹2,699"
    },
    "casules/classics/img_00050_.png": {
        "name": "Heritage Denim & Tee",
        "description": "Raw-hem straight denim with a classic white tee — the timeless casual combination.",
        "price": "₹1,999"
    },
    "casules/classics/img_00051_.png": {
        "name": "Corduroy Jacket Set",
        "description": "A tan corduroy jacket with straight trousers — textured, warm, and effortlessly classic.",
        "price": "₹3,299"
    },
    "casules/classics/img_00052_.png": {
        "name": "Henley & Straight Leg Jeans",
        "description": "A long-sleeve henley in burgundy with classic straight-leg jeans — relaxed weekend vibes.",
        "price": "₹1,899"
    },
    # Casual / Mixed (root casules folder) — 3 images
    "casules/img_00053_.png": {
        "name": "Oversized Hoodie & Joggers",
        "description": "A heavyweight oversized hoodie with matching joggers in slate grey — ultimate comfort.",
        "price": "₹2,299"
    },
    "casules/img_00054_.png": {
        "name": "Linen Shirt & Shorts Set",
        "description": "Relaxed linen shirt with matching shorts in cream — breezy summer casual.",
        "price": "₹1,799"
    },
    "casules/img_00055_.png": {
        "name": "Graphic Tee & Wide Leg Pants",
        "description": "A statement graphic tee with wide-leg trousers in natural cotton — artsy street style.",
        "price": "₹1,999"
    },
    # Date — 6 images
    "dates/img_00057_.png": {
        "name": "Smart Casual Date Look",
        "description": "A fitted dark shirt with slim trousers — understated and effortlessly attractive for date nights.",
        "price": "₹3,199"
    },
    "dates/img_00058_.png": {
        "name": "Roll-Neck & Tailored Trousers",
        "description": "A slim roll-neck in camel paired with tailored trousers — refined and romantic.",
        "price": "₹2,999"
    },
    "dates/img_00059_.png": {
        "name": "Linen Resort Shirt Set",
        "description": "An open-collar linen resort shirt with white trousers — relaxed sophistication for a dinner date.",
        "price": "₹2,699"
    },
    "dates/img_00060_.png": {
        "name": "Dark Wash Jeans & Blazer",
        "description": "Dark wash jeans with a clean blazer and plain tee — the perfect smart-casual date formula.",
        "price": "₹3,499"
    },
    "dates/img_00062_.png": {
        "name": "Suede Jacket & Black Jeans",
        "description": "A slim suede-look jacket over black jeans — moody, confident, and distinctly romantic.",
        "price": "₹3,999"
    },
    "dates/img_00063_.png": {
        "name": "Floral Print Shirt & Chinos",
        "description": "A subtle floral-print shirt with off-white chinos — playful yet sophisticated for casual dates.",
        "price": "₹2,399"
    },
    # Party — 5 images
    "party/img_00064_.png": {
        "name": "Metallic Bomber Jacket",
        "description": "A statement metallic bomber over black — eye-catching, bold, and made for the night out.",
        "price": "₹4,499"
    },
    "party/img_00065_.png": {
        "name": "Printed Satin Party Shirt",
        "description": "A richly printed satin shirt in jewel tones — luxurious and distinctive at any celebration.",
        "price": "₹2,999"
    },
    "party/img_00066_.png": {
        "name": "All-Black Evening Set",
        "description": "Head-to-toe black with a structured jacket — classic party power dressing for men.",
        "price": "₹3,799"
    },
    "party/img_00067_.png": {
        "name": "Sequin Blazer & Trousers",
        "description": "A subtle sequin-flecked blazer with slim black trousers — sparkling statement for formal parties.",
        "price": "₹5,299"
    },
    "party/img_00069_.png": {
        "name": "Velvet Dinner Jacket",
        "description": "A deep midnight velvet dinner jacket — debonair and luxurious for black-tie events.",
        "price": "₹6,499"
    },
}

# ─────────────────────────────────────────────
# Named image groups for combo assignment
# ─────────────────────────────────────────────
keys = list(IMAGE_METADATA.keys())
BC  = keys[0:4]    # Business/Classic
BM  = keys[4:8]    # Business/Modern
CC  = keys[8:14]   # Casual/Classic
CM  = keys[14:17]  # Casual/Mixed (hoodie, linen, graphic)
DT  = keys[17:23]  # Date
PT  = keys[23:28]  # Party

# ─────────────────────────────────────────────
# 16 Female-equivalent combos → Male
# + key Unisex combos
# Each row: (occasion, style, gender, [img_keys])
# ─────────────────────────────────────────────
COMBO_PLAN = [
    # ── Male combos ──────────────────────────────────────
    ("business", "classic",    "Male", BC + [BM[0]]),
    ("business", "modern",     "Male", BM + [BC[0]]),
    ("business", "minimalist", "Male", BM[0:3] + BC[0:2]),
    ("business", "bohemian",   "Male", CC[0:3] + DT[0:2]),

    ("casual",   "classic",    "Male", CC[0:5]),
    ("casual",   "modern",     "Male", CM + CC[0:2]),
    ("casual",   "minimalist", "Male", CM + CC[3:5] + [BM[0]]),
    ("casual",   "bohemian",   "Male", CC[1:5] + [CM[0]]),

    ("party",    "modern",     "Male", PT + [CM[0]]),
    ("party",    "classic",    "Male", PT[0:4] + [BC[0]]),
    ("party",    "minimalist", "Male", PT[0:4] + [BM[0]]),
    ("party",    "bohemian",   "Male", PT[0:4] + [CC[0]]),

    ("date",     "classic",    "Male", DT[0:5]),
    ("date",     "modern",     "Male", DT + [CM[0]]),
    ("date",     "minimalist", "Male", DT[0:4] + [BM[0]]),
    ("date",     "bohemian",   "Male", DT[0:4] + [CC[0]]),

    # ── Unisex combos ─────────────────────────────────────
    ("casual",   "modern",     "Unisex", CM + CC[0:2]),
    ("casual",   "minimalist", "Unisex", BM[0:3] + CM),
    ("party",    "modern",     "Unisex", PT[0:4] + [CM[0]]),
    ("casual",   "classic",    "Unisex", CC[0:5]),
]


def main():
    db = SessionLocal()
    settings.GARMENTS_DIR.mkdir(parents=True, exist_ok=True)

    # ── Step 1: Remove only old male seed entries
    old = db.query(ClothingItem).filter(
        ClothingItem.garment_image.like("%seed_male_%")
    ).all()
    deleted_paths = set()
    for item in old:
        for path_str in [item.garment_image, item.preview_image]:
            if path_str and path_str.startswith("/api/clothing/images/"):
                deleted_paths.add(settings.GARMENTS_DIR / path_str.split("/")[-1])
        db.delete(item)
    db.commit()
    # Clean files
    for p in deleted_paths:
        if p.exists():
            p.unlink()
    print(f"Removed {len(old)} old male seed entries.")

    # ── Step 2: Copy each unique image ONCE
    img_to_url: dict[str, str] = {}

    def get_or_copy(img_key: str) -> str:
        if img_key in img_to_url:
            return img_to_url[img_key]
        src = SOURCE / img_key
        if not src.exists():
            print(f"  [WARN] Not found: {src}")
            return ""
        ext = src.suffix
        new_fname = f"seed_male_{uuid.uuid4().hex[:10]}{ext}"
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
            meta = IMAGE_METADATA.get(img_key, {
                "name": "Stylish Outfit",
                "description": "A carefully curated look.",
                "price": "₹2,499"
            })
            item = ClothingItem(
                name=meta["name"],
                category="outfit",
                occasion=occasion,
                style=style,
                gender=gender,
                garment_image=url,   # both set to same valid URL
                preview_image=url,
                description=meta["description"],
                price=meta["price"],
            )
            db.add(item)
            inserted += 1

    db.commit()
    db.close()

    print(f"Inserted {inserted} male/unisex items across {len(COMBO_PLAN)} combos.")
    print(f"Unique images copied to storage: {len(img_to_url)}")

    # ── Step 4: Verify no missing images
    db2 = SessionLocal()
    issues = db2.query(ClothingItem).filter(
        (ClothingItem.garment_image == None) | (ClothingItem.preview_image == None)
    ).all()
    if issues:
        print(f"[ERROR] {len(issues)} items still have missing image fields!")
        for i in issues:
            print(f"  {i.id} | {i.name} | garment={i.garment_image} | preview={i.preview_image}")
    else:
        print("All items verified — garment_image and preview_image are both filled.")
    db2.close()


if __name__ == "__main__":
    main()
