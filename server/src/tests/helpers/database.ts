// Shared database test helpers
export {};
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

export async function connectTestDatabase() {
  mongoServer = await MongoMemoryServer.create();

  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
}

export async function clearDatabase() {
  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function disconnectTestDatabase() {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
}
