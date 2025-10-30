import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { UserDetailComponent } from './user-detail.component';
import { ApiService } from '../../../../services/api.service';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  name: string;
  email: string;
  gender: string;
  status: string;
}
interface Post {
  id: number;
  title: string;
  body: string;
  comments?: any[];
}

describe('UserDetailComponent', () => {
  let fixture: ComponentFixture<UserDetailComponent>;
  let component: UserDetailComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let httpSpy: any;

  beforeEach(() => {
    spyOn(console, 'error').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'log').and.stub();

    apiSpy = jasmine.createSpyObj('ApiService', ['getUsers']);

    httpSpy = jasmine.createSpyObj('HttpClient', ['get']);

    (httpSpy.get as jasmine.Spy).and.callFake((url: string) => {
      if (typeof url !== 'string') return of(null);
      if (url.includes('/users/') && url.endsWith('/posts')) {
        return of([] as Post[]);
      }
      if (url.includes('/posts/') && url.includes('/comments')) {
        return of([] as any[]);
      }
      if (url.includes('/users/')) {
        return of({
          id: 1,
          name: 'U',
          email: 'u@example.com',
          gender: 'female',
          status: 'active'
        } as User);
      }
      return of(null);
    });

    TestBed.configureTestingModule({
      imports: [UserDetailComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: HttpClient, useValue: httpSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: '1' }) },
            paramMap: {
              pipe: () => of(convertToParamMap({ id: '1' })),
              subscribe: (next: any) => of(convertToParamMap({ id: '1' })).subscribe(next)
            }
          }
        }
      ]
    });
  });

  function createFixture() {
    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('ngOnInit loads user on success', fakeAsync(() => {
    createFixture();
    tick();
    expect((component as any).loading).toBeFalse();
    expect((component as any).error).toBeNull();
    expect((component as any).user?.id).toBe(1);
  }));

  it('ngOnInit sets error when user request fails', fakeAsync(() => {
   (httpSpy.get as jasmine.Spy).and.callFake((url: string) => {
      if (url.includes('/users/') && !url.endsWith('/posts')) {
        return throwError(() => new Error('http fail'));
      }
      if (url.includes('/users/') && url.endsWith('/posts')) {
        return of([] as Post[]);
      }
      if (url.includes('/posts/') && url.includes('/comments')) {
        return of([] as any[]);
      }
      return of(null);
    });

    createFixture();
    tick();
    expect((component as any).error).toBeTruthy();
  }));
});
