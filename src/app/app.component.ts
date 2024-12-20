import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { concatAll, map, Observable, of, switchMap } from 'rxjs';
import { CurrentSearch, SearchService } from './services/search.service';

interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name: string[];
    cover_edition_key: string;
  }[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatPaginatorModule,
  ],
  // BONUS: Use DI to update the config of SearchService to update page size
})
export class AppComponent {
  private $http = inject(HttpClient);

  // TODO: Create a SearchService and use DI to inject it
  // Check app/services/search.service.ts for the implementation
  searchService = inject(SearchService);
  // $search = {
  //   searchText$: of(''),
  //   pageSize$: of(10),
  //   pageIndex$: of(0),
  //   currentSearch$: of<CurrentSearch | null>({
  //     searchText: '',
  //     pageSize: 10,
  //     page: 1,
  //   }),

  //   set searchText(text: string) { },
  //   set page(page: number) { },
  //   submit: () => { },
  // };

  // TODO: Implement this observable to call the searchBooks() function
  // Hint: Use RxJS operators to solve these issues
  searchResults$ = this.searchService.searchResults$;
  // searchResults$ = this.searchService.currentSearch$
  //   .pipe(map((data) => data ? this.searchBooks(data) : of({
  //     num_found: 0,
  //     docs: [],
  //   })))
  //   .pipe(concatAll());

  onSearchInputChange(event: Event) {
    // this.$search.searchText = (event.target as HTMLInputElement).value;
    this.searchService.searchText = (event.target as HTMLInputElement).value;
  }

  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    console.log('searching');
    const { searchText, pageSize, page } = currentSearch;

    const searchQuery = searchText.split(' ').join('+').toLowerCase();

    return this.$http.get<SearchResult>(
      `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
    );
  }
}
