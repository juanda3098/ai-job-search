from pathlib import Path
import re
import sys
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
english = '--english' in sys.argv
OUT = ROOT / ('output/pdf/juan_david_posso_cv_english.pdf' if english else 'output/pdf/juan_david_posso_cv_actualizado.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Calibri', 'C:/Windows/Fonts/calibri.ttf'))
pdfmetrics.registerFont(TTFont('CalibriBold', 'C:/Windows/Fonts/calibrib.ttf'))
pdfmetrics.registerFontFamily('Calibri', normal='Calibri', bold='CalibriBold', italic='Calibri', boldItalic='CalibriBold')
blue = HexColor('#22628b')
body = ParagraphStyle('body', fontName='Calibri', fontSize=10, leading=12, spaceAfter=3, textColor=HexColor('#252d35'))
bullet = ParagraphStyle('bullet', parent=body, leftIndent=10, firstLineIndent=-8, spaceAfter=3)
section = ParagraphStyle('section', parent=body, fontName='CalibriBold', fontSize=13, leading=16, textColor=blue, spaceBefore=9, spaceAfter=5, keepWithNext=True)
role = ParagraphStyle('role', parent=body, fontName='CalibriBold', fontSize=10.7, leading=13, spaceBefore=5, keepWithNext=True)
name = ParagraphStyle('name', parent=section, fontSize=24, leading=28, alignment=TA_CENTER, spaceBefore=0)
contact = ParagraphStyle('contact', parent=body, fontSize=9.4, leading=12, alignment=TA_CENTER)

def group(s, pos):
    while s[pos].isspace(): pos += 1
    assert s[pos] == '{', (pos,s[pos:pos+40])
    start = pos+1
    depth = 1
    pos += 1
    while depth:
        if s[pos] == '{': depth += 1
        elif s[pos] == '}': depth -= 1
        pos += 1
    return s[start:pos-1], pos

def inline(s):
    s = s.strip()
    s = re.sub(r'\\textbf\{([^{}]*)\}', r'<b>\1</b>', s)
    s = re.sub(r'\\href\{([^{}]*)\}\{([^{}]*)\}', r'<link href="\1" color="#22628b">\2</link>', s)
    return s.replace('\n',' ').replace('&', '&amp;')

story = [Paragraph('Juan David Posso Rengifo', name),
         Paragraph('Software Engineer III | React · Nest.js · Salesforce (Apex, LWC, Aura)<br/>Full-Stack Development | Technical Leadership', contact),
         Paragraph('Cali, Valle del Cauca, Colombia | +57 3145291839 | <link href="mailto:juandapore3098@gmail.com">juandapore3098@gmail.com</link>', contact),
         Paragraph('<link href="https://www.linkedin.com/in/juandavidposso/" color="#22628b">LinkedIn: juandavidposso</link> | <link href="https://github.com/juanda3098" color="#22628b">GitHub: juanda3098</link>', contact)]

def prose(s):
    s = s.replace(r'\begin{itemize}', '').replace(r'\end{itemize}', '').strip()
    chunks = s.split(r'\item')
    if chunks[0].strip(): story.append(Paragraph(inline(chunks[0]), body))
    for chunk in chunks[1:]:
        if chunk.strip(): story.append(Paragraph('• '+inline(chunk), bullet))

source = (ROOT / ('cv/main_juan_david_english.tex' if english else 'cv/main_juan_david_actualizado.tex')).read_text(encoding='utf-8')
source = source[source.index(r'\section{'):source.index(r'\end{document}')]
pattern = re.compile(r'\\(section|cvitem|cventry|newpage|vspace)')
pos = 0
while pos < len(source):
    match = pattern.search(source,pos)
    if not match:
        prose(source[pos:]); break
    if source[pos:match.start()].strip(): prose(source[pos:match.start()])
    cmd = match.group(1)
    pos = match.end()
    if cmd == 'newpage': story.append(PageBreak()); continue
    args=[]
    for _ in range({'section':1,'cvitem':2,'cventry':6,'vspace':1}[cmd]):
        value,pos=group(source,pos); args.append(value)
    if cmd=='section': story.append(Paragraph(inline(args[0]),section))
    elif cmd=='cvitem':
        label=inline(args[0])
        story.append(Paragraph(('<b>'+label+':</b> ' if label else '')+inline(args[1]),body))
    elif cmd=='cventry':
        date,title,company,location,_,desc=args
        story.append(Paragraph(inline(title)+' | '+inline(company),role))
        story.append(Paragraph(inline(date)+((' | '+inline(location)) if location else ''),body))
        if desc.strip(): prose(desc)

def footer(c, doc):
    c.setStrokeColor(HexColor('#d6e2eb')); c.line(40,32,A4[0]-40,32)
    c.setFillColor(blue); c.setFont('Calibri',8)
    c.drawString(40,20,'Juan David Posso Rengifo | CV')
    c.drawRightString(A4[0]-40,20,str(doc.page))

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=40,leftMargin=40,topMargin=32,bottomMargin=43,title='Juan David Posso Rengifo - CV (English)' if english else 'Juan David Posso Rengifo - CV actualizado',author='Juan David Posso Rengifo')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
