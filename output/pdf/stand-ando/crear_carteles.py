"""Carteles A4 para el stand de ando. No modifica la aplicación.

El QR enlaza directamente a la página pública que proporcionó la usuaria.
La ilustración conceptual se conserva sin editar; texto y diagramas son vectoriales.
"""
from pathlib import Path
import argparse
import json
import shutil
import zipfile

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from PIL import Image
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
W, H = A4
INK = '#102E27'
GREEN = '#08745B'
MINT = '#46DDB8'
PALE = '#E9F6F0'
MUTED = '#4B625B'
WHITE = '#FFFFFF'
WEB_URL = 'https://gemelo-seven.vercel.app/'

def dibujar_qr(c, x, y, side):
    # Cuatro módulos de margen blanco y corrección M. Vectorial en el PDF.
    widget = QrCodeWidget(WEB_URL, barLevel='M', barBorder=4,
                          barFillColor=HexColor('#000000'))
    bounds = widget.getBounds()
    width, height = bounds[2] - bounds[0], bounds[3] - bounds[1]
    size = side * mm
    drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height,
                                            -bounds[0] * size / width, -bounds[1] * size / height])
    drawing.add(widget)
    renderPDF.draw(drawing, c, x * mm, H - (y + side) * mm)

def fonts():
    for name, family, weight in [('Inter', 'inter', '400Regular'), ('Medium', 'inter', '500Medium'), ('Bold', 'inter', '700Bold'), ('Display', 'space-grotesk', '700Bold')]:
        folder = ROOT / 'node_modules/@expo-google-fonts' / family / weight
        path = next(folder.glob('*.ttf'))
        pdfmetrics.registerFont(TTFont(name, str(path)))

def text(c, value, x, y, size=12, font='Inter', color=INK, align='left'):
    c.setFillColor(HexColor(color))
    c.setFont(font, size)
    # Todas las posiciones del diseño se expresan desde el borde superior en mm.
    width = pdfmetrics.stringWidth(value, font, size)
    start = x * mm - (width / 2 if align == 'center' else width if align == 'right' else 0)
    assert start >= 10 * mm and start + width <= W - 10 * mm, (value, start, width)
    c.drawString(start, H - y * mm, value)

def box(c, x, y, w, h, fill, radius=5, stroke=None):
    c.setFillColor(HexColor(fill))
    c.setStrokeColor(HexColor(stroke or fill))
    c.setLineWidth(0.7)
    c.roundRect(x * mm, H - (y + h) * mm, w * mm, h * mm, radius * mm, stroke=bool(stroke), fill=1)

def dot(c, x, y, r, color):
    c.setFillColor(HexColor(color))
    c.circle(x * mm, H - y * mm, r * mm, stroke=0, fill=1)

def brand(c, number, label):
    c.setFillColor(HexColor(WHITE))
    c.rect(0, 0, W, H, stroke=0, fill=1)
    dot(c, 15, 19, 3, GREEN)
    text(c, 'ando', 22, 23, 32, 'Display')
    text(c, 'TU GEMELO DIGITAL', 12, 37, 10, 'Bold', GREEN)
    text(c, f'{number} / {label}', 198, 23, 9, 'Medium', MUTED, 'right')

def footer(c):
    text(c, 'Proyecto académico · Ayacucho, 2026', 105, 289, 9, 'Inter', MUTED, 'center')

def illustration(c, path, x, y, w, h):
    c.drawImage(ImageReader(str(path)), x * mm, H - (y + h) * mm, width=w * mm, height=h * mm, preserveAspectRatio=True, anchor='c', mask='auto')

