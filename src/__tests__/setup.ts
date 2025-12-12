/** @format */

// Mock Prisma Client
jest.mock("../lib/db", () => ({
  prisma: {
    report: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    activity: {
      createMany: jest.fn(),
      create: jest.fn(),
    },
    upvote: {
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(10000);
