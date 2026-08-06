import { connectTestDatabase, clearDatabase } from "./helpers/database";

beforeAll(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});