def poster_one(c, hero):
    brand(c, '01', 'DESCUBRE')
    text(c, 'Tu rutina,', 12, 59, 45, 'Display')
    text(c, 'con más sentido.', 12, 77, 45, 'Display')
    text(c, 'Tu gemelo digital para entender tu día', 12, 94, 16, 'Inter', MUTED)
    text(c, 'y elegir pequeños cambios a tu ritmo.', 12, 104, 16, 'Inter', MUTED)
    dot(c, 105, 172, 53, PALE)
    illustration(c, hero, 14, 113, 182, 119)
    for x, caption in [(12, 'Observa tu día'), (75, 'Conoce tu rutina'), (138, 'Elige un cambio')]:
        box(c, x, 237, 60, 14, PALE, 7)
        text(c, caption, x + 30, 246, 11, 'Bold', GREEN, 'center')
    box(c, 12, 259, 186, 23, INK, 5)
    text(c, 'Tu rutina. Tu gemelo. Tus datos.', 105, 273, 16, 'Display', WHITE, 'center')
    footer(c)

def icon(c, kind, x, y):
    c.saveState()
    c.translate(x * mm, H - y * mm)
    c.setLineWidth(2)
    c.setStrokeColor(HexColor(GREEN))
    c.setLineCap(1)
    if kind == 'steps':
        for xx, yy in [(-9, 4), (7, -4)]:
            c.ellipse(xx - 4, yy - 7, xx + 4, yy + 7, stroke=1, fill=0)
            c.arc(xx - 4, yy - 17, xx + 4, yy - 9, 20, 150)
    elif kind == 'chart':
        c.line(-12, -12, -12, 12)
        c.line(-12, -12, 14, -12)
        p = c.beginPath()
        p.moveTo(-7, -5); p.lineTo(0, 2); p.lineTo(6, -1); p.lineTo(13, 10)
        c.drawPath(p)
    else:
        c.circle(0, 0, 13)
        c.circle(0, 0, 7)
        c.circle(0, 0, 1.5)
        c.line(4, 4, 16, 16)
    c.restoreState()

def poster_two(c, hero):
    brand(c, '02', 'COMPRENDE')
    text(c, 'Así te acompaña.', 12, 60, 40, 'Display')
    text(c, 'Tres pasos para conocerte un poco mejor.', 12, 74, 14, 'Inter', MUTED)
    cards = [
        ('01', 'Registra tu día', ['Consulta tus pasos, actividad y descanso.', 'Según los sensores y permisos disponibles.'], 'steps'),
        ('02', 'Comprende tu rutina', ['Explora tu historial y observa', 'cómo cambia tu día a día.'], 'chart'),
        ('03', 'Elige tu próximo paso', ['Define una meta y planifica tu mañana.', 'Un pequeño cambio elegido por ti.'], 'target'),
    ]
    for i, (n, title, lines, symbol) in enumerate(cards):
        y = 85 + i * 53
        box(c, 12, y, 186, 47, PALE, 6)
        text(c, n, 19, y + 13, 11, 'Bold', GREEN)
        icon(c, symbol, 24, y + 29)
        text(c, title, 39, y + 16, 21, 'Display')
        for j, line in enumerate(lines):
            text(c, line, 39, y + 28 + j * 7, 11.5, 'Inter', MUTED)
    box(c, 12, 249, 186, 33, INK, 5)
    text(c, 'El control lo tienes tú.', 19, 260, 18, 'Display', WHITE)
    text(c, 'Tú eliges qué datos usar.', 19, 269, 12, 'Inter', '#CCEEE2')
    text(c, 'La ubicación se guarda como zona aproximada.', 19, 277, 11, 'Inter', '#CCEEE2')
    footer(c)

