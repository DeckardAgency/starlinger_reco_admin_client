import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopBarComponent } from './layout/topbar/top-bar.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SidebarService } from '@services/sidebar.service';
import { AuthService } from '@core/auth/auth.service';
import { MobileMenuComponent } from './layout/mobile-menu/mobile-menu.component';

@Component({
    selector: 'app-root',
    imports: [
      RouterOutlet,
      SidebarComponent,
      TopBarComponent,
      AsyncPipe,
      NgIf,
      MobileMenuComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'starlinger_reco_admin_client';
  currentRoute: string = '';
  isAuthenticated: boolean = false;
  isAuthPage: boolean = false;
  is404Page: boolean = false;

  private readonly authRoutes = ['/login', '/forgot-password'];

  private destroyRef = inject(DestroyRef);

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private authService: AuthService
  ) {
    // Subscribe to router events to keep track of current route
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
      this.isAuthPage = this.authRoutes.some(route => event.url.startsWith(route));
      this.is404Page = event.url === '/404' || event.url.startsWith('/404?');
    });

    // Initialize current route
    this.currentRoute = this.router.url;
    this.isAuthPage = this.authRoutes.some(route => this.router.url.startsWith(route));
    this.is404Page = this.router.url === '/404' || this.router.url.startsWith('/404?');

    // Subscribe to authentication state changes
    this.authService.isAuthenticated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });
  }

  ngOnInit(): void {
    // Admin app initialization
  }
}
