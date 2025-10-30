import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  RouterModule,
  ActivatedRoute,
  convertToParamMap,
} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { UserDetailComponent } from '../proponents/user-detail-component/user-detail/user-detail.component';
import { ApiService } from '../../services/api.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('UserDetailComponent', () => {
  let fixture: ComponentFixture<UserDetailComponent>;
  let component: UserDetailComponent;

  const apiSpy = jasmine.createSpyObj('ApiService', [
    'getUser',
    'getUserById',
    'getUserDetails',
    'get',
    'fetchUser',
  ]);
  const userPayload = { id: 1, name: 'Test User', email: 'a@b.com' };
  apiSpy.getUser?.and.returnValue(of(userPayload));
  apiSpy.getUserById?.and.returnValue(of(userPayload));
  apiSpy.getUserDetails?.and.returnValue(of(userPayload));
  apiSpy.get?.and.returnValue(of(userPayload));
  apiSpy.fetchUser?.and.returnValue(of(userPayload));

  const activatedRouteStub = {
    snapshot: { paramMap: convertToParamMap({ id: '1' }) },
    paramMap: of(convertToParamMap({ id: '1' })),
  };

  const httpClientSpy = {
    get: jasmine.createSpy('httpGet').and.returnValue(of(userPayload)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailComponent, RouterModule.forRoot([])],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: HttpClient, useValue: httpClientSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create and call ApiService or HttpClient for user data', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component).toBeTruthy();

    const calledApiGetUser = apiSpy.getUser && apiSpy.getUser.calls.count() > 0;
    const calledApiGetUserById =
      apiSpy.getUserById && apiSpy.getUserById.calls.count() > 0;
    const calledApiGetUserDetails =
      apiSpy.getUserDetails && apiSpy.getUserDetails.calls.count() > 0;
    const calledApiGet = apiSpy.get && apiSpy.get.calls.count() > 0;
    const calledApiFetchUser =
      apiSpy.fetchUser && apiSpy.fetchUser.calls.count() > 0;
    const calledHttpGet = (httpClientSpy.get as jasmine.Spy).calls.count() > 0;

    expect(
      calledApiGetUser ||
        calledApiGetUserById ||
        calledApiGetUserDetails ||
        calledApiGet ||
        calledApiFetchUser ||
        calledHttpGet
    ).toBeTrue();
  }));
});
