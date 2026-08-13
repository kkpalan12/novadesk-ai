import {
  ClientSession,
  Document,
  FilterQuery,
  Model,
  PipelineStage,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from "mongoose";

export abstract class BaseRepository<T extends Document> {
  protected constructor(protected readonly model: Model<T>) {}

  /**
   * Create document
   */
  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const [document] = await this.model.create([data], {
      session,
    });

    return document;
  }

  /**
   * Find document by ID
   */
  async findById(
    id: string,
    projection?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<T | null> {
    return this.model.findById(id, projection, options).exec();
  }

  /**
   * Find one document
   */
  async findOne(
    filter: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<T | null> {
    return this.model.findOne(filter, projection, options).exec();
  }

  /**
   * Find documents
   */
  async find(
    filter: FilterQuery<T> = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<T[]> {
    return this.model.find(filter, projection, options).exec();
  }

  /**
   * Update document by ID
   */
  async updateById(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, update, {
        ...options,
        session,
      })
      .exec();
  }

  /**
   * Delete document by ID
   */
  async deleteById(id: string, session?: ClientSession): Promise<T | null> {
    return this.model
      .findByIdAndDelete(id, {
        session,
      })
      .exec();
  }

  /**
   * Check whether a document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    return !!(await this.model.exists(filter).exec());
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  /**
   * Aggregate documents
   */
  async aggregate<R = unknown>(pipeline: PipelineStage[]): Promise<R[]> {
    return this.model.aggregate<R>(pipeline).exec();
  }
}
