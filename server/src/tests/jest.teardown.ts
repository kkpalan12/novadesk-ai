import { disconnectTestDatabase } from "./helpers/database";

export default async () => {
  await disconnectTestDatabase();
};
