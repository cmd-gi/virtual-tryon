import sqlite3
import os

from config import settings

def inspect_db():
    db_path = settings.BASE_DIR / 'database' / 'kiosk.db'
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='clothing_items'")
    if not cursor.fetchone():
        print("table 'clothing_items' not found")
        return
        
    cursor.execute("PRAGMA table_info(clothing_items)")
    columns = cursor.fetchall()
    print("Columns in clothing_items:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
        
    cursor.execute("SELECT category FROM clothing_items GROUP BY category")
    categories = cursor.fetchall()
    print("\nExisting categories:")
    for cat in categories:
        print(f"  {cat[0]}")

    conn.close()

if __name__ == "__main__":
    inspect_db()
