import glob, os

html_files = glob.glob(r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\*.html")

favicon_tags = '''    <link rel="icon" type="image/svg+xml" href="assets/images/favicon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon.png">
    <link rel="shortcut icon" href="favicon.ico">
    <link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">'''

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace existing favicon link(s)
    if '<link rel="icon"' in content:
        # Find start and end of favicon link line
        lines = content.splitlines()
        new_lines = []
        skip = False
        inserted = False
        for line in lines:
            if '<link rel="icon"' in line or '<link rel="shortcut icon"' in line or '<link rel="apple-touch-icon"' in line:
                if not inserted:
                    new_lines.append(favicon_tags)
                    inserted = True
            else:
                new_lines.append(line)
        
        new_content = '\n'.join(new_lines)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated favicons in: {os.path.basename(fpath)}")
