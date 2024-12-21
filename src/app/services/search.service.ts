import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, concatAll, map, Observable, of, share, shareReplay, switchMap, tap, throwError } from 'rxjs';

interface SearchConfig {
  defaultPageSize?: number;
}

interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name: string[];
    cover_edition_key: string;
    key: string;
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
    console.log(`new currentSearch:`, currentSearch);
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
    console.log('submit start');
    const newCurrentSearch: CurrentSearch = {
      searchText: '',
      pageSize: 10,
      page: 1,
    };
    const subText = this.searchText$.subscribe((val) => {
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
    subText.unsubscribe();
    subPageSize.unsubscribe();
    subPageIndex.unsubscribe();
    console.log('submit end');
  }


  // searchResults$ = this.currentSearch$
  //   .pipe(map((data) => {
  //     if (!data) {
  //       console.log('no data');
  //       return of();
  //     }
  //     if (data.searchText === '') {
  //       console.log('no searchText');
  //       return of();
  //     }
  //     return this.searchBooks(data);
  //     // concatAll可以把多個observable結合成一個，share可以讓async pipe共用取得的資料(不重複request)
  //   })).pipe(concatAll()).pipe(shareReplay());

  searchResults$ = this.currentSearch$
    // switchMap可以把一個observable轉換成另一個observable，同時，會把之前還沒完成的observable取消
    .pipe(switchMap((data) => {
      if (!data) {
        console.log('no data');
        return of();
      }
      if (data.searchText === '') {
        console.log('no searchText');
        return of();
      }
      return this.searchBooks(data);
      // share可以讓async pipe共用取得的資料(不重複request)
    })).pipe(shareReplay());

  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    console.log('searching');
    const { searchText, pageSize, page } = currentSearch;

    const searchQuery = searchText.split(' ').join('+').toLowerCase();

    return this.$http.get<SearchResult>(
      `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
    )
      .pipe(tap({ complete: () => console.log('search completed') }))
      .pipe(map((data) => {
        console.log(data);
        return data;
      }));
  }
}
