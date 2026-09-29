import os
import pymupdf
from PIL import Image

logos_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\logos"
out_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images\logos"

os.makedirs(out_dir, exist_ok=True)

files = [f for f in os.listdir(logos_dir) if f.endswith('.pdf')]
print("Processing files:", files)

for fname in files:
    filepath = os.path.join(logos_dir, fname)
    doc = pymupdf.open(filepath)
    if len(doc) == 0:
        continue
    page = doc[0]
    
    # High resolution 4x matrix
    mat = pymupdf.Matrix(4.0, 4.0)
    pix = page.get_pixmap(matrix=mat, alpha=True)
    
    clean_name = fname.replace("Copia de ", "").replace(".pdf", "").lower().strip()
    parts = clean_name.split("_")
    if len(parts) > 1 and parts[0].isdigit():
        clean_name = "_".join(parts[1:])
    
    temp_png = os.path.join(out_dir, f"temp_{clean_name}.png")
    pix.save(temp_png)
    
    img = Image.open(temp_png).convert("RGBA")
    bbox = img.getbbox()
    
    if bbox:
        img_cropped = img.crop(bbox)
    else:
        img_cropped = img
        
    png_path = os.path.join(out_dir, f"{clean_name}.png")
    webp_path = os.path.join(out_dir, f"{clean_name}.webp")
    svg_path = os.path.join(out_dir, f"{clean_name}.svg")
    
    img_cropped.save(png_path, "PNG")
    img_cropped.save(webp_path, "WEBP", quality=95)
    
    try:
        svg_text = page.get_svg_image()
        with open(svg_path, "w", encoding="utf-8") as fsvg:
            fsvg.write(svg_text)
    except Exception as e:
        print(f"SVG skip for {clean_name}: {e}")

    if os.path.exists(temp_png):
        os.remove(temp_png)
        
    print(f"Generated: {clean_name}.png & {clean_name}.webp (Dimensions: {img_cropped.size})")

doc.close()
