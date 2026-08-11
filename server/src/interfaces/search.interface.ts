export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
}

export interface GlobalSearchResult {
  query: string;
  workspaces: SearchResult;
  projects: SearchResult;
  tasks: SearchResult;
  comments: SearchResult;
  total: number;
}
