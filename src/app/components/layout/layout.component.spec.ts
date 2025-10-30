import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { LayoutComponent } from './layout.component';

const activatedRouteStub = {
  snapshot: { params: {}, queryParams: {} },
  params: of({}),
  queryParams: of({}),
  paramMap: of(new Map()),
  data: of({}),
};

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [LayoutComponent],
    providers: [{ provide: ActivatedRoute, useValue: activatedRouteStub }],
  }).compileComponents();
});
