import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MATERIAL } from '../../../../material/material.module';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
  comments?: Comment[];
}

interface Comment {
  id: number;
  name: string;
  email: string;
  body: string;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css'],
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  posts: Post[] = [];
  commentForms: Record<number, FormGroup> = {};
  loading = false;
  error: string | null = null;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? Number(idStr) : null;

    if (!id) {
      this.error = 'Invalid user id';
      this.loading = false;
      return;
    }

    this.loading = true;

    this.http
      .get<User>(`https://gorest.co.in/public/v2/users/${id}`)
      .pipe(
        catchError(err => {
          console.error('Failed loading user', err);
          this.error = 'Unable to load user';
          return of(null);
        })
      )
      .subscribe(user => {
        this.user = user ? { ...user, name: (user.name || '').trim() } : null;
      });

    this.http
      .get<Post[]>(`https://gorest.co.in/public/v2/users/${id}/posts`)
      .pipe(
        catchError(err => {
          console.error('Failed loading posts', err);
          return of([] as Post[]);
        })
      )
      .subscribe(posts => {
        this.posts = Array.isArray(posts) ? posts : [];

        this.posts.forEach(post => {
          this.commentForms[post.id] = new FormGroup({
            name: new FormControl('', Validators.required),
            body: new FormControl('', Validators.required),
          });

          this.http
            .get<Comment[]>(`https://gorest.co.in/public/v2/posts/${post.id}/comments`)
            .pipe(
              catchError(err => {
                console.error(`Failed loading comments for post ${post.id}`, err);
                return of([] as Comment[]);
              })
            )
            .subscribe(comments => {
              post.comments = Array.isArray(comments) ? comments : [];
            });
        });

        this.loading = false;
      });
  }

  submitComment(postId: number): void {
    const form = this.commentForms[postId];
    if (!form || form.invalid) return;

    const newComment: Comment = {
      id: Date.now(),
      name: form.value.name,
      email: 'user@example.com',
      body: form.value.body,
    };

    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.comments = [...(post.comments || []), newComment];
    }

    form.reset();
  }
}
