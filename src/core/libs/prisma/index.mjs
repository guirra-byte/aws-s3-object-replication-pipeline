import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
function createConnection() {
  let prismaClient;
  return async () => {
    if (prismaClient) return prismaClient;

    const connectionUrl = new URL(process.env.DATABASE_URL);
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: connectionUrl.toString(),
        },
      },
      log: ['warn', 'error'],
    });

    prisma.$connect()
      .catch((err) => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
      });

    const gracefulShutdown = async () => {
      console.log('Closing database connection...');
      await prisma?.$disconnect();
      process.exit(0);
    };

    process.on('beforeExit', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    
    return prismaClient;
  }
}

const connection = createConnection();
const prisma = await connection();

export { prisma };