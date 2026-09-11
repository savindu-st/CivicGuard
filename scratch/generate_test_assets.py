import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import piexif

def create_synthetic_assets():
    assets_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "ai-service", "test_assets"))
    os.makedirs(assets_dir, exist_ok=True)

    # 1. Deep Flood (submerged road with turbid brown/gray water)
    img_deep = Image.new("RGB", (640, 480), color=(100, 110, 120))
    draw = ImageDraw.Draw(img_deep)
    # Sky / background
    draw.rectangle([(0, 0), (640, 180)], fill=(160, 170, 180))
    # Submerged road / turbid flood water in lower 60%
    draw.rectangle([(0, 180), (640, 480)], fill=(110, 95, 75))
    # Waves / water ripple lines
    for y in range(200, 480, 25):
        draw.line([(0, y), (640, y)], fill=(90, 80, 65), width=3)
    # Vehicle shape partially submerged
    draw.rectangle([(220, 220), (420, 310)], fill=(40, 50, 70))
    draw.ellipse([(240, 290), (280, 330)], fill=(80, 70, 55)) # partially submerged tire
    draw.ellipse([(360, 290), (400, 330)], fill=(80, 70, 55))

    # Add Sri Lanka EXIF GPS: 6.9123 N, 79.8654 E (Colombo 07)
    # 6 deg, 54 min, 44.28 sec
    # 79 deg, 51 min, 55.44 sec
    zeroth_ifd = {
        piexif.ImageIFD.Make: b"CivicGuard Drone",
        piexif.ImageIFD.Model: b"CG-Vision-X1",
    }
    gps_ifd = {
        piexif.GPSIFD.GPSLatitudeRef: b"N",
        piexif.GPSIFD.GPSLatitude: [(6, 1), (54, 1), (4428, 100)],
        piexif.GPSIFD.GPSLongitudeRef: b"E",
        piexif.GPSIFD.GPSLongitude: [(79, 1), (51, 1), (5544, 100)],
    }
    exif_bytes = piexif.dump({"0th": zeroth_ifd, "GPS": gps_ifd})
    deep_path = os.path.join(assets_dir, "sample_flood_deep.jpg")
    img_deep.save(deep_path, "jpeg", exif=exif_bytes)
    print(f"Created {deep_path} with Colombo EXIF GPS")

    # 2. Minor Flood / Puddle
    img_minor = Image.new("RGB", (640, 480), color=(80, 80, 85))
    draw_m = ImageDraw.Draw(img_minor)
    # Dry asphalt road
    draw_m.rectangle([(0, 0), (640, 250)], fill=(120, 130, 140))
    # Small puddle in corner
    draw_m.ellipse([(200, 360), (440, 440)], fill=(100, 95, 80))
    minor_path = os.path.join(assets_dir, "sample_flood_minor.jpg")
    img_minor.save(minor_path, "jpeg")
    print(f"Created {minor_path}")

    # 3. Fallen Tree Obstacle
    img_tree = Image.new("RGB", (640, 480), color=(70, 75, 80))
    draw_t = ImageDraw.Draw(img_tree)
    # Background road
    draw_t.rectangle([(0, 0), (640, 200)], fill=(140, 140, 150))
    # Heavy fallen trunk across street
    draw_t.rectangle([(50, 240), (590, 310)], fill=(90, 60, 30))
    # Foliage cluster
    draw_t.ellipse([(100, 180), (320, 360)], fill=(35, 110, 40))
    draw_t.ellipse([(300, 200), (500, 340)], fill=(45, 125, 45))
    tree_path = os.path.join(assets_dir, "sample_fallen_tree.jpg")
    img_tree.save(tree_path, "jpeg")
    print(f"Created {tree_path}")

    # 4. Spam / Meme / Indoor Screenshot
    img_spam = Image.new("RGB", (400, 400), color=(255, 255, 255))
    draw_s = ImageDraw.Draw(img_spam)
    draw_s.text((40, 180), "NOT A DISASTER - FUNNY MEME", fill=(0, 0, 0))
    draw_s.text((40, 220), "JUST A SCREENSHOT", fill=(0, 0, 0))
    spam_path = os.path.join(assets_dir, "sample_spam_meme.jpg")
    img_spam.save(spam_path, "jpeg")
    print(f"Created {spam_path}")

    # 5. Mismatched Geotag Image (London EXIF: 51.5074 N, 0.1278 W)
    img_foreign = Image.new("RGB", (640, 480), color=(100, 90, 80))
    draw_f = ImageDraw.Draw(img_foreign)
    draw_f.rectangle([(0, 180), (640, 480)], fill=(115, 95, 75))
    gps_foreign = {
        piexif.GPSIFD.GPSLatitudeRef: b"N",
        piexif.GPSIFD.GPSLatitude: [(51, 1), (30, 1), (2664, 100)],
        piexif.GPSIFD.GPSLongitudeRef: b"W",
        piexif.GPSIFD.GPSLongitude: [(0, 1), (7, 1), (4008, 100)],
    }
    foreign_exif = piexif.dump({"GPS": gps_foreign})
    foreign_path = os.path.join(assets_dir, "sample_mismatched_exif.jpg")
    img_foreign.save(foreign_path, "jpeg", exif=foreign_exif)
    print(f"Created {foreign_path} with London EXIF GPS")

if __name__ == "__main__":
    create_synthetic_assets()
