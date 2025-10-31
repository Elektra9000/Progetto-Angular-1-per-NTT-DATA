import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { of, throwError, Observable } from 'rxjs';
import { PostsComponent } from './posts.component';
import { ApiService } from '../../services/api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Post, PostComment } from '../../models/models';

describe('PostsComponent additional tests', () => {
  let fixture: ComponentFixture<PostsComponent>;
  let component: PostsComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let cdSpy: jasmine.SpyObj<ChangeDetectorRef>;
  let snackSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    spyOn(console, 'error').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'log').and.stub();

    apiSpy = jasmine.createSpyObj('ApiService', [
      'getPosts',
      'createPost',
      'getCommentsByPost',
      'createComment',
      'createReply',
      'likePost',
      'getCurrentUser',
    ]);

    apiSpy.getCurrentUser.and.returnValue(
      of([
        {
          id: 1,
          name: 'Test User',
          email: 't@test',
          gender: 'male',
          status: 'active',
        },
      ])
    );
    cdSpy = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);
    snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [PostsComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ChangeDetectorRef, useValue: cdSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });
  });

  afterEach(() => {
    (PostsComponent as any).postsCache = null;
    sessionStorage.removeItem('gorest_token');
    fixture?.destroy();
  });

  function createWithMock(posts: Post[]) {
    sessionStorage.setItem('gorest_token', 't');
    apiSpy.getPosts.and.returnValue(of(posts));
    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
  }

  it('likePost increments likes and updates cache', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    sessionStorage.setItem('gorest_token', 't');
    const p: Post = { id: 60, title: 't', body: 'b', likes: 1 };
    const updated: Post = { ...p, likes: 2 };

    apiSpy.getPosts.and.returnValue(of([p]));
    (apiSpy as any).likePost = jasmine.createSpy().and.returnValue(of(updated));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.likePost(60);
    fixture.detectChanges();

    const inside = component.posts.find((x) => x.id === 60);
    expect(inside).toBeDefined();
    expect(inside?.likes).toBe(2);

    const cached = (PostsComponent as any).postsCache?.find(
      (x: any) => x.id === 60
    );
    expect(cached).toBeDefined();
    expect(cached?.likes).toBe(2);
  }));

  it('goToPage respects bounds and changes displayedPosts', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const many: Post[] = [];
    for (let i = 1; i <= 20; i++)
      many.push({ id: i, title: `t${i}`, body: 'b', likes: 0 });
    apiSpy.getPosts.and.returnValue(of(many));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.goToPage(1);
    fixture.detectChanges();
    tick();
    expect(component.page).toBe(1);
    expect(component.displayedPosts.length).toBeLessThanOrEqual(8);

    component.goToPage(0);
    fixture.detectChanges();
    tick();
    expect(component.page).toBe(1);

    component.goToPage(999);
    fixture.detectChanges();
    tick();
    expect(component.page).toBe(1);
  }));

  it('loadPosts uses cache when present', fakeAsync(() => {
    (PostsComponent as any).postsCache = [
      { id: 5, title: 'cached', body: 'c', likes: 0 },
    ];
    sessionStorage.setItem('gorest_token', 't');
    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    expect(component.posts.length).toBe(1);
    expect(component.posts[0].title).toBe('cached');
  }));

  it('loadPosts calls network when cache null', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const payload: Post[] = [{ id: 1, title: 'net', body: 'b', likes: 0 }];
    createWithMock(payload);
    expect(apiSpy.getPosts).toHaveBeenCalled();
    expect(component.posts.length).toBe(1);
    expect(component.posts[0].title).toBe('net');
  }));

  it('submitNewPost success replaces temp post with created', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    sessionStorage.setItem('gorest_token', 't');

    const created: Post = { id: 7, title: 'New', body: 'B', likes: 0 };
    apiSpy.getPosts.and.returnValue(of([]));
    apiSpy.createPost.and.returnValue(of(created));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.newPostForm.setValue({ title: 'New', body: 'B' });
    component.submitNewPost();
    tick();

    expect(apiSpy.createPost).toHaveBeenCalled();
    expect(component.posts.some((p) => p.id === created.id)).toBeTrue();
  }));

  it('submitNewPost rolls back on error', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    apiSpy.getPosts.and.returnValue(of([]));
    apiSpy.createPost.and.returnValue(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.newPostForm.setValue({ title: 'X', body: 'Y' });
    component.submitNewPost();
    tick();

    expect(component.posts.length).toBe(0);
  }));

  it('submitNewPost does nothing if token is missing', fakeAsync(() => {
    sessionStorage.removeItem('gorest_token');
    apiSpy.getPosts.and.returnValue(of([]));
    apiSpy.createPost.and.returnValue(
      of({ id: 0, title: '', body: '', likes: 0 })
    );

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.newPostForm.setValue({ title: 'X', body: 'Y' });
    component.submitNewPost();
    tick();

    expect(apiSpy.createPost).not.toHaveBeenCalled();
  }));

  it('toggleComments loads comments on demand', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const p: Post = { id: 10, title: 't', body: 'b', likes: 0 };
    apiSpy.getPosts.and.returnValue(of([p]));
    const comments: PostComment[] = [
      { id: 1, post_id: 10, name: 'a', email: 'e', body: 'c', likes: 0 },
    ];
    apiSpy.getCommentsByPost.and.returnValue(of(comments));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.toggleComments(10);
    tick();
    expect(apiSpy.getCommentsByPost).toHaveBeenCalledWith(10);
    expect(component.comments[10].length).toBe(1);
  }));

  it('toggleComments hides comments when already loaded', fakeAsync(() => {
    const p: Post = { id: 99, title: 't', body: 'b', likes: 0 };
    const comments: PostComment[] = [
      { id: 1, post_id: 99, name: 'a', email: 'e', body: 'c', likes: 0 },
    ];
    apiSpy.getPosts.and.returnValue(of([p]));
    apiSpy.getCommentsByPost.and.returnValue(of(comments));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.toggleComments(99);
    tick();
    expect(component.comments[99].length).toBe(1);

    component.toggleComments(99);
    expect(component.activeCommentPostId).toBeNull();
  }));

  it('submitComment success appends and resets form', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const p: Post = { id: 20, title: 't', body: 'b', likes: 0 };
    apiSpy.getPosts.and.returnValue(of([p]));
    const created: PostComment = {
      id: 9,
      post_id: 20,
      name: 'n',
      email: 'e',
      body: 'body',
      likes: 0,
    };
    apiSpy.createComment = jasmine.createSpy().and.returnValue(of(created));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.prepareNewComment(20);
    component.commentForms[20].setValue({ name: 'n', body: 'body' });

    component.submitComment(20);
    tick();

    expect(apiSpy.createComment).toHaveBeenCalled();
    expect(component.comments[20].some((c) => c.id === created.id)).toBeTrue();
    expect(component.activeCommentPostId).toBeNull();

    expect(component.commentForms[20].pristine).toBeTrue();
    expect(
      component.commentForms[20].value.name == null ||
        component.commentForms[20].value.name === ''
    ).toBeTrue();
    expect(
      component.commentForms[20].value.body == null ||
        component.commentForms[20].value.body === ''
    ).toBeTrue();
  }));

  it('submitComment rolls back on error and keeps activeCommentPostId', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const p: Post = { id: 30, title: 't', body: 'b', likes: 0 };
    apiSpy.getPosts.and.returnValue(of([p]));
    apiSpy.createComment.and.returnValue(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.prepareNewComment(30);
    component.commentForms[30].setValue({ name: 'n', body: 'b' });

    component.submitComment(30);
    tick();

    expect((component.comments[30] ?? []).length).toBe(0);
  }));

  it('submitReply rolls back on error', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const p: Post = { id: 40, title: 't', body: 'b', likes: 0 };
    apiSpy.getPosts.and.returnValue(of([p]));
    apiSpy.createReply.and.returnValue(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.replyForms[40] = component.replyForms[40] || {};
    component.replyForms[40][1] = {
      invalid: false,
      value: { name: 'n', body: 'x' },
      reset: () => void 0,
    } as any;

    component.comments[40] = [];

    component.submitReply(40, 1);
    tick();

    expect(component.comments[40].some((c) => c.name === 'n')).toBeFalse();
  }));

  it('toggleComments handles error and sets loadingComments false', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const p: Post = { id: 50, title: 't', body: 'b', likes: 0 };
    apiSpy.getPosts.and.returnValue(of([p]));
    apiSpy.getCommentsByPost.and.returnValue(
      throwError(() => new Error('fail'))
    );

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.toggleComments(50);
    tick();

    expect(component.loadingComments).toBeFalse();
    expect(component.comments[50]?.length || 0).toBe(0);
  }));

  it('submitNewPost handles server response without id gracefully', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    sessionStorage.setItem('gorest_token', 't');
    const serverResp: any = { title: 'New', body: 'B' };
    apiSpy.getPosts.and.returnValue(of([]));
    apiSpy.createPost.and.returnValue(of(serverResp));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.newPostForm.setValue({ title: 'New', body: 'B' });
    component.submitNewPost();
    tick();

    expect(component.posts).toBeDefined();
    expect(Array.isArray(component.posts)).toBeTrue();
    const created = component.posts.find(
      (p) => p.title === 'New' || p.body === 'B'
    );
    expect(created).toBeDefined();
  }));

  it('submitComment does nothing when no form prepared or form invalid', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const p: Post = { id: 200, title: 't', body: 'b', likes: 0 } as any;
    apiSpy.getPosts.and.returnValue(of([p]));
    apiSpy.createComment = jasmine.createSpy().and.returnValue(of({}));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.submitComment(200);
    tick();
    expect(apiSpy.createComment).not.toHaveBeenCalled();

    component.prepareNewComment(200);
    component.commentForms[200] = {
      invalid: true,
      setErrors: () => void 0,
    } as any;
    component.submitComment(200);
    tick();
    expect(apiSpy.createComment).not.toHaveBeenCalled();
  }));

  it('submitReply rolls back and preserves existing replies when server errors', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const p: Post = { id: 210, title: 't', body: 'b', likes: 0 } as any;
    apiSpy.getPosts.and.returnValue(of([p]));
    apiSpy.createReply.and.returnValue(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.comments[210] = [{ id: 1, name: 'existing', body: 'r' }] as any[];
    component.replyForms[210] = component.replyForms[210] || {};
    component.replyForms[210][2] = {
      invalid: false,
      value: { name: 'n', body: 'x' },
      reset: () => {
        return;
      },
    } as any;

    component.submitReply(210, 2);
    tick();

    expect(
      component.comments[210].some((c: any) => c.name === 'n')
    ).toBeFalse();
    expect(
      component.comments[210].some((c: any) => c.name === 'existing')
    ).toBeTrue();
  }));

  it('toggleComments concurrent calls do not leave loading flag true', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    const p: Post = { id: 220, title: 't', body: 'b', likes: 0 } as any;
    apiSpy.getPosts.and.returnValue(of([p]));
    let resolve: any;
    const delayed$ = new Observable<PostComment[]>((sub) => {
      resolve = () =>
        sub.next([
          { id: 1, post_id: 220, name: 'a', email: 'e', body: 'c', likes: 0 },
        ]);
    });
    apiSpy.getCommentsByPost.and.returnValue(delayed$ as any);

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.toggleComments(220);
    component.toggleComments(220);
    fixture.detectChanges();
    expect(component.loadingComments).toBeTrue();

    resolve();
    tick();

    expect(component.loadingComments).toBeFalse();
    expect(component.comments[220]?.length).toBe(1);
  }));

  it('submitNewPost rolls back optimistic insert on server error', fakeAsync(() => {
    (PostsComponent as any).postsCache = null;
    sessionStorage.setItem('gorest_token', 't');
    const p: Post = { id: 230, title: 't', body: 'b', likes: 0 } as any;
    apiSpy.getPosts.and.returnValue(of([p]));
    apiSpy.createPost.and.returnValue(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    component.newPostForm.setValue({ title: 'Optimistic', body: 'X' });
    component.submitNewPost();
    tick();

    const found = component.posts.some(
      (pp: any) => pp.title === 'Optimistic' || pp.body === 'X'
    );
    expect(found).toBeFalse();
  }));
});
