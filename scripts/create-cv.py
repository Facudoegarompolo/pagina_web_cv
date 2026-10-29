"""Generate both CVs from public JSON: python create-cv.py content.json. Requires reportlab."""
import json, sys
from html import escape
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import reportlab

root = Path(__file__).resolve().parent.parent
output_dir = root / 'output/pdf'
output_dir.mkdir(parents=True, exist_ok=True)
payload = json.loads(Path(sys.argv[1]).read_text())
content = payload.get('content', payload)
fonts = Path(reportlab.__file__).parent / 'fonts'
pdfmetrics.registerFont(TTFont('Vera', str(fonts / 'Vera.ttf')))
pdfmetrics.registerFont(TTFont('VeraBold', str(fonts / 'VeraBd.ttf')))
pdfmetrics.registerFontFamily('Vera', normal='Vera', bold='VeraBold')
ink = colors.HexColor('#182D31')
muted = colors.HexColor('#48595C')
accent = colors.HexColor('#267D78')
styles = {
    'name': ParagraphStyle('Name',fontName='VeraBold',fontSize=19,leading=26,textColor=ink,spaceAfter=9),
    'sub': ParagraphStyle('Sub',fontName='Vera',fontSize=11,leading=16,textColor=accent,spaceAfter=12),
    'section': ParagraphStyle('Section',fontName='VeraBold',fontSize=11,leading=15,textColor=accent,spaceBefore=12,spaceAfter=6),
    'job': ParagraphStyle('Job',fontName='VeraBold',fontSize=10,leading=15,textColor=ink,spaceAfter=4),
    'body': ParagraphStyle('Body',fontName='Vera',fontSize=9.3,leading=13,textColor=muted,spaceAfter=6),
    'contact': ParagraphStyle('Contact',fontName='Vera',fontSize=8.5,leading=14,textColor=muted,spaceAfter=4),
}

for lang in ('es', 'en'):
    def text(value):
        return escape(str(value.get(lang) or value.get('en' if lang == 'es' else 'es', '') if isinstance(value, dict) else value or ''))
    story = []
    def p(value, style='body'):
        if value: story.append(Paragraph(value.replace('\n', '<br/>'), styles[style]))
    p(text(content['profile']['name']).upper(), 'name')
    p(text(content['profile']['title']), 'sub')
    c = content['contact']
    p(' · '.join(filter(None, [text(content['profile']['location']), text(c['phone']), text(c['email'])])), 'contact')
    if c['linkedin']: p(f'<link href="{text(c["linkedin"])}" color="#267D78">{text(c["linkedin"].removeprefix("https://"))}</link>', 'contact')
    story.append(HRFlowable(width='100%', thickness=.6, color=colors.HexColor('#C9D6D5')))
    p('PERFIL PROFESIONAL' if lang == 'es' else 'PROFILE', 'section')
    p(text(content['profile']['intro']))
    for key, heading in [('experience', 'EXPERIENCIA LABORAL' if lang == 'es' else 'WORK EXPERIENCE'), ('education', 'FORMACIÓN' if lang == 'es' else 'EDUCATION')]:
        p(heading, 'section')
        for entry in content[key]:
            if entry.get('visible') is False: continue
            start = len(story)
            p(text(entry['title']), 'job')
            p(' · '.join(filter(None, [text(entry.get('organization')), text(entry.get('dates'))])))
            description = text(entry.get('description'))
            if description.rstrip('.') != text(entry['title']).rstrip('.'): p(description)
            p(text(entry.get('tasks')))
            if entry.get('progress') is not None: p(f'{entry["progress"]}% ' + ('de materias aprobadas' if lang == 'es' else 'of subjects passed'))
            group = story[start:]; del story[start:]; story.append(KeepTogether(group))
    p('HABILIDADES E IDIOMAS' if lang == 'es' else 'SKILLS & LANGUAGES', 'section')
    for skill in content['skills']:
        if skill.get('visible') is False: continue
        p('<b>' + text(skill['title']) + '</b>' + (': ' + text(skill['description']) if text(skill['description']) else ''))
    out = output_dir / f'CV_Facundo_Garompolo_{lang.upper()}.pdf'
    doc = SimpleDocTemplate(str(out), pagesize=(595.28,841.89), leftMargin=48,rightMargin=48,topMargin=38,bottomMargin=36,title='CV - '+content['profile']['name'],author=content['profile']['name'])
    doc.build(story)
    print(out)
