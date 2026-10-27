"""One-time Spanish translation of the user-supplied English CV. Requires reportlab."""
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import reportlab

root = Path(__file__).resolve().parent.parent
out = root / 'output/pdf/CV_Facundo_Garompolo_ES.pdf'
out.parent.mkdir(parents=True, exist_ok=True)
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
    'section': ParagraphStyle('Section',fontName='VeraBold',fontSize=11,leading=15,textColor=accent,spaceBefore=17,spaceAfter=8),
    'job': ParagraphStyle('Job',fontName='VeraBold',fontSize=10,leading=15,textColor=ink,spaceAfter=4),
    'body': ParagraphStyle('Body',fontName='Vera',fontSize=9.3,leading=14.5,textColor=muted,spaceAfter=7),
    'contact': ParagraphStyle('Contact',fontName='Vera',fontSize=8.5,leading=14,textColor=muted,spaceAfter=4),
}
story=[]
def p(text,style='body'): story.append(Paragraph(text,styles[style]))
p('FACUNDO EMILIANO GARÓMPOLO','name')
p('Estudiante de Ingeniería Informática','sub')
p('San Miguel, Buenos Aires · 1151098800 · facundoegarompolo@gmail.com','contact')
p('<link href="https://www.linkedin.com/in/fgarompolo" color="#267D78">linkedin.com/in/fgarompolo</link>','contact')
story.append(Spacer(1,8))
story.append(HRFlowable(width='100%',thickness=.6,color=colors.HexColor('#C9D6D5')))
p('PERFIL PROFESIONAL','section')
p('Estudiante de Ingeniería Informática con conocimientos en programación y bases de datos. Me interesan las soluciones prácticas y el aprendizaje continuo. Busco una pasantía en IT para adquirir experiencia profesional, mejorar mis habilidades técnicas y aportar al equipo con compromiso, proactividad y rápida adaptación.')
p('EXPERIENCIA LABORAL','section')
p('SFORZA PROPIEDADES','job')
p('Atención al cliente y administración de bases de datos.')
story.append(Spacer(1,3))
p('ASISTENTE DE ABOGADO','job')
p('Asistencia en organización, documentación legal, redacción de documentos, atención al cliente, manejo de dinero y recibos.')
p('FORMACIÓN','section')
p('Ingeniería Informática','job')
p('Universidad Argentina de la Empresa (UADE)<br/>2022 - Actualidad · 40% de materias aprobadas')
story.append(Spacer(1,3))
p('Fundamentos de Programación','job')
p('Curso de la Universidad Tecnológica Nacional (UTN)<br/>2025')
p('HERRAMIENTAS','section')
p('Java (intermedio, aprendiendo Spring)<br/>Python (básico / intermedio)<br/>SQL · NoSQL<br/>Word · Excel')
p('IDIOMAS','section')
p('Español: nativo<br/>Inglés: intermedio B1')
doc=SimpleDocTemplate(str(out),pagesize=(595.28,841.89),leftMargin=48,rightMargin=48,topMargin=44,bottomMargin=40,title='CV - Facundo Emiliano Garómpolo',author='Facundo Emiliano Garómpolo')
doc.build(story)
print(out)
