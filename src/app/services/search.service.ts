import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, concatAll, map, Observable, of } from 'rxjs';

interface SearchConfig {
  defaultPageSize?: number;
}

interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name: string[];
    cover_edition_key: string;
  }[];
}

export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}

// export interface SearchResult {
//   num_found: number;
//   docs: {
//     title: string;
//     author_name: string[];
//     cover_edition_key: string;
//   }[];
// }

// BONUS: Use DI to update the config of SearchService to update page size
export const SEARCH_CONFIG = undefined;

/**
 * Service for managing search state and operations
 * @public
 */

/**
 * @property {Observable<string>} searchText$ - Observable of the current search text in the input field
 * @property {Observable<number>} pageSize$ - Observable of the current page size
 * @property {Observable<number>} pageIndex$ - Observable of the current page index (0-based)
 * @property {Observable<CurrentSearch | null>} currentSearch$ - Observable of the current search parameters
 */

/**
 * @method searchText - Updates the current search text observable
 * @param {string} text - The new search text
 */

/**
 * @method page - Updates the current page number
 * @param {number} page - The new page number (1-based)
 */

/**
 * @method submit - Submits the current search text that updates the current search parameters
 */

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private $http = inject(HttpClient);

  searchText$ = of('');
  pageSize$ = of(10);
  pageIndex$ = of(0);
  currentSearch$ = new BehaviorSubject<CurrentSearch | null>({
    searchText: '',
    pageSize: 10,
    page: 1,
  });

  constructor(private router: Router) {
    this._initFromUrl();
  }

  // BONUS: Keep the current search params in the URL that allow users to refresh the page and search again
  private _initFromUrl() { }

  set currentSearch(currentSearch: CurrentSearch) {
    this.currentSearch$.next(currentSearch);
  }

  set searchText(text: string) {
    this.searchText$ = of(text);
  };

  set page(page: number) { }

  submit() {
    console.log('submit start');
    const newCurrentSearch: CurrentSearch = {
      searchText: '',
      pageSize: 10,
      page: 1,
    };
    this.searchText$.subscribe((val) => {
      newCurrentSearch.searchText = val;
    });
    this.pageSize$.subscribe(val => {
      newCurrentSearch.pageSize = val;
    });
    this.pageIndex$.subscribe(val => {
      const INDEX_OFFSET = 1;
      newCurrentSearch.page = val + INDEX_OFFSET;
    });
    this.currentSearch = newCurrentSearch;

    this.currentSearch$.subscribe(val => {
      if (!val) {
        return;
      }
      console.log(val);
    });
    console.log('submit end');
  }

  searchResults$ = this.currentSearch$
    .pipe(map((data) => data ? this.searchBooks(data) : of({
      num_found: 0,
      docs: [],
    })))
    .pipe(concatAll());

  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    console.log('searching');
    const { searchText, pageSize, page } = currentSearch;

    const searchQuery = searchText.split(' ').join('+').toLowerCase();

    return this.$http.get<SearchResult>(
      `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
    );
  }
}
