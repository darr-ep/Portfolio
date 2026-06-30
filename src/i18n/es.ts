export const es = {
  nav: {
    projects: 'Proyectos',
    services: 'Servicios',
    experience: 'Trayectoria',
    details: 'Detalles',
    contact: 'Contacto',
  },
  hero: {
    status: 'DISPONIBLE PARA TRABAJAR',
    scrollCta: 'DESLIZA PARA EXPLORAR',
    role: 'Frontend Developer',
  },
  services: {
    title: 'Servicios',
    web: {
      title: 'Desarrollo Web',
      description: 'Aplicaciones web modernas con tecnologías de vanguardia.',
    },
    design: {
      title: 'Diseño UI/UX',
      description: 'Interfaces elegantes y experiencias memorables.',
    },
    animation: {
      title: 'Animación & Motion',
      description: 'Interacciones fluidas que dan vida a tus productos.',
    },
  },
  projects: {
    title: 'Proyectos',
    viewMore: 'Ver más',
    viewAll: 'Ver todos',
    demo: 'Demo',
    repo: 'Código',
  },
  experience: {
    title: 'Trayectoria',
  },
  details: {
    title: 'Detalles',
    downloadCv: 'Descargar CV',
    technologies: 'Tecnologías',
  },
  contact: {
    title: '¿HACEMOS ALGO JUNTOS?',
    namePlaceholder: 'Tu nombre',
    emailPlaceholder: 'Tu correo',
    messagePlaceholder: 'Tu mensaje',
    submit: 'Enviar',
    sending: 'Enviando...',
    success: 'Mensaje enviado. ¡Gracias!',
    error: 'Algo salió mal. Inténtalo de nuevo.',
  },
  cv: {
    download: 'Descargar CV',
    print: 'Imprimir',
    experience: 'Experiencia',
    projects: 'Proyectos',
  },
  common: {
    loading: 'Cargando...',
    error: 'Error al cargar',
    empty: 'Sin contenido',
  },
} as const;

export type TranslationKeys = typeof es;
