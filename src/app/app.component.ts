import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SearchService } from './services/search.service';

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
  $searchService = inject(SearchService);
  // TODO: Implement this observable to call the searchBooks() function
  // Hint: Use RxJS operators to solve these issues
  searchResults$ = this.$searchService.searchResults$;
  isPendingBooksSearch = this.$searchService.isPending;

  page(event: PageEvent) {
    if (this.$searchService.page === event.pageIndex &&
      this.$searchService.pageSize === event.pageSize) {
      return;
    };
    if (event.previousPageIndex != event.pageIndex) {
      this.$searchService.page = event.pageIndex;
    };
    this.$searchService.pageSize = event.pageSize;
    this.$searchService.submit();
  };

  onSearchInputChange(event: Event) {
    this.$searchService.searchText = (event.target as HTMLInputElement).value;
  }
}
