import { PrismaClient, Gender } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Nature', description: 'Names inspired by nature and the elements.' },
  { name: 'Spiritual', description: 'Names with spiritual and devotional meanings.' },
  { name: 'Modern', description: 'Contemporary names with a fresh feel.' },
];

const names: Array<{
  nameRomanized: string;
  nameNative: string;
  startingSyllable: string;
  gender: Gender;
  meaning: string;
  categories: string[];
}> = [
  { nameRomanized: 'Aarav', nameNative: 'आरव', startingSyllable: 'Aa', gender: 'BOY', meaning: 'Peaceful and calm.', categories: ['Modern', 'Spiritual'] },
  { nameRomanized: 'Aditya', nameNative: 'आदित्य', startingSyllable: 'A', gender: 'BOY', meaning: 'The sun; radiant and bright.', categories: ['Nature', 'Spiritual'] },
  { nameRomanized: 'Arjun', nameNative: 'अर्जुन', startingSyllable: 'Ar', gender: 'BOY', meaning: 'Bright, shining, and courageous.', categories: ['Spiritual'] },
  { nameRomanized: 'Dhruv', nameNative: 'ध्रुव', startingSyllable: 'Dha', gender: 'BOY', meaning: 'Steady and unwavering, like the pole star.', categories: ['Nature', 'Spiritual'] },
  { nameRomanized: 'Ishaan', nameNative: 'ईशान', startingSyllable: 'I', gender: 'BOY', meaning: 'The sun and a divine guardian.', categories: ['Spiritual', 'Modern'] },
  { nameRomanized: 'Kabir', nameNative: 'कबीर', startingSyllable: 'Ka', gender: 'BOY', meaning: 'Great and powerful.', categories: ['Spiritual', 'Modern'] },
  { nameRomanized: 'Neel', nameNative: 'नील', startingSyllable: 'Ne', gender: 'BOY', meaning: 'Blue, like the sky or ocean.', categories: ['Nature', 'Modern'] },
  { nameRomanized: 'Vihaan', nameNative: 'विहान', startingSyllable: 'Vi', gender: 'BOY', meaning: 'Dawn and the first rays of a new day.', categories: ['Nature', 'Modern'] },
  { nameRomanized: 'Anaya', nameNative: 'अनाया', startingSyllable: 'A', gender: 'GIRL', meaning: 'Caring, protected, and gracious.', categories: ['Modern', 'Spiritual'] },
  { nameRomanized: 'Diya', nameNative: 'दिया', startingSyllable: 'Di', gender: 'GIRL', meaning: 'A lamp or a source of light.', categories: ['Spiritual', 'Modern'] },
  { nameRomanized: 'Ira', nameNative: 'इरा', startingSyllable: 'I', gender: 'GIRL', meaning: 'Earth and a beloved goddess of wisdom.', categories: ['Nature', 'Spiritual'] },
  { nameRomanized: 'Kavya', nameNative: 'काव्या', startingSyllable: 'Ka', gender: 'GIRL', meaning: 'Poetry and graceful expression.', categories: ['Modern'] },
  { nameRomanized: 'Meera', nameNative: 'मीरा', startingSyllable: 'Me', gender: 'GIRL', meaning: 'Devoted and loving.', categories: ['Spiritual'] },
  { nameRomanized: 'Tara', nameNative: 'तारा', startingSyllable: 'Ta', gender: 'GIRL', meaning: 'Star; radiant and guiding.', categories: ['Nature', 'Spiritual'] },
  { nameRomanized: 'Veda', nameNative: 'वेदा', startingSyllable: 'Ve', gender: 'GIRL', meaning: 'Knowledge and sacred wisdom.', categories: ['Spiritual', 'Modern'] },
  { nameRomanized: 'Aarohi', nameNative: 'आरोही', startingSyllable: 'Aa', gender: 'GIRL', meaning: 'Ascending and progressive.', categories: ['Modern'] },
  { nameRomanized: 'Aadi', nameNative: 'आदि', startingSyllable: 'Aa', gender: 'UNISEX', meaning: 'The beginning and the first.', categories: ['Modern', 'Spiritual'] },
  { nameRomanized: 'Kiran', nameNative: 'किरण', startingSyllable: 'Ki', gender: 'UNISEX', meaning: 'Ray of light.', categories: ['Nature', 'Modern'] },
];

async function main() {
  const categoryRecords = new Map<string, string>();
  for (const category of categories) {
    const record = await prisma.nameCategory.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
    categoryRecords.set(record.name, record.id);
  }

  for (const [index, item] of names.entries()) {
    const record = await prisma.name.upsert({
      where: { nameRomanized: item.nameRomanized },
      update: {
        nameNative: item.nameNative,
        startingSyllable: item.startingSyllable,
        gender: item.gender,
        meaning: item.meaning,
        origin: 'Sanskrit',
        syllablesCount: item.nameRomanized.length > 5 ? 3 : 2,
        characterLength: item.nameRomanized.length,
        popularityScore: 90 - index * 3,
        trendScore: 80 - index * 2,
      },
      create: {
        nameRomanized: item.nameRomanized,
        nameNative: item.nameNative,
        startingSyllable: item.startingSyllable,
        gender: item.gender,
        meaning: item.meaning,
        origin: 'Sanskrit',
        syllablesCount: item.nameRomanized.length > 5 ? 3 : 2,
        characterLength: item.nameRomanized.length,
        popularityScore: 90 - index * 3,
        trendScore: 80 - index * 2,
      },
    });

    for (const categoryName of item.categories) {
      const categoryId = categoryRecords.get(categoryName);
      if (!categoryId) continue;
      await prisma.nameCategoryMapping.upsert({
        where: { nameId_categoryId: { nameId: record.id, categoryId } },
        update: {},
        create: { nameId: record.id, categoryId },
      });
    }
  }

  console.log(`Seeded ${names.length} names across ${categories.length} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
