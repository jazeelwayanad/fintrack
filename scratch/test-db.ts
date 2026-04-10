import { prisma } from "../src/lib/prisma"

async function test() {
  try {
    console.log("Checking database connection...")
    await prisma.$connect()
    console.log("Connected successfully!")
    const users = await prisma.user.count()
    console.log("User count:", users)
  } catch (err) {
    console.error("Database connection failed:", err)
  } finally {
    await prisma.$disconnect()
  }
}

test()
