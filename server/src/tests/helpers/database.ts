import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

export async function connectTestDatabase() {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());
}

export async function clearTestDatabase() {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
}

export async function disconnectTestDatabase() {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
}
