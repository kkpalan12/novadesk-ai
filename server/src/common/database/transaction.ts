import mongoose, { ClientSession } from "mongoose";

export async function withTransaction<T>(
  callback: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await callback(session);

    await session.commitTransaction();

    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
