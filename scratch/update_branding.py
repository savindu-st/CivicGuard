import os
import json
from PIL import Image, ImageDraw, ImageFilter

mobile_dir = r'e:\semester 4\Projects\compititions\codearena\codes\mobile app\civicguard_mobileapp'
web_dir = r'e:\semester 4\Projects\compititions\codearena\codes\webapp and backend\CivicGuard\web'

def generate_master_icon(size=2048):
    w, h = size, size
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    
    # 1. Background Squircle / Rounded Rect with Dark Slate Gradient
    pad = int(w * 0.05)
    radius = int(w * 0.22)
    
    mask = Image.new('L', (w, h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([pad, pad, w - pad, h - pad], radius=radius, fill=255)
    
    # Draw dark obsidian navy gradient background
    bg_gradient = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg_gradient)
    for y in range(h):
        ratio = y / h
        r = int(10 * (1 - ratio) + 2 * ratio)
        g = int(22 * (1 - ratio) + 6 * ratio)
        b = int(45 * (1 - ratio) + 16 * ratio)
        bg_draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    
    img.paste(bg_gradient, (0, 0), mask)
    
    # 2. Outer Border / Neon Cyan Rim on Squircle
    border_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_layer)
    border_draw.rounded_rectangle([pad, pad, w - pad, h - pad], radius=radius, outline=(56, 189, 248, 140), width=int(w * 0.018))
    img.alpha_composite(border_layer)
    
    # 3. Ambient Glow behind Shield
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = w / 2, h / 2
    glow_draw.ellipse([cx - w*0.3, cy - h*0.25, cx + w*0.3, cy + h*0.35], fill=(16, 185, 129, 90))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=int(w * 0.09)))
    img.alpha_composite(glow)
    
    # 4. Draw Modern Apex Shield
    top_y = h * 0.18
    mid_y1 = h * 0.30
    mid_y2 = h * 0.60
    bottom_y = h * 0.84
    left_x = w * 0.18
    right_x = w * 0.82
    
    # Left Facet (Dark Obsidian Navy)
    left_poly = [
        (cx, top_y),
        (left_x, mid_y1),
        (left_x + w*0.03, mid_y2),
        (cx, bottom_y),
        (cx, top_y)
    ]
    
    # Right Facet (Deep Indigo Steel)
    right_poly = [
        (cx, top_y),
        (right_x, mid_y1),
        (right_x - w*0.03, mid_y2),
        (cx, bottom_y),
        (cx, top_y)
    ]
    
    # Left Facet fill
    left_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    left_draw = ImageDraw.Draw(left_layer)
    left_draw.polygon(left_poly, fill=(15, 35, 60, 245))
    img.alpha_composite(left_layer)
    
    # Right Facet fill
    right_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    right_draw = ImageDraw.Draw(right_layer)
    right_draw.polygon(right_poly, fill=(28, 60, 115, 245))
    img.alpha_composite(right_layer)
    
    # Centerline crease
    line_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    line_draw = ImageDraw.Draw(line_layer)
    line_draw.line([(cx, top_y), (cx, bottom_y)], fill=(56, 189, 248, 180), width=int(w * 0.008))
    img.alpha_composite(line_layer)
    
    # Shield Border (Cyan to Blue outline)
    shield_outline = [
        (cx, top_y),
        (left_x, mid_y1),
        (left_x + w*0.03, mid_y2),
        (cx, bottom_y),
        (right_x - w*0.03, mid_y2),
        (right_x, mid_y1),
        (cx, top_y)
    ]
    shield_border = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    sb_draw = ImageDraw.Draw(shield_border)
    sb_draw.polygon(shield_outline, outline=(56, 189, 248, 255), width=int(w * 0.016))
    img.alpha_composite(shield_border)
    
    # 5. Dynamic Beacon / Spark (Emerald Green Core)
    spark_poly = [
        (cx, h * 0.30),
        (w * 0.35, h * 0.48),
        (cx * 0.93, h * 0.48),
        (cx * 0.84, h * 0.70),
        (cx * 1.25, h * 0.50),
        (cx * 1.05, h * 0.50),
        (w * 0.65, h * 0.34),
    ]
    
    # Spark Glow
    spark_glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    sg_draw = ImageDraw.Draw(spark_glow)
    sg_draw.polygon(spark_poly, fill=(52, 211, 153, 220))
    spark_glow = spark_glow.filter(ImageFilter.GaussianBlur(radius=int(w * 0.04)))
    img.alpha_composite(spark_glow)
    
    # Spark Solid Core
    spark_core = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    sc_draw = ImageDraw.Draw(spark_core)
    sc_draw.polygon(spark_poly, fill=(16, 185, 129, 255))
    sc_draw.polygon(spark_poly, outline=(209, 250, 229, 255), width=int(w * 0.007))
    img.alpha_composite(spark_core)
    
    return img

