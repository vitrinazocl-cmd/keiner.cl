import os

logos_dir = r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\assets\images\logos"

svgs = {
    "tottus.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
        <rect width="200" height="60" fill="none"/>
        <g transform="translate(10, 10)">
            <!-- Green dots circle pattern -->
            <circle cx="15" cy="10" r="4" fill="#78BE20"/>
            <circle cx="27" cy="10" r="4" fill="#78BE20"/>
            <circle cx="10" cy="20" r="4" fill="#78BE20"/>
            <circle cx="22" cy="20" r="4" fill="#00843D"/>
            <circle cx="32" cy="20" r="4" fill="#78BE20"/>
            <circle cx="15" cy="30" r="4" fill="#78BE20"/>
            <circle cx="27" cy="30" r="4" fill="#78BE20"/>
            <text x="45" y="28" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="24" fill="#00843D" letter-spacing="1">TOTTUS</text>
        </g>
    </svg>''',
    
    "turistik.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
        <rect width="200" height="60" fill="none"/>
        <g transform="translate(15, 12)">
            <path d="M5 25 Q 15 5, 25 25" fill="none" stroke="#E60000" stroke-width="4"/>
            <circle cx="15" cy="10" r="4" fill="#FFC700"/>
            <text x="35" y="26" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="800" font-size="22" fill="#E60000" letter-spacing="1">turistik</text>
        </g>
    </svg>''',

    "almadre.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
        <rect width="200" height="60" fill="none"/>
        <g transform="translate(15, 12)">
            <text x="0" y="22" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#D4A373" letter-spacing="1.5">ALMADRE</text>
            <text x="0" y="34" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="9" fill="#E60000" letter-spacing="3">PITA CHIPS</text>
        </g>
    </svg>''',

    "mixe.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
        <rect width="200" height="60" fill="none"/>
        <g transform="translate(20, 12)">
            <text x="0" y="22" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="22" fill="#E60000" letter-spacing="2">MIXE</text>
            <text x="0" y="34" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="9" fill="#FFC700" letter-spacing="2">MICHE MIX</text>
        </g>
    </svg>''',

    "sourmix.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
        <rect width="200" height="60" fill="none"/>
        <g transform="translate(20, 12)">
            <text x="0" y="22" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="21" fill="#FFD700" letter-spacing="1.5">SOUR MIX</text>
            <text x="0" y="34" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="9" fill="#FFFFFF" letter-spacing="2">COCKTAIL BASE</text>
        </g>
    </svg>''',

    "peru_latino.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
        <rect width="200" height="60" fill="none"/>
        <g transform="translate(15, 12)">
            <text x="0" y="22" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="20" fill="#D90429" letter-spacing="1">PERÚ LATINO</text>
            <text x="0" y="34" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="9" fill="#9CA3AF" letter-spacing="2">GASTRONOMÍA</text>
        </g>
    </svg>'''
}

for filename, content in svgs.items():
    filepath = os.path.join(logos_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created SVG: {filename}")
