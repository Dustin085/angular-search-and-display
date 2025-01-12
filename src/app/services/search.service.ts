import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, map, Observable, of, shareReplay, skipWhile, switchMap, take, tap } from 'rxjs';

interface SearchConfig {
  defaultPageSize: number;
}

// 有時會出現沒有author_name的物件
interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name?: string[];
    cover_edition_key?: string;
    key: string;
    edition_key?: string[];
  }[];
}

export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}

// BONUS: Use DI to update the config of SearchService to update page size
export const SEARCH_CONFIG: SearchConfig = {
  defaultPageSize: 10,
};

/**
 * Service for managing search state and operations
 * @public
 */

/**
 * @property {Observable<string>} searchText$ - Observable of the current search text in the input field
 * @property {Observable<number>} pageSize$ - Observable of the current page size
 * @property {Observable<number>} pageIndex$ - Observable of the current page index (0-based)
 * @property {Observable<CurrentSearch | null>} currentSearch$ - Observable of the current search parameters
 * @property {Signal<boolean>} isPending - Signal of isPending the api request
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
 * @method pageSize - Updates the current page size
 * @param {number} pageSize - The new pageSize number
 */

/**
 * @method submit - Submits the current search text that updates the current search parameters
 */

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private $http = inject(HttpClient);

  searchText$ = new BehaviorSubject('');
  pageSize$ = new BehaviorSubject(10);
  pageIndex$ = new BehaviorSubject(0);
  currentSearch$ = new BehaviorSubject<CurrentSearch | null>({
    searchText: '',
    pageSize: 10,
    page: 1,
  });
  isPending = signal<boolean>(false);

  constructor(private router: Router, private route: ActivatedRoute) {
    this._initFromUrl();
  }

  // BONUS: Keep the current search params in the URL that allow users to refresh the page and search again
  public _initFromUrl() {
    this.router.events.pipe(
      skipWhile(event => !(event instanceof NavigationEnd)),
      take(1),
    ).subscribe(
      () => {
        const { queryParamMap } = this.route.snapshot;
        const INDEX_OFFSET = 1;

        this.searchText = queryParamMap.get('searchText') || '';
        this.pageSize = Number(queryParamMap.get('pageSize')) || SEARCH_CONFIG.defaultPageSize;
        this.page = Number(queryParamMap.get('page')) - INDEX_OFFSET || 0;

        if (this.searchText$.value) {
          this.submit();
        }
      }
    );
  }

  set currentSearch(currentSearch: CurrentSearch) {
    this.currentSearch$.next(currentSearch);
  }

  set searchText(text: string) {
    this.searchText$.next(text);
  };

  set page(page: number) {
    this.pageIndex$.next(page);
  };

  set pageSize(pageSize: number) {
    this.pageSize$.next(pageSize);
  };

  submit() {
    const INDEX_OFFSET = 1;
    this.currentSearch = {
      searchText: this.searchText$.value,
      pageSize: this.pageSize$.value,
      page: this.pageIndex$.value + INDEX_OFFSET,
    };

    // 把search params放到queryParams，若searchText就把queryParams清空
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.currentSearch$.value?.searchText != '' ?
        this.currentSearch$.value : { searchText: null, pageSize: null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  searchResults$ = this.currentSearch$
    // switchMap可以把一個observable轉換成另一個observable，同時，會把之前還沒完成的observable取消
    .pipe(switchMap((currentSearch) => {
      if (!currentSearch) {
        return of(null);
      }
      if (currentSearch.searchText === '') {
        return of(null);
      }
      return this.searchBooks(currentSearch);
      // shareReplay可以讓async pipe共用取得的資料(不重複request)，shareReplay可以讓後來的subscriber也看到之前emit過的結果
    })).pipe(shareReplay());

  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    const { searchText, pageSize, page } = currentSearch;

    this.isPending.set(true);

    const searchQuery = searchText.split(' ').join('+').toLowerCase();
    return this.$http.get<SearchResult>(
      `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
    )
      .pipe(tap({
        error: (err) => { this.isPending.set(false); console.log(err) },
        complete: () => { this.isPending.set(false); }
      }));
  }
}
