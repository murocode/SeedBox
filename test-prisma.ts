import { PrismaClient } from '@prisma/client';
import dns from 'dns';

async function main() {
  const prisma1 = new PrismaClient();
  console.time('prisma-connect-default');
  await prisma1.$connect();
  console.timeEnd('prisma-connect-default');
  await prisma1.$disconnect();

  dns.setDefaultResultOrder('ipv4first');
  const prisma2 = new PrismaClient();
  console.time('prisma-connect-ipv4first');
  await prisma2.$connect();
  console.timeEnd('prisma-connect-ipv4first');
  await prisma2.$disconnect();
}

main().catch(console.error);
