import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { GlobalSearchResponse } from '../models/search.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly api = inject(ApiService);

  search(query: string): Observable<GlobalSearchResponse> {
    const encodedQuery = encodeURIComponent(query.trim());

    return this.api.get<GlobalSearchResponse>(`/search?q=${encodedQuery}`);
  }
}
