import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchComponent, SearchSuggestion } from '@app/ui-kit/molecules/search/search.component';
import { MobileMenuService } from '@services/mobile-menu.service';
import { AuthService } from '@core/auth/auth.service';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-top-bar',
    imports: [CommonModule, SearchComponent],
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit, OnDestroy {
    showMobileSearch = false;
    searchSuggestions: SearchSuggestion[] = [];
    searchLoading = false;

    private destroy$ = new Subject<void>();

    constructor(
        private mobileMenuService: MobileMenuService,
        private router: Router,
        public authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {}

    /**
     * Check if current user is Admin
     */
    get isAdmin(): boolean {
        return this.authService.hasRole('ROLE_ADMIN');
    }

    openMobileSearch(): void {
        this.showMobileSearch = !this.showMobileSearch;
    }

    closeMobileSearch(): void {
        this.showMobileSearch = false;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleMobileMenu(): void {
        this.mobileMenuService.toggle();
    }

    onSearch(query: string): void {
        this.searchLoading = true;
        // Admin search - search across admin resources
        setTimeout(() => {
            this.searchSuggestions = [
                { id: '1', label: 'Search Products', description: 'Find products', type: 'Products' },
                { id: '2', label: 'Search Orders', description: 'Find orders', type: 'Orders' },
                { id: '3', label: 'Search Users', description: 'Find users', type: 'Users' },
            ].filter(s => s.label.toLowerCase().includes(query.toLowerCase()));
            this.searchLoading = false;
            this.cdr.markForCheck();
        }, 300);
    }

    onSuggestionSelect(suggestion: SearchSuggestion): void {
        console.log('Selected:', suggestion);
    }
}
