import os
import shutil
from bs4 import BeautifulSoup

# === CONFIG ===
html_file = "index.html"  # Path to your HTML file
base_dir = ""      # Base directory
media_source = os.path.join(base_dir, "images")
media_target = os.path.join(base_dir, "media")

# === Create target dir if not exists ===
os.makedirs(media_target, exist_ok=True)

# === Parse HTML and extract media paths ===
with open(html_file, "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

# Tags and attributes to check
media_tags = {
    "img": "src",
    "video": "src",
    "audio": "src",
    "source": "src"
}

media_files = []

for tag, attr in media_tags.items():
    for element in soup.find_all(tag):
        path = element.get(attr)
        if path and "images/" in path:
            media_files.append(path)

# Remove duplicates
media_files = list(set(media_files))

print(f"Found {len(media_files)} media files.")

# === Copy files with directory structure ===
for media_path in media_files:
    # Normalize path
    media_path = media_path.lstrip("./")

    src = os.path.join(base_dir, media_path)

    if os.path.isfile(src):
        # Remove everything before 'images/'
        if "images/" in media_path:
            relative_path = media_path.split("images/", 1)[1]
        else:
            relative_path = os.path.basename(media_path)

        dest = os.path.join(media_target, relative_path)

        # Create directories
        os.makedirs(os.path.dirname(dest), exist_ok=True)

        if os.path.abspath(src) != os.path.abspath(dest):
            shutil.copy2(src, dest)
            print(f"Copied: {src} -> {dest}")
        else:
            print(f"Skipped (same file): {src}")
    else:
        print(f"WARNING: File not found: {src}")
