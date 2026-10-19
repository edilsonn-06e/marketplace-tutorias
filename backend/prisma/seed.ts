import { PrismaClient, Modality } from '@prisma/client';

const prisma = new PrismaClient();

const catalog: Record<string, string[]> = {
  Idiomas: ['Inglés Conversacional', 'Francés Básico'],
  Deportes: ['Natación', 'Fútbol'],
  Ciencias: ['Cálculo Multivariable', 'Física General'],
  Tecnología: ['Desarrollo Web', 'Python desde Cero'],
  Posgrado: ['Metodología de la Investigación', 'Estadística para Tesis'],
};

const tutors = [
  {
    googleId: 'seed-tutor-1', email: 'ana.tutora@example.com', name: 'Ana López',
    address: 'Zona 10, Ciudad de Guatemala', lat: 14.6037, lng: -90.4892,
    bio: 'Profesora de inglés con 8 años de experiencia y certificación C2.',
    category: 'Inglés Conversacional', title: 'Inglés conversacional para principiantes',
    modalities: [Modality.VIRTUAL, Modality.STUDENT_HOME], hourlyRate: 100, perKmRate: 4,
  },
  {
    googleId: 'seed-tutor-2', email: 'carlos.tutor@example.com', name: 'Carlos Méndez',
    address: 'Mixco, Guatemala', lat: 14.6333, lng: -90.6064,
    bio: 'Ingeniero y catedrático de matemática universitaria, especialista en cálculo.',
    category: 'Cálculo Multivariable', title: 'Cálculo multivariable para ingeniería',
    modalities: [Modality.VIRTUAL, Modality.TUTOR_PLACE, Modality.STUDENT_HOME], hourlyRate: 150, perKmRate: 5,
  },
  {
    googleId: 'seed-tutor-3', email: 'maria.tutora@example.com', name: 'María Pérez',
    address: 'Antigua Guatemala', lat: 14.5586, lng: -90.7295,
    bio: 'Entrenadora de natación certificada, clases para niños y adultos.',
    category: 'Natación', title: 'Natación desde cero',
    modalities: [Modality.TUTOR_PLACE], hourlyRate: 120, perKmRate: 0,
  },
];

async function main() {
  const categoryIds: Record<string, string> = {};

  for (const [parentName, children] of Object.entries(catalog)) {
    const parent = await prisma.category.upsert({
      where: { name: parentName }, update: {}, create: { name: parentName },
    });
    for (const childName of children) {
      const child = await prisma.category.upsert({
        where: { name: childName },
        update: { parentId: parent.id },
        create: { name: childName, parentId: parent.id },
      });
      categoryIds[childName] = child.id;
    }
  }

  for (const t of tutors) {
    await prisma.user.upsert({
      where: { googleId: t.googleId },
      update: {},
      create: {
        googleId: t.googleId, email: t.email, name: t.name,
        role: 'TUTOR', onboarded: true, phone: '55551234', gender: 'UNSPECIFIED',
        address: t.address, lat: t.lat, lng: t.lng, idDocument: '1234567890101',
        tutorProfile: {
          create: { bio: t.bio, cvUrl: 'https://example.com/cv.pdf', baseRate: t.hourlyRate, approval: 'APPROVED' },
        },
        availability: {
          create: [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startMinute: 8 * 60, endMinute: 18 * 60 })),
        },
        offers: {
          create: {
            title: t.title, categoryId: categoryIds[t.category],
            modalities: t.modalities, hourlyRate: t.hourlyRate, perKmRate: t.perKmRate,
          },
        },
      },
    });
  }

  await prisma.user.upsert({
    where: { googleId: 'seed-student-1' },
    update: {},
    create: {
      googleId: 'seed-student-1', email: 'luis.estudiante@example.com', name: 'Luis García',
      role: 'STUDENT', onboarded: true, phone: '55554321', gender: 'MALE',
      address: 'Zona 1, Ciudad de Guatemala', lat: 14.6417, lng: -90.5133, idDocument: '9876543210101',
    },
  });

  console.log('Seed completado');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });