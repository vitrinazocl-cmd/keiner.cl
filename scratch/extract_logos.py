import os
import pypdf
from PIL import Image

logos_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\logos"
out_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images\logos"

os.makedirs(out_dir, exist_ok=True)

files = [f for f in os.listdir(logos_dir) if f.endswith('.pdf')]
print("PDF files found:", files)

for fname in files:
    filepath = os.path.join(logos_dir, fname)
    reader = pypdf.PdfReader(filepath)
    extracted = False
    
    clean_name = fname.replace("Copia de ", "").replace(".pdf", "").lower()
    # remove leading numbers like 02_
    parts = clean_name.split("_")
    if len(parts) > 1 and parts[0].isdigit():
        clean_name = "_".join(parts[1:])
    
    for i, page in enumerate(reader.pages):
        for img_idx, img in enumerate(page.images):
            out_filename = f"{clean_name}.png"
            out_path = os.path.join(out_dir, out_filename)
            with open(out_path, "wb") as fp:
                fp.write(img.data)
            print(f"Extracted image from {fname} -> {out_filename}")
            extracted = True
            break
        if extracted:
            break
            
    if not extracted:
        print(f"No embedded raster images found in {fname}")
