import { usePrisma } from "../config/prisma";

export default defineNitroPlugin(() => {
  console.log("Prisma plugin loaded");
  const prisma = usePrisma();
  console.log("PrismaClient instance created");
  useNitroApp().hooks.hook("request", (event) => {
    event.context.prisma = prisma;
  });
});
