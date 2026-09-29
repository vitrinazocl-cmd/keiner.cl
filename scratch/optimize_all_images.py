import os, glob
from PIL import Image

images_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images"

total_saved = 0

for root, dirs, files in os.walk(images_dir):
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in ['.png', '.jpg', '.jpeg', '.webp']:
            fpath = os.path.join(root, f)
            orig_size = os.path.getsize(fpath)
            
            # Skip SVGs, video files, tiny icons under 2KB
            if orig_size < 2048:
                continue
                
            try:
                img = Image.open(fpath)
                
                # PNG optimization
                if ext == '.png':
                    # If image is RGBA, optimize with maximum PNG compression
                    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                        img.save(fpath, 'PNG', optimize=True)
                    else:
                        # Convert non-transparent PNG to WebP or optimize PNG
                        img.save(fpath, 'PNG', optimize=True)
                
                # WebP optimization
                elif ext == '.webp':
                    img.save(fpath, 'WEBP', quality=82, method=6)
                
                # JPG optimization
                elif ext in ['.jpg', '.jpeg']:
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    img.save(fpath, 'JPEG', quality=82, progressive=True, optimize=True)
                    
                new_size = os.path.getsize(fpath)
                if new_size < orig_size:
                    saved = orig_size - new_size
                    total_saved += saved
                    print(f"Optimized {f}: {orig_size} -> {new_size} bytes (-{saved} bytes)")
                else:
                    # Revert if larger
                    pass
            except Exception as e:
                print(f"Error optimizing {f}: {e}")

print(f"Total bandwidth saved on images: {total_saved / 1024:.2f} KB")
