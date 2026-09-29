import os
from PIL import Image, ImageOps

src_path = r"C:\Users\ext_jmena\.gemini\antigravity\brain\f0fee45a-db3f-463f-997e-25471e5e6955\.user_uploaded\media_1790652050669.jpg"
out_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images"

img = Image.open(src_path).convert("RGBA")

# Bounding box crop
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Create transparent version with WHITE text for dark background
datas = img.getdata()
new_data_white = []
new_data_black = []

for item in datas:
    # item is (R, G, B, A)
    avg = (item[0] + item[1] + item[2]) / 3
    if avg > 200:  # White background -> Transparent
        new_data_white.append((0, 0, 0, 0))
        new_data_black.append((0, 0, 0, 0))
    else:  # Black text -> Invert to White (255,255,255,255) or keep Black (0,0,0,255)
        alpha = int(255 - avg)
        new_data_white.append((255, 255, 255, alpha))
        new_data_black.append((0, 0, 0, alpha))

img_white = Image.new("RGBA", img.size)
img_white.putdata(new_data_white)

img_black = Image.new("RGBA", img.size)
img_black.putdata(new_data_black)

# Crop tight bounding box
bbox_w = img_white.getbbox()
if bbox_w:
    img_white = img_white.crop(bbox_w)
    img_black = img_black.crop(bbox_w)

out_white_png = os.path.join(out_dir, "logo-keiner-form-white.png")
out_white_webp = os.path.join(out_dir, "logo-keiner-form-white.webp")
out_black_png = os.path.join(out_dir, "logo-keiner-form-black.png")

img_white.save(out_white_png, "PNG")
img_white.save(out_white_webp, "WEBP", quality=100)
img_black.save(out_black_png, "PNG")

print("Generated clean logo files:", out_white_png, out_white_webp, out_black_png)
