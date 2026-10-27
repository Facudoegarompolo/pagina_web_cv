const bi = (es, en) => ({ es, en });
export const seed = {
  profile: { name: 'Facundo Garómpolo', title: bi('Estudiante de Ingeniería Informática', 'Computer Engineering student'), intro: bi('Me interesan las soluciones prácticas y el aprendizaje continuo. Busco una pasantía en IT para adquirir experiencia profesional, mejorar mis habilidades técnicas y aportar al equipo con compromiso, proactividad y rápida adaptación.', 'I am interested in practical solutions and continuous learning. I am looking for an IT internship to gain professional experience, improve my technical skills, and contribute to the team with commitment, proactivity and quick adaptation.'), location: bi('San Miguel, Buenos Aires', 'San Miguel, Buenos Aires'), photo: '', photoAlt: bi('', ''), photoX: 50, photoY: 50, photoZoom: 1 },
  experience: [
    { id: 'sforza', visible: true, title: bi('Atención al cliente y administración de bases de datos', 'Customer service and database administration'), organization: bi('Sforza Propiedades', 'Sforza Propiedades Real Estate'), dates: bi('', ''), description: bi('Atención al cliente y administración de bases de datos.', 'Customer service and database administration.'), tasks: bi('', '') },
    { id: 'legal', visible: true, title: bi('Asistente de abogado', 'Lawyer assistant'), organization: bi('', ''), dates: bi('', ''), description: bi('Asistencia en organización, documentación legal, redacción de documentos, atención al cliente, manejo de dinero y recibos.', 'Help with organization, legal documents, writing documents, customer service, money handling and receipts.'), tasks: bi('', '') }
  ],
  education: [
    { id: 'uade', visible: true, title: bi('Ingeniería Informática', 'Computer Engineering'), organization: bi('Universidad Argentina de la Empresa (UADE)', 'Universidad Argentina de la Empresa (UADE)'), dates: bi('2022 – Actualidad', '2022 – Present'), description: bi('', ''), status: bi('En curso', 'In progress'), progress: 40, certificate: '', certificateVisible: false },
    { id: 'utn', visible: true, title: bi('Fundamentos de Programación', 'Programming Fundamentals'), organization: bi('Universidad Tecnológica Nacional (UTN)', 'National Technological University (UTN)'), dates: bi('2025', '2025'), description: bi('', ''), status: bi('Curso', 'Course'), progress: null, certificate: '', certificateVisible: false }
  ],
  skills: [
    ['Java', 'Intermedio · aprendiendo Spring', 'Intermediate · learning Spring'], ['Python', 'Básico / intermedio', 'Basic / intermediate'], ['SQL', '', ''], ['NoSQL', '', ''], ['Word · Excel', '', ''], ['Español', 'Nativo', 'Native'], ['Inglés', 'Intermedio B1', 'Intermediate B1']
  ].map(([name, es, en], i) => ({ id: `skill-${i}`, visible: true, title: bi(name, name === 'Español' ? 'Spanish' : name === 'Inglés' ? 'English' : name), description: bi(es, en) })),
  projects: [],
  contact: { email: 'facundoegarompolo@gmail.com', phone: '1151098800', linkedin: 'https://www.linkedin.com/in/fgarompolo', github: '', links: [], cv: { es: '', en: '' } }
};
