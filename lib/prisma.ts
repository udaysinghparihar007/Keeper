import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const prismaClientSingleton = (): PrismaClient => {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | PrismaClient;
}

const prisma: PrismaClient = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
