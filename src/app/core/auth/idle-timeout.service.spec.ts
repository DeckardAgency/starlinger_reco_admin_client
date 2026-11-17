import { NgZone } from '@angular/core';
import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import {
  IdleTimeoutService,
  DEFAULT_IDLE_TIMEOUT_MINUTES,
  IDLE_LAST_ACTIVITY_KEY
} from './idle-timeout.service';

describe('IdleTimeoutService', () => {
  const TIMEOUT_MS = DEFAULT_IDLE_TIMEOUT_MINUTES * 60_000;
  const MINUTE = 60_000;

  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let service: IdleTimeoutService;

  // Created inside each fakeAsync test so the service's timer and Date.now() use the fake clock.
  function create(): IdleTimeoutService {
    service = TestBed.inject(IdleTimeoutService);
    return service;
  }

  function stored(): number | null {
    const raw = localStorage.getItem(IDLE_LAST_ACTIVITY_KEY);
    return raw === null ? null : Number(raw);
  }

  function expectLoggedOut(): void {
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login'], { queryParams: { reason: 'idle' } });
  }

  beforeEach(() => {
    localStorage.removeItem(IDLE_LAST_ACTIVITY_KEY);
    authService = jasmine.createSpyObj('AuthService', ['logout']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        IdleTimeoutService,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  afterEach(() => {
    service?.stop();
    localStorage.removeItem(IDLE_LAST_ACTIVITY_KEY);
  });

  it('defaults to 30 minutes', () => {
    expect(DEFAULT_IDLE_TIMEOUT_MINUTES).toBe(30);
  });

  it('logs out after the timeout without activity', fakeAsync(() => {
    create().start();

    tick(TIMEOUT_MS - MINUTE);
    expect(authService.logout).not.toHaveBeenCalled();

    tick(MINUTE);
    expectLoggedOut();
    expect(stored()).toBeNull();
    discardPeriodicTasks();
  }));

  it('activity postpones the logout', fakeAsync(() => {
    create().start();

    tick(TIMEOUT_MS - MINUTE);
    document.dispatchEvent(new Event('keydown'));

    tick(TIMEOUT_MS - MINUTE);
    expect(authService.logout).not.toHaveBeenCalled();

    tick(MINUTE);
    expectLoggedOut();
    discardPeriodicTasks();
  }));

  it('counts navigation as activity', fakeAsync(() => {
    create().start();

    tick(TIMEOUT_MS - MINUTE);
    service.notifyNavigation();

    tick(TIMEOUT_MS - MINUTE);
    expect(authService.logout).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('stays alive while another tab reports activity', fakeAsync(() => {
    create().start();

    tick(TIMEOUT_MS - MINUTE);
    // Another tab writes a fresh timestamp
    localStorage.setItem(IDLE_LAST_ACTIVITY_KEY, String(Date.now()));

    tick(TIMEOUT_MS - MINUTE);
    expect(authService.logout).not.toHaveBeenCalled();

    tick(MINUTE);
    expectLoggedOut();
    discardPeriodicTasks();
  }));

  it('ends a session that was already idle past the limit when started', fakeAsync(() => {
    localStorage.setItem(IDLE_LAST_ACTIVITY_KEY, String(Date.now() - TIMEOUT_MS - 1));

    create().start();

    expectLoggedOut();
  }));

  it('stop() removes the listeners, the timer and the stored timestamp', fakeAsync(() => {
    create().start();
    expect(stored()).not.toBeNull();

    service.stop();
    expect(stored()).toBeNull();

    document.dispatchEvent(new Event('keydown'));
    expect(stored()).toBeNull();

    tick(TIMEOUT_MS * 2);
    expect(authService.logout).not.toHaveBeenCalled();
  }));

  it('keeps working when localStorage throws', fakeAsync(() => {
    const spies = [
      spyOn(Storage.prototype, 'getItem').and.throwError('blocked'),
      spyOn(Storage.prototype, 'setItem').and.throwError('blocked'),
      spyOn(Storage.prototype, 'removeItem').and.throwError('blocked')
    ];

    create().start();
    tick(TIMEOUT_MS);

    expectLoggedOut();
    // Spies outlive the test body: let afterEach's cleanup reach the real storage
    spies.forEach(spy => spy.and.callThrough());
    discardPeriodicTasks();
  }));

  it('handles activity and the idle check outside the Angular zone', fakeAsync(() => {
    create().start();
    let entered = 0;
    const sub = TestBed.inject(NgZone).onUnstable.subscribe(() => entered++);

    document.dispatchEvent(new Event('mousemove'));
    tick(MINUTE);

    expect(entered).toBe(0);
    sub.unsubscribe();
    discardPeriodicTasks();
  }));
});
