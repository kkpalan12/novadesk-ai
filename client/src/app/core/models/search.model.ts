export interface SearchUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
}

export interface GlobalSearchResult {
  query: string;

  users: SearchResult<SearchUser>;

  workspaces: SearchResult<unknown>;

  projects: SearchResult<unknown>;

  tasks: SearchResult<unknown>;

  comments: SearchResult<unknown>;

  total: number;
}

export interface GlobalSearchResponse {
  success: boolean;
  message: string;
  data: GlobalSearchResult;
}
