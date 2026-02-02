import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarService } from '@services/sidebar.service';
import { AuthService } from '@core/auth/auth.service';
import { TopBarComponent } from "./topbar/top-bar.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { MobileMenuComponent } from "./mobile-menu/mobile-menu.component";

@Component({
    selector: 'app-main-layout',
    imports: [
        CommonModule,
        RouterOutlet,
        SidebarComponent,
        TopBarComponent,
        MobileMenuComponent
    ],
    template: `
    <div class="app">
        <app-top-bar></app-top-bar>
        <app-sidebar></app-sidebar>
        <app-mobile-menu></app-mobile-menu>
        <main class="app__main" [class.app__main--collapsed]="sidebarService.isCollapsed()">
        <router-outlet></router-outlet>
        </main>
    </div>
  `,
    styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
    sidebarService = inject(SidebarService);
    private authService = inject(AuthService);
}