def poster_three(c, hero):
    brand(c, '03', 'PRUEBA')
    text(c, 'Tu día.', 12, 60, 46, 'Display')
    text(c, 'Tu gemelo.', 12, 79, 46, 'Display')
    text(c, 'A tu manera.', 12, 98, 46, 'Display', GREEN)
    text(c, 'Conoce ando y elige cómo te acompaña.', 12, 116, 15, 'Inter', MUTED)
    text(c, 'Escanea y conoce ando', 105, 141, 22, 'Display', INK, 'center')
    # QR de 80 x 80 mm. Las marcas decorativas quedan fuera del margen blanco.
    x, y, side = 65, 152, 80
    c.setStrokeColor(HexColor(MINT))
    c.setLineWidth(2)
    for px, py, sx, sy in [(x - 1, y - 1, 1, 1), (x + side + 1, y - 1, -1, 1), (x - 1, y + side + 1, 1, -1), (x + side + 1, y + side + 1, -1, -1)]:
        c.line(px * mm, H - py * mm, (px + sx * 7) * mm, H - py * mm)
        c.line(px * mm, H - py * mm, px * mm, H - (py + sy * 7) * mm)
    dibujar_qr(c, x, y, side)
    text(c, 'gemelo-seven.vercel.app', 105, 245, 15, 'Medium', GREEN, 'center')
    c.linkURL(WEB_URL, (60 * mm, H - 248 * mm, 150 * mm, H - 237 * mm), relative=0)
    text(c, 'O pide una demostración en el stand.', 105, 255, 12, 'Inter', MUTED, 'center')
    box(c, 12, 265, 186, 17, INK, 5)
    text(c, 'Descubre tu rutina. Elige tu próximo paso.', 105, 276, 13, 'Display', WHITE, 'center')
    footer(c)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('illustration', type=Path)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    fonts()
    hero = OUT / 'ilustracion-conceptual-ando.png'
    if args.illustration.resolve() != hero.resolve():
        shutil.copy2(args.illustration, hero)
    target = OUT / 'ando-stand-3-carteles-A4.pdf'
    c = canvas.Canvas(str(target), pagesize=A4, pageCompression=1)
    c.setTitle('ando | Tres carteles A4 para el stand')
    c.setAuthor('ando')
    for draw in [poster_one, poster_two, poster_three]:
        draw(c, hero)
        c.showPage()
    c.save()
    doc = pdfium.PdfDocument(str(target))
    names = ['01-descubre-ando-A4', '02-como-te-acompana-A4', '03-escanea-ando-con-QR-A4']
    for i, name in enumerate(names):
        page = doc[i]
        bitmap = page.render(scale=300 / 72)
        image = bitmap.to_pil()
        image.save(OUT / f'{name}.png', dpi=(300, 300))
        if i == 2:
            # Etiqueta separada de 8 cm para pegar también en otros soportes.
            scale = 300 / 25.4
            image.crop((round(65 * scale), round(152 * scale), round(145 * scale), round(232 * scale))).save(OUT / 'QR-ando-web-8cm.png', dpi=(300, 300))
        bitmap.close()
        page.close()
    doc.close()
    reader = PdfReader(str(target))
    assert len(reader.pages) == 3
    assert all(abs(float(p.mediabox.width) - W) < 0.01 and abs(float(p.mediabox.height) - H) < 0.01 for p in reader.pages)
    assert all(p.extract_text().strip() for p in reader.pages)
    dimensions = {name: Image.open(OUT / f'{name}.png').size for name in names}
    (OUT / 'verificacion.json').write_text(json.dumps({'paginas': 3, 'formato': 'A4 vertical, 210 x 297 mm', 'png_300_ppp': dimensions, 'qr': {'url': WEB_URL, 'tamano_mm': 80, 'borde_blanco_modulos': 4, 'correccion': 'M'}}, ensure_ascii=False, indent=2), encoding='utf-8')
    with zipfile.ZipFile(OUT / 'ando-stand-A4-imagenes.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for name in names:
            z.write(OUT / f'{name}.png', f'{name}.png')
        z.write(target, target.name)
        z.write(OUT / 'QR-ando-web-8cm.png', 'QR-ando-web-8cm.png')
    print(json.dumps({'pdf': str(target), 'imagenes': dimensions}, ensure_ascii=False))

if __name__ == '__main__':
    main()
