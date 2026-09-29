import os, base64
from PIL import Image

png_path = r'c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images\favicon.png'
svg_path = r'c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images\favicon.svg'

with open(png_path, 'rb') as f:
    b64_str = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <rect width="256" height="256" rx="48" fill="#FFFFFF"/>
  <image href="data:image/png;base64,{b64_str}" width="256" height="256" preserveAspectRatio="xMidYMid meet"/>
</svg>
'''

with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Saved crisp SVG favicon!")
