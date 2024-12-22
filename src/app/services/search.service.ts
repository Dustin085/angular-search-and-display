import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, shareReplay, switchMap, tap } from 'rxjs';

interface SearchConfig {
  defaultPageSize: number;
}

// 有時會出現沒有author_name的物件
interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name?: string[];
    cover_edition_key: string;
    key: string;
    edition_key: string[];
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

  searchText$ = of('');
  pageSize$ = of(10);
  pageIndex$ = of(0);
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
  private _initFromUrl() {
    // 如果不setTimeout會得到空url
    setTimeout(() => {
      const queryParamMap = this.route.snapshot.queryParamMap;
      const INDEX_OFFSET = 1;
      const searchTextFromUrl = queryParamMap.get('searchText');
      const pageSizeFromUrl = queryParamMap.get('pageSize');
      const pageFromUrl = queryParamMap.get('page');
      if (searchTextFromUrl) {
        this.searchText = searchTextFromUrl;
      }
      this.pageSize = pageSizeFromUrl === null ? SEARCH_CONFIG.defaultPageSize : Number(pageSizeFromUrl);
      this.page = pageFromUrl === null ? 0 : Number(pageFromUrl) - INDEX_OFFSET;
      if (searchTextFromUrl != null) {
        this.submit();
      }
    }, 0);
  }

  set currentSearch(currentSearch: CurrentSearch) {
    this.currentSearch$.next(currentSearch);
  }

  set searchText(text: string) {
    this.searchText$ = of(text);
  };

  set page(page: number) {
    this.pageIndex$ = of(page);
  };

  set pageSize(pageSize: number) {
    this.pageSize$ = of(pageSize);
  };

  submit() {
    const newCurrentSearch: CurrentSearch = {
      searchText: '',
      pageSize: 10,
      page: 1,
    };
    const subText = this.searchText$.subscribe(val => {
      newCurrentSearch.searchText = val;
    });
    const subPageSize = this.pageSize$.subscribe(val => {
      newCurrentSearch.pageSize = val;
    });
    const subPageIndex = this.pageIndex$.subscribe(val => {
      const INDEX_OFFSET = 1;
      newCurrentSearch.page = val + INDEX_OFFSET;
    });
    this.currentSearch = newCurrentSearch;

    // 把search params放到queryParams，若searchText就把queryParams清空
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newCurrentSearch.searchText === '' ?
        { searchText: null, pageSize: null, page: null } : newCurrentSearch,
      queryParamsHandling: 'merge',
    });

    subText.unsubscribe();
    subPageSize.unsubscribe();
    subPageIndex.unsubscribe();
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