print('Rendering master CivicGuard icon at 2048x2048...')
master = generate_master_icon(2048)

# 1. Update Android mipmaps
android_res = os.path.join(mobile_dir, 'android', 'app', 'src', 'main', 'res')
android_sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}
for folder, sz in android_sizes.items():
    folder_path = os.path.join(android_res, folder)
    os.makedirs(folder_path, exist_ok=True)
    out_file = os.path.join(folder_path, 'ic_launcher.png')
    resized = master.resize((sz, sz), Image.Resampling.LANCZOS)
    resized.save(out_file, 'PNG')
    print(f'Saved Android {folder}/ic_launcher.png ({sz}x{sz})')

# 2. Update iOS AppIcon.appiconset
ios_iconset = os.path.join(mobile_dir, 'ios', 'Runner', 'Assets.xcassets', 'AppIcon.appiconset')
if os.path.exists(ios_iconset):
    ios_sizes = {
        'Icon-App-20x20@1x.png': 20,
        'Icon-App-20x20@2x.png': 40,
        'Icon-App-20x20@3x.png': 60,
        'Icon-App-29x29@1x.png': 29,
        'Icon-App-29x29@2x.png': 58,
        'Icon-App-29x29@3x.png': 87,
        'Icon-App-40x40@1x.png': 40,
        'Icon-App-40x40@2x.png': 80,
        'Icon-App-40x40@3x.png': 120,
        'Icon-App-60x60@2x.png': 120,
        'Icon-App-60x60@3x.png': 180,
        'Icon-App-76x76@1x.png': 76,
        'Icon-App-76x76@2x.png': 152,
        'Icon-App-83.5x83.5@2x.png': 167,
        'Icon-App-1024x1024@1x.png': 1024,
    }
    for filename, sz in ios_sizes.items():
        out_file = os.path.join(ios_iconset, filename)
        resized = master.resize((sz, sz), Image.Resampling.LANCZOS)
        resized.save(out_file, 'PNG')
        print(f'Saved iOS {filename} ({sz}x{sz})')

# 3. Update Mobile assets/images
mobile_assets = os.path.join(mobile_dir, 'assets', 'images')
os.makedirs(mobile_assets, exist_ok=True)
master.resize((1024, 1024), Image.Resampling.LANCZOS).save(os.path.join(mobile_assets, 'app_icon.png'), 'PNG')
master.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(mobile_assets, 'logo.png'), 'PNG')
print('Saved mobile app assets/images/app_icon.png and logo.png')

# 4. Update Mobile web/icons
mobile_web_icons = os.path.join(mobile_dir, 'web', 'icons')
if os.path.exists(mobile_web_icons):
    master.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(mobile_web_icons, 'Icon-192.png'), 'PNG')
    master.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(mobile_web_icons, 'Icon-512.png'), 'PNG')
    master.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(mobile_web_icons, 'Icon-maskable-192.png'), 'PNG')
    master.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(mobile_web_icons, 'Icon-maskable-512.png'), 'PNG')
    master.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(mobile_dir, 'web', 'favicon.png'), 'PNG')
    print('Saved mobile web icons')

# 5. Update Web frontend public
web_public = os.path.join(web_dir, 'public')
os.makedirs(web_public, exist_ok=True)
master.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(web_public, 'logo.png'), 'PNG')
master.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(web_public, 'favicon.png'), 'PNG')
print('Saved web public logo.png and favicon.png')

# 6. Update AndroidManifest.xml
manifest_path = os.path.join(mobile_dir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')
if os.path.exists(manifest_path):
    with open(manifest_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('android:label="civicguard_mobileapp"', 'android:label="CivicGuard"')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated AndroidManifest.xml -> android:label="CivicGuard"')

# 7. Update iOS Info.plist
plist_path = os.path.join(mobile_dir, 'ios', 'Runner', 'Info.plist')
if os.path.exists(plist_path):
    with open(plist_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('<string>Civicguard Mobileapp</string>', '<string>CivicGuard</string>')
    content = content.replace('<string>civicguard_mobileapp</string>', '<string>CivicGuard</string>')
    with open(plist_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated iOS Info.plist -> CivicGuard')

# 8. Update web/manifest.json
web_manifest = os.path.join(mobile_dir, 'web', 'manifest.json')
if os.path.exists(web_manifest):
    with open(web_manifest, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data['name'] = 'CivicGuard'
    data['short_name'] = 'CivicGuard'
    with open(web_manifest, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    print('Updated mobile web manifest.json -> CivicGuard')

print('All branding assets and configurations updated successfully!')
