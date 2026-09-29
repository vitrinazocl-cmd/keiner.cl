import os, glob

html_files = glob.glob(r"c:\Users\ext_jmena\OneDrive - Falabella\Escritorio\keiner.cl 2.0\*.html")

target_snippet = '<a href="admin-feria.html" class="admin-access-link"'

for fpath in html_files:
    if 'admin-feria.html' in fpath:
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if target_snippet in content:
        print(f"Already updated: {os.path.basename(fpath)}")
        continue
    
    if '<div class="footer-bottom">' in content:
        old_part = '<div class="footer-bottom">'
        new_part = '''<div class="footer-bottom">
          <a href="admin-feria.html" class="admin-access-link" aria-label="Acceso Admin Base de Datos" style="float: right;">
            🔒 Acceso Admin
          </a>'''
        new_content = content.replace(old_part, new_part, 1)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated footer in: {os.path.basename(fpath)}")
    else:
        print(f"No footer-bottom found in: {os.path.basename(fpath)}")
