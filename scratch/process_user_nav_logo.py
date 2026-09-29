import os
from PIL import Image, ImageOps, ImageFilter

src_path = r'C:\Users\ext_jmena\.gemini\antigravity\brain\f0fee45a-db3f-463f-997e-25471e5e6955\.user_uploaded\media_1790655022439.jpg'
out_dir = r'c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images'

img = Image.open(src_path).convert('RGB')
w, h = img.size

# Crop tight bounding box around the black text
gray = img.convert('L')
# Threshold black text (darker than 128)
mask = gray.point(lambda p: 255 if p < 180 else 0)
bbox = mask.getbbox()

if bbox:
    # Add small margin (15px)
    left = max(0, bbox[0] - 15)
    top = max(0, bbox[1] - 15)
    right = min(w, bbox[2] + 15)
    bottom = min(h, bbox[3] + 15)
    cropped_img = img.crop((left, top, right, bottom))
    cropped_mask = mask.crop((left, top, right, bottom))
else:
    cropped_img = img
    cropped_mask = mask

# Create crisp transparent black logo (Black text, transparent bg)
w_c, h_c = cropped_img.size
transparent_black = Image.new('RGBA', (w_c, h_c), (0, 0, 0, 0))
# Black text layer using mask
black_layer = Image.new('RGBA', (w_c, h_c), (0, 0, 0, 255))
transparent_black.paste(black_layer, (0, 0), cropped_mask)

# Save transparent black logo
transparent_black.save(os.path.join(out_dir, 'logo-keiner-form-black.png'))

# Create crisp transparent white logo (White text, transparent bg)
transparent_white = Image.new('RGBA', (w_c, h_c), (0, 0, 0, 0))
white_layer = Image.new('RGBA', (w_c, h_c), (255, 255, 255, 255))
transparent_white.paste(white_layer, (0, 0), cropped_mask)
transparent_white.save(os.path.join(out_dir, 'logo-keiner-form-white.png'))
transparent_white.save(os.path.join(out_dir, 'logo-keiner-form-white.webp'))

# Create white rounded badge (White rounded rectangle background + black text, as shown in media_1790655002183.png)
pad_x = 24
pad_y = 12
badge_w = w_c + (pad_x * 2)
badge_h = h_c + (pad_y * 2)

badge = Image.new('RGBA', (badge_w, badge_h), (255, 255, 255, 255))
badge.paste(transparent_black, (pad_x, pad_y), transparent_black)
badge.save(os.path.join(out_dir, 'logo-keiner-header.png'))
badge.save(os.path.join(out_dir, 'logo-keiner-nav-small.png'))

print(f"Generated logo assets: cropped size={w_c}x{h_c}, badge size={badge_w}x{badge_h}")
