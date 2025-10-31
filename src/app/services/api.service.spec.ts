import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../enviroments/environment';
import { CreatePostPayload } from '../models/models';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;
  const base = environment.apiUrl || '';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (http) { http.verify(); }
  });

  it('getPosts returns posts on success', (done) => {
    const mock = [{ id: 1, title: 'a', body: 'b' }];
    service.getPosts().subscribe((res) => {
      expect(res).toEqual(mock);
      done();
    });
    const req = http.expectOne(`${base}/posts`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getPosts emits error when http fails', (done) => {
    service.getPosts().subscribe({
      next: () => fail('should not succeed'),
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });
    const req = http.expectOne(`${base}/posts`);
    req.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });
  });

  it('createPost sends correct payload and returns created post', (done) => {
    const payload: CreatePostPayload = { title: 'X', body: 'Y', user_id: 1 };
    const created = { id: 99, title: 'X', body: 'Y', user_id: 1 };
    service.createPost(payload).subscribe((res) => {
      expect(res).toEqual(created);
      done();
    });
    const req = http.expectOne(`${base}/posts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(created);
  });

  it('createPost propagates error on failure', (done) => {
    const payload: CreatePostPayload = { title: 'X', body: 'Y', user_id: 1 };
    service.createPost(payload).subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });
    const req = http.expectOne(`${base}/posts`);
    req.flush({ message: 'bad' }, { status: 400, statusText: 'Bad Request' });
  });
});
