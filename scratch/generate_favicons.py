import os
from PIL import Image, ImageOps

src_logo = r'C:\Users\ext_jmena\.gemini\antigravity\brain\f0fee45a-db3f-463f-997e-25471e5e6955\.user_uploaded\media_1790655022439.jpg'
out_dir = r'c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0'
assets_dir = r'c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images'

img = Image.open(src_logo).convert('RGB')
w, h = img.size

# Extract bounding box of black text
gray = img.convert('L')
mask = gray.point(lambda p: 255 if p < 180 else 0)
bbox = mask.getbbox()

if bbox:
    cropped_img = img.crop(bbox)
    cropped_mask = mask.crop(bbox)
else:
    cropped_img = img
    cropped_mask = mask

cw, ch = cropped_img.size

# 1. Create White Box Favicon (White background, black text 'keiner', rounded square style)
box_size = 256
fav_white = Image.new('RGBA', (box_size, box_size), (255, 255, 255, 255))

# Scale logo to fit nicely in 256x256 square (leaving padding)
target_w = int(box_size * 0.85)
scale = target_w / float(cw)
target_h = int(ch * scale)

if target_h > int(box_size * 0.6):
    target_h = int(box_size * 0.6)
    scale = target_h / float(ch)
    target_w = int(cw * scale)

logo_resized = cropped_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
logo_mask_resized = cropped_mask.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Create black text on transparent
transparent_black = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
black_layer = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 255))
transparent_black.paste(black_layer, (0, 0), logo_mask_resized)

pos_x = (box_size - target_w) // 2
pos_y = (box_size - target_h) // 2
fav_white.paste(transparent_black, (pos_x, pos_y), transparent_black)

# Save ICO & PNG favicons in root and assets/images
fav_white.save(os.path.join(out_dir, 'favicon.ico'), format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128)])
fav_white.save(os.path.join(assets_dir, 'favicon.ico'), format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128)])

fav_white.save(os.path.join(out_dir, 'favicon.png'))
fav_white.save(os.path.join(assets_dir, 'favicon.png'))
fav_white.save(os.path.join(assets_dir, 'apple-touch-icon.png'))

print("Favicon PNG and ICO files generated successfully!")
