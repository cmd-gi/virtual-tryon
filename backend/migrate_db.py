import sqlite3
import os
from pathlib import Path

# Category to Dino Prompt mapping
CATEGORY_MAPPING = {
    "upper_half_sleeve": "shirt",
    "upper_full_sleeve": "shirt . arms",
    "lower_body": "pants",
    "full_body": "dress",
    "outerwear": "jacket . arms"
}

# Mapping old categories to new rigid categories
OLD_TO_NEW_CATEGORY = {
    "shirt": "upper_half_sleeve",
    "t-shirt": "upper_half_sleeve",
    "top": "upper_half_sleeve",
    "sweater": "upper_full_sleeve",
    "kurta": "upper_full_sleeve",
    "pant": "lower_body",
    "jeans": "lower_body",
    "shorts": "lower_body",
    "trouser": "lower_body",
    "dress": "full_body",
    "saree": "full_body",
    "jacket": "outerwear",
    "coat": "outerwear",
}

def migrate():
    # Define db path explicitly to avoid importing config which might load other modules
    db_path = Path(__file__).parent / "database" / "kiosk.db"
    
    if not db_path.exists():
        print(f"Error: Database file not found at {db_path}")
        return
        
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(clothing_items)")
    columns = [row[1] for row in cursor.fetchall()]
    
    print(f"Existing columns: {columns}")
    
    # 1. Add dino_prompt column
    if "dino_prompt" not in columns:
        print("Adding 'dino_prompt' column...")
        cursor.execute("ALTER TABLE clothing_items ADD COLUMN dino_prompt VARCHAR(100)")
    else:
        print("'dino_prompt' column already exists, skipping.")
        
    # 2. Add garment_description column
    if "garment_description" not in columns:
        print("Adding 'garment_description' column...")
        cursor.execute("ALTER TABLE clothing_items ADD COLUMN garment_description TEXT")
    else:
        print("'garment_description' column already exists, skipping.")
        
    # 3. Update existing records
    cursor.execute("SELECT id, category FROM clothing_items")
    items = cursor.fetchall()
    
    print(f"Reviewing {len(items)} existing items for category updates...")
    
    updated_count = 0
    for item_id, old_category in items:
        # Standardize old category string
        clean_cat = str(old_category).lower().strip()
        
        # Determine new category
        if clean_cat in CATEGORY_MAPPING:
            # Already a valid new category
            new_cat = clean_cat
        else:
            # Try to map it
            new_cat = OLD_TO_NEW_CATEGORY.get(clean_cat, "upper_half_sleeve") # default fallback
            print(f"  Mapping category '{old_category}' -> '{new_cat}' for item {item_id}")
            
        # Get corresponding dino_prompt
        dino_prompt = CATEGORY_MAPPING[new_cat]
        
        # Update row
        cursor.execute(
            "UPDATE clothing_items SET category = ?, dino_prompt = ? WHERE id = ?", 
            (new_cat, dino_prompt, item_id)
        )
        updated_count += 1
        
    conn.commit()
    print(f"Migration completed successfully. Updated {updated_count} items.")
    conn.close()

if __name__ == "__main__":
    migrate()
