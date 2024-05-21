import { PrismaClient } from '@prisma/client';
import * as data from './seed.json';
const prisma = new PrismaClient();
async function main() {
  let newCategory = 0;
  for (const item of data) {
    try {
      await prisma.category.create({
        data: item,
      });
      newCategory++;
    } catch (error) {}
  }

  console.log({ newCategory });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
