import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, effect, OnInit, OnDestroy, ElementRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { SidebarService } from '@services/sidebar.service';
import { AuthService } from '@core/auth/auth.service';
import { User, USER_ROLES } from '@core/models';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

type SectionKey = 'customer' | 'actions' | 'product' | 'ecommerce' | 'user' | 'shop' | 'inquiries';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-in', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-out', style({ opacity: 0 }))
            ])
        ]),
        trigger('expandCollapse', [
            state('void', style({
                height: '0',
                overflow: 'hidden',
                opacity: 0,
                margin: '0'
            })),
            state('*', style({
                height: '*',
                opacity: 1
            })),
            transition('void <=> *', [
                animate('200ms ease-in-out')
            ])
        ])
    ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  // Disable animations when sidebar is collapsed
  @HostBinding('@.disabled')
  get animationsDisabled(): boolean {
    return this.sidebarService.isCollapsed();
  }

  isUserDropdownOpen = signal<boolean>(false);
  currentUser: User | null = null;
  userFullName: string = '';
  userRole: string = '';
  userInitials: string = '';
  private destroy$ = new Subject<void>();

  // Section expansion states - all expanded by default
  private expandedSections = signal<Set<SectionKey>>(new Set(['customer', 'actions', 'product', 'ecommerce', 'user', 'shop', 'inquiries']));

  constructor(
    private sidebarService: SidebarService,
    public authService: AuthService,
    private router: Router,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {
    // Attach the outside-click listener only while the user dropdown is open,
    // instead of a permanent document-level HostListener.
    effect((onCleanup) => {
      if (!this.isUserDropdownOpen()) {
        return;
      }
      const handler = (event: Event) => {
        const userElement = this.elementRef.nativeElement.querySelector('.sidebar__user');
        if (userElement && !userElement.contains(event.target)) {
          this.isUserDropdownOpen.set(false);
        }
      };
      document.addEventListener('click', handler);
      onCleanup(() => document.removeEventListener('click', handler));
    });
  }

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.updateUserDisplay();
        this.cdr.markForCheck();
      });

    // Initialize with current user
    this.currentUser = this.authService.getCurrentUser();
    this.updateUserDisplay();

    // Active-link classes are computed from router.url in the template,
    // so re-check this OnPush component after each navigation.
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSection(section: SectionKey): void {
    this.expandedSections.update(sections => {
      const newSections = new Set(sections);
      if (newSections.has(section)) {
        newSections.delete(section);
      } else {
        newSections.add(section);
      }
      return newSections;
    });
  }

  isSectionExpanded(section: SectionKey): boolean {
    return this.expandedSections().has(section);
  }

  toggleUserDropdown(event: Event) {
    // Stop event propagation to prevent the document click handler from firing immediately
    event.stopPropagation();
    this.isUserDropdownOpen.update(value => !value);
  }

  updateUserDisplay(): void {
    if (this.currentUser) {
      // Set the user full name
      if (this.currentUser.firstName && this.currentUser.lastName) {
        this.userFullName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        // Generate initials from name (first letter of first and last name)
        this.userInitials = `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
      } else if (this.currentUser.firstName) {
        this.userFullName = this.currentUser.firstName;
        this.userInitials = this.currentUser.firstName[0].toUpperCase();
      } else {
        this.userFullName = this.currentUser.email;
        this.userInitials = this.currentUser.email[0].toUpperCase();
      }

      // Set user role (assuming roles is an array of strings)
      if (this.currentUser.roles && this.currentUser.roles.length > 0) {
        const role = this.currentUser.roles[1] || this.currentUser.roles[0];
        // Convert ROLE_USER to User, ROLE_ADMIN to Administrator, etc.
        this.userRole = role.replace('ROLE_', '').charAt(0).toUpperCase() +
          role.replace('ROLE_', '').slice(1).toLowerCase();
      } else {
        this.userRole = 'User';
      }
    }
  }

  get isCollapsed() {
    return this.sidebarService.isCollapsed;
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isRouteActive(basePath: string): boolean {
    return this.router.url.includes(`/${basePath}`);
  }

  /**
   * Check if current user is an Admin (Starlinger Admin)
   * This takes highest priority - if user has ADMIN role, show admin UI
   */
  get isAdmin(): boolean {
    return this.authService.hasRole(USER_ROLES.ADMIN);
  }

  /**
   * Check if current user is a Customer Admin (Client Admin)
   * Only true if user has CLIENT_ADMIN but NOT ADMIN
   */
  get isCustomerAdmin(): boolean {
    return this.authService.hasRole(USER_ROLES.CLIENT_ADMIN) && 
           !this.authService.hasRole(USER_ROLES.ADMIN);
  }

  /**
   * Check if current user is a Customer (Client)
   * Only true if user has CLIENT but NOT CLIENT_ADMIN or ADMIN
   */
  get isCustomer(): boolean {
    return this.authService.hasRole(USER_ROLES.CLIENT) && 
           !this.authService.hasRole(USER_ROLES.CLIENT_ADMIN) &&
           !this.authService.hasRole(USER_ROLES.ADMIN);
  }

  /**
   * Navigate to company profile page
   */
  navigateToCompany(): void {
    this.router.navigate(['/customer-admin/company']);
    this.isUserDropdownOpen.set(false);
  }

  /**
   * Navigate to settings page
   */
  navigateToSettings(): void {
    this.router.navigate(['/customer-admin/settings']);
    this.isUserDropdownOpen.set(false);
  }

  /**
   * Switch user functionality (placeholder)
   */
  switchUser(): void {
    // TODO: Implement user switching logic
    console.log('Switch user clicked');
    this.isUserDropdownOpen.set(false);
  }

  /**
   * Get the correct support link based on user role
   */
  getSupportLink(): string {
    if (this.isAdmin) {
      return '/admin/support-tickets/list';
    } else if (this.isCustomerAdmin) {
      return '/customer-admin/support';
    } else {
      return '/customer/support';
    }
  }

  /**
   * Get the correct documentation link based on user role
   */
  getDocumentationLink(): string {
    if (this.isAdmin) {
      return '/admin/documentation/list';
    } else if (this.isCustomerAdmin) {
      return '/customer-admin/documentation';
    } else {
      return '/customer/documentation';
    }
  }

  /**
   * Navigate to customer settings page
   */
  navigateToCustomerSettings(): void {
    this.router.navigate(['/customer/settings']);
    this.isUserDropdownOpen.set(false);
  }
}
