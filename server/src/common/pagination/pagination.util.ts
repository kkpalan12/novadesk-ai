import { FilterQuery, Model, Query } from "mongoose";

import { PaginationOptions, PaginationResult } from "./pagination.interface";

export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: PaginationOptions,
  queryBuilder?: (
    query: Query<unknown[], unknown>,
  ) => Query<unknown[], unknown>,
): Promise<PaginationResult<T>> {
  const { page, limit } = options;

  const skip = (page - 1) * limit;

  let query = model.find(filter);

  if (queryBuilder) {
    query = queryBuilder(query as Query<unknown[], unknown>) as typeof query;
  }

  query.skip(skip).limit(limit);

  const [data, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
