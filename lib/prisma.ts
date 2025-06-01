import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

// Add type declaration for the global object with prisma property
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = global.prisma || new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'], // Optional: enable query logging
  });
} else {
  prisma = global.prisma || new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'], // Optional: enable query logging
  });
  global.prisma = prisma;
}

export default prisma;
