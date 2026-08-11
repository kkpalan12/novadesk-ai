import { SearchRepository } from "../repositories/search.repository";

export class SearchService {
  private readonly repository = new SearchRepository();

  async search(userId: string, query: string) {
    return this.repository.search(userId, query.trim());
  }
}
