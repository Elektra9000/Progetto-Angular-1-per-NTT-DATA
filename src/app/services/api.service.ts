import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Post, PostComment, CreatePostPayload, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'https://gorest.co.in/public/v2';
  private http = inject(HttpClient);

  private authHeaders(): { headers?: HttpHeaders } {
    const token = sessionStorage.getItem('gorest_token') || '';
    if (!token) return {};
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }),
    };
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.base}/posts`);
  }

  getCommentsByPost(postId: number): Observable<PostComment[]> {
    return this.http.get<PostComment[]>(
      `${this.base}/posts/${postId}/comments`
    );
  }

  getComments(): Observable<PostComment[]> {
    return this.http.get<PostComment[]>(`${this.base}/comments`);
  }

  getTodos(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/todos`);
  }

  createPost(payload: CreatePostPayload): Observable<Post> {
    return this.http.post<Post>(
      `${this.base}/posts`,
      payload,
      this.authHeaders()
    );
  }

  createComment(
    postId: number,
    comment: Partial<PostComment>
  ): Observable<PostComment> {
    return this.http.post<PostComment>(
      `${this.base}/posts/${postId}/comments`,
      comment,
      this.authHeaders()
    );
  }

  createReply(
    postId: number,
    parentId: number,
    reply: Partial<PostComment>
  ): Observable<PostComment> {
    const body = {
      ...reply,
      post_id: postId,
      parent_id: parentId,
    };
    return this.http.post<PostComment>(
      `${this.base}/comments`,
      body,
      this.authHeaders()
    );
  }

  updatePost(
    id: number,
    payload: { title: string; body: string }
  ): Observable<Post | null> {
    const token = sessionStorage.getItem('gorest_token');
    if (!token) {
      console.warn('No token found in sessionStorage');
      return of(null);
    }

    return this.http.patch<Post>(`${this.base}/posts/${id}`, payload, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    });
  }

  getCurrentUser(): Observable<User[]> {
    const token = sessionStorage.getItem('gorest_token') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<User[]>(`${this.base}/users`, { headers });
  }
}
export type { User };
