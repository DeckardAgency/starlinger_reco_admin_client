import { ApplicationConfig, provideZoneChangeDetection, Provider } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from '@core/auth/auth.interceptor';

// Build providers array for HTTP interceptors
function getHttpInterceptorProviders(): Provider[] {
  const providers: Provider[] = [];

  // Add auth interceptor for JWT token handling
  providers.push({
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  });

  return providers;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),
    ...getHttpInterceptorProviders()
  ]
};
