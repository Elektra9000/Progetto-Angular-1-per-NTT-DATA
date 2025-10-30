import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Post, PostComment } from '../models/models';

export interface User {
  id: number;
  name: string;
  email: string;
  gender: 'male' | 'female';
  status: 'active' | 'inactive';
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'https://gorest.co.in/public/v2';
  private http = inject(HttpClient);

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

  createPost(post: Partial<Post>): Observable<Post> {
    return this.http.post<Post>(`${this.base}/posts`, post);
  }

  createComment(
    postId: number,
    comment: Partial<PostComment>
  ): Observable<PostComment> {
    return this.http.post<PostComment>(
      `${this.base}/posts/${postId}/comments`,
      comment
    );
  }

  createReply(
    postId: number,
    parentId: number,
    reply: Partial<PostComment>
  ): Observable<PostComment> {
    return this.http.post<PostComment>(`${this.base}/comments`, {
      ...reply,
      post_id: postId,
      parent_id: parentId,
    });
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
