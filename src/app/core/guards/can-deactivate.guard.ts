import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
  getComponentName: () => string;
}

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(
    component: CanComponentDeactivate,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): boolean | Observable<boolean> {

    // If component has no unsaved data, allow navigation
    if (component.canDeactivate()) {
      return true;
    }

    // Determine the destination based on the next route
    const destination = nextState?.url?.includes('input-form')
      ? 'Use input form'
      : 'Use template';

    // Show confirmation dialog
    const confirmed = confirm(
      `If you switch to ${destination} you lose all inserted data from ${destination}`
    );

    return confirmed;
  }
}
