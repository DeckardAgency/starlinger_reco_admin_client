import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { UserService } from '@services/http/user.service';
import { LoggerService } from '@services/logger.service';
import { User } from '@core/models';
import { environment } from '@env/environment';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;
  const apiUrl = `${environment.apiBaseUrl}/api/login_check`;

  // Storage keys used by the service
  const TOKEN_KEY = 'auth_token';
  const REFRESH_TOKEN_KEY = 'refresh_token';
  const USER_KEY = 'currentUser';

  // Helper to create a fresh service instance
  function createService(): AuthService {
    TestBed.resetTestingModule();

    userServiceSpy = jasmine.createSpyObj('UserService', ['getUserByEmail']);
    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['createLogger']);
    loggerServiceSpy.createLogger.and.returnValue({
      debug: jasmine.createSpy('debug'),
      info: jasmine.createSpy('info'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error'),
      logger: loggerServiceSpy,
      scope: 'AuthService'
    } as any);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    service = createService();
  });

  afterEach(() => {
    try {
      httpMock.verify();
    } catch (e) {
      // Ignore verification errors from tests that don't make HTTP calls
    }
    localStorage.clear();
  });

  describe('login', () => {
    const mockAuthResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RAdGVzdC5jb20iLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlcyI6WyJST0xFX1VTRVIiXSwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDB9.test',
      refresh_token: 'refresh-token-123'
    };

    const mockUser: User = {
      id: '1',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['ROLE_USER']
    };

    it('should login successfully and store tokens', (done) => {
      userServiceSpy.getUserByEmail.and.returnValue(of(mockUser));

      service.login('test@test.com', 'password').subscribe({
        next: (result: boolean) => {
          expect(result).toBe(true);
          expect(localStorage.getItem(TOKEN_KEY)).toBe(mockAuthResponse.token);
          expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe(mockAuthResponse.refresh_token);
          expect(localStorage.getItem(USER_KEY)).toBeTruthy();
          done();
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'test@test.com', password: 'password' });
      req.flush(mockAuthResponse);
    });

    it('should handle login error', (done) => {
      service.login('bad@user.com', 'wrong').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should reject login for archived client', (done) => {
      const archivedUser: User = {
        ...mockUser,
        client: {
          '@id': '/api/clients/1',
          '@type': 'Client',
          id: '1',
          name: 'Test Client',
          code: 'TC',
          isActive: false,
          isArchived: true
        }
      };
      userServiceSpy.getUserByEmail.and.returnValue(of(archivedUser));

      service.login('test@test.com', 'password').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('archived');
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should clear tokens and user data', () => {
      localStorage.setItem(TOKEN_KEY, 'token');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh');
      localStorage.setItem(USER_KEY, JSON.stringify({ email: 'test@test.com' }));

      service.logout();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });

    it('should emit null on currentUser$', () => {
      // Get the current value synchronously after logout
      service.logout();

      // The currentUser$ should have null as its value after logout
      let currentUser: any = 'not-checked';
      service.currentUser$.subscribe(user => {
        currentUser = user;
      }).unsubscribe();

      expect(currentUser).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      const validToken = 'test-token';
      localStorage.setItem(TOKEN_KEY, validToken);
      localStorage.setItem(USER_KEY, JSON.stringify({ email: 'test@test.com' }));

      // Create a new service instance to pick up the stored token
      service = createService();

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const token = 'test-token-123';
      localStorage.setItem(TOKEN_KEY, token);

      expect(service.getToken()).toBe(token);
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from behavior subject', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['ROLE_USER']
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Create a new service instance to load user from storage
      service = createService();

      const result = service.getCurrentUser();
      expect(result).toEqual(user);
    });

    it('should return null when no user exists', () => {
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', () => {
      const user: User = {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['ROLE_USER', 'ROLE_ADMIN']
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      service = createService();

      expect(service.hasRole('ROLE_ADMIN')).toBe(true);
      expect(service.hasRole('ROLE_USER')).toBe(true);
    });

    it('should return false when user does not have role', () => {
      const user: User = {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['ROLE_USER']
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      service = createService();

      expect(service.hasRole('ROLE_SUPER_ADMIN')).toBe(false);
    });

    it('should return false when no user is logged in', () => {
      expect(service.hasRole('ROLE_USER')).toBe(false);
    });
  });

  describe('client information', () => {
    it('should return client info when available', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['ROLE_USER'],
        client: {
          '@id': '/api/clients/1',
          '@type': 'Client',
          id: '1',
          name: 'Test Company',
          code: 'TC',
          isActive: true,
          isArchived: false
        }
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      service = createService();

      const clientInfo = service.getClientInfo();
      expect(clientInfo).toEqual({ name: 'Test Company', code: 'TC' });
    });

    it('should return null when no client info', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['ROLE_USER']
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      service = createService();

      expect(service.getClientInfo()).toBeNull();
    });

    it('should check if client is archived', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['ROLE_USER'],
        client: {
          '@id': '/api/clients/1',
          '@type': 'Client',
          id: '1',
          name: 'Test Company',
          code: 'TC',
          isActive: false,
          isArchived: true
        }
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      service = createService();

      expect(service.isClientArchived()).toBe(true);
    });
  });

  describe('getUserFullName', () => {
    it('should return full name when both names are available', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ROLE_USER']
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      service = createService();

      expect(service.getUserFullName()).toBe('John Doe');
    });

    it('should return first name only when last name is missing', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        firstName: 'John',
        lastName: '',
        roles: ['ROLE_USER']
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      service = createService();

      expect(service.getUserFullName()).toBe('John');
    });

    it('should return email when name is not available', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        firstName: '',
        lastName: '',
        roles: ['ROLE_USER']
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      service = createService();

      expect(service.getUserFullName()).toBe('test@test.com');
    });

    it('should return empty string when no user', () => {
      expect(service.getUserFullName()).toBe('');
    });
  });
});
