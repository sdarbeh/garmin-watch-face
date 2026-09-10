"""Build reproducible BMFont atlases and browser metrics. Requires Pillow 12.3.0."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math, hashlib
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/fonts/watchface'
OUT.mkdir(parents=True, exist_ok=True)
SIZES = list(range(24, 121, 8))
FAMILIES = [('roboto','Garmin preview proxy'), ('anton','Anton'), ('robotocondensed','Roboto Condensed'), ('doto','Doto'), ('pixelifysans','Pixelify Sans'), ('rubikbubbles','Rubik Bubbles')]
metrics = {}
for family, name in FAMILIES:
    source = next((ROOT / 'assets/fonts/watchface' / family).glob('*.ttf'))
    for weight in ([400] if family in ['roboto', 'anton', 'rubikbubbles'] else [400,700]):
        for size in SIZES:
            font = ImageFont.truetype(str(source), size)
            try:
                axes=font.get_variation_axes()
                font.set_variation_by_axes([weight if a['name']==b'Weight' else 100 if a['name']==b'Roundness' else a['default'] for a in axes])
            except OSError: pass
            ascent, descent = font.getmetrics()
            height = ascent+descent
            glyphs={}; x=y=1; row=0
            for code in range(32,127):
                ch=chr(code); left, top, right, bottom=font.getbbox(ch,anchor='lt')
                # Align all glyphs using the same baseline.
                bx, by, br, bb=font.getbbox(ch,anchor='ls')
                width=max(1,br-bx); h=max(1,bb-by)
                if x+width+1>1024: x=1; y+=row+1; row=0
                glyphs[str(code)]=[x,y,width,h,bx,ascent+by,round(font.getlength(ch))]
                x+=width+1; row=max(row,h)
            atlas=Image.new('RGBA',(1024,y+row+1),(255,255,255,0)); draw=ImageDraw.Draw(atlas)
            for code,g in glyphs.items():
                gx,gy,w,h,xoff,yoff,adv=g
                draw.text((gx-xoff,gy-yoff+ascent),chr(int(code)),font=font,anchor='ls',fill=(255,255,255,255),stroke_width=0)
            key=f'{family}_{weight}_{size}'
            atlas.save(OUT/(key+'.png'),optimize=True)
            metrics[key]={'height':height,'base':ascent,'width':1024,'atlasHeight':atlas.height,'glyphs':glyphs}
print(f'Generated {len(metrics)} atlases')
(ROOT/'src/watchface/font-metrics.json').write_text(json.dumps(metrics,separators=(',',':'))+'\n')
