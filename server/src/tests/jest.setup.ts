import { connectTestDatabase, clearTestDatabase } from "./helpers/database";

beforeAll(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
});
