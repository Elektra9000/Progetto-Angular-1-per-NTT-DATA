import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProponentsComponent } from './proponents.component';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';

describe('ProponentsComponent', () => {
  let fixture: ComponentFixture<ProponentsComponent>;
  let component: ProponentsComponent;
  const apiSpy = jasmine.createSpyObj('ApiService', ['getUsers']);
  apiSpy.getUsers.and.returnValue(of([]));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProponentsComponent, RouterModule.forRoot([])],
      providers: [
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiSpy },
        FormBuilder
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProponentsComponent);
    component = fixture.componentInstance;
  });

  it('should call getUsers on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    expect(apiSpy.getUsers).toHaveBeenCalled();
  }));
});
