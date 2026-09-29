import os
import fitz  # PyMuPDF
from PIL import Image

pdf_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\logos"
out_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images\logos"

os.makedirs(out_dir, exist_ok=True)

file_map = {
    "Copia de 02_aldea_nativa.pdf": "aldea_nativa",
    "Copia de 03_kiosclub.pdf": "kiosclub",
    "Copia de 04_delicatto.pdf": "delicatto",
    "Copia de 05_trebol.pdf": "trebol",
    "Copia de 06_superofertas.pdf": "superofertas",
    "Copia de 07_ahorraya.pdf": "ahorraya",
    "Copia de 18_nongshim.pdf": "nongshim"
}

for pdf_name, base_name in file_map.items():
    pdf_path = os.path.join(pdf_dir, pdf_name)
    if not os.path.exists(pdf_path):
        print(f"Skipping missing: {pdf_name}")
        continue
    
    doc = fitz.open(pdf_path)
    page = doc[0]
    
    # Extract SVG vector if possible
    svg_text = page.get_svg_image()
    svg_path = os.path.join(out_dir, f"{base_name}.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_text)
    print(f"Saved SVG: {svg_path}")

    # Render high-res pixmap (4x scale)
    mat = fitz.Matrix(4, 4)
    pix = page.get_pixmap(matrix=mat, alpha=True)
    
    png_path = os.path.join(out_dir, f"{base_name}.png")
    pix.save(png_path)
    print(f"Saved PNG: {png_path}")
    
    # Auto crop transparent/white margins & convert to WebP
    im = Image.open(png_path)
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
        
    # Get bounding box of non-transparent pixels
    bbox = im.getbbox()
    if bbox:
        im_cropped = im.crop(bbox)
        # Add a small padding (10px)
        w, h = im_cropped.size
        padded = Image.new('RGBA', (w + 20, h + 20), (0, 0, 0, 0))
        padded.paste(im_cropped, (10, 10))
        
        webp_path = os.path.join(out_dir, f"{base_name}.webp")
        padded.save(webp_path, 'WEBP', quality=95)
        padded.save(png_path, 'PNG')
        print(f"Saved cropped WebP & PNG for {base_name}")
