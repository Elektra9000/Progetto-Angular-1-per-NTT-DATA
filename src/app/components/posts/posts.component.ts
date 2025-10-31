import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../../services/api.service';
import { Post, PostComment } from '../../models/models';
import { MATERIAL } from '../../material/material.module';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, MATERIAL, ReactiveFormsModule],
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsComponent implements OnInit {
  posts: Post[] = [];
  comments: Record<number, PostComment[]> = {};
  expandedPostId: number | null = null;
  loadingComments = false;

  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private cd = inject(ChangeDetectorRef);

  page = 1;
  pageSize = 8;
  displayedPosts: Post[] = [];

  private static postsCache: Post[] | null = null;

  newPostForm = new FormGroup({
    title: new FormControl('', Validators.required),
    body: new FormControl('', Validators.required),
  });

  editForm = new FormGroup({
    title: new FormControl('', Validators.required),
    body: new FormControl('', Validators.required),
  });

  commentForms: Record<number, FormGroup> = {};
  replyForms: Record<number, Record<number, FormGroup>> = {};

  showNewPostForm = false;
  editingPostId: number | null = null;
  editingPostIndex: number | null = null;
  activeCommentPostId: number | null = null;
  replyingTo: number | null = null;

  postingPost = false;
  postingComment: Record<number, boolean> = {};
  postingReply: Record<string, boolean> = {};

  ngOnInit() {
    const tokenNow = sessionStorage.getItem('gorest_token');
    if (tokenNow) {
      this.loadPosts();
      return;
    }

    const attempts = 5;
    const intervalMs = 200;
    let tries = 0;

    const checkToken = () => {
      tries++;
      const t = sessionStorage.getItem('gorest_token');
      if (t) {
        this.loadPosts();
        return;
      }
      if (tries < attempts) {
        setTimeout(checkToken, intervalMs);
      } else {
        this.loadPosts();
      }
    };

    checkToken();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.posts.length / this.pageSize));
  }

  private applyPagination() {
    const start = (this.page - 1) * this.pageSize;
    this.displayedPosts = this.posts.slice(start, start + this.pageSize);
  }

  goToPage(n: number) {
    if (n < 1) return;
    const max = this.totalPages;
    if (n > max) return;
    this.page = n;
    this.applyPagination();
    this.cd.markForCheck();
  }

  private loadPosts() {
    if (PostsComponent.postsCache) {
      this.posts = PostsComponent.postsCache;
      this.setupFormsForPosts();
      this.applyPagination();
      this.cd.markForCheck();
      return;
    }

    this.api.getPosts().subscribe({
      next: (data) => {
        this.posts = Array.isArray(data) ? data : [];
        PostsComponent.postsCache = this.posts;
        this.setupFormsForPosts();
        this.applyPagination();
        this.cd.markForCheck();
      },
      error: () => {
        this.snack.open('Failed to load posts', 'Close', { duration: 3000 });
      },
    });
  }

  private setupFormsForPosts() {
    this.posts.forEach((p) => {
      if (!this.commentForms[p.id]) {
        this.commentForms[p.id] = new FormGroup({
          name: new FormControl('', Validators.required),
          body: new FormControl('', Validators.required),
        });
      }
      this.replyForms[p.id] = this.replyForms[p.id] || {};
    });
  }

  startEdit(post: Post) {
    this.editingPostId = post.id;
    this.editingPostIndex = this.posts.findIndex((p) => p.id === post.id);
    this.editForm.setValue({
      title: post.title ?? '',
      body: post.body ?? '',
    });
  }

  submitEdit(postId: number) {
    if (this.editForm.invalid) return;
    const idx =
      this.editingPostIndex ?? this.posts.findIndex((p) => p.id === postId);
    if (idx !== -1) {
      const updated = {
        ...this.posts[idx],
        title: this.editForm.value.title!,
        body: this.editForm.value.body!,
      };
      this.posts = [
        ...this.posts.slice(0, idx),
        updated,
        ...this.posts.slice(idx + 1),
      ];
      PostsComponent.postsCache = this.posts;
      this.applyPagination();
      this.cd.markForCheck();
    }
    this.editingPostId = null;
    this.editingPostIndex = null;
    this.editForm.reset();
  }

  submitNewPost() {
    if (this.newPostForm.invalid || this.postingPost) return;
    const token = sessionStorage.getItem('gorest_token');
    if (!token) return;

    this.postingPost = true;

    this.api.getCurrentUser().pipe(finalize(() => {
      this.postingPost = false;
    })).subscribe({
      next: (users) => {
        const userId = Array.isArray(users) && users.length > 0 ? users[0].id : null;
        if (!userId) {
          this.snack.open('Invalid token: no user found', 'Close', { duration: 4000 });
          this.postingPost = false;
          return;
        }

        const tempId = Date.now();
        const localPost: Post = {
          id: tempId,
          title: this.newPostForm.value.title!,
          body: this.newPostForm.value.body!,
          likes: 0,
        };

        this.posts = [localPost, ...this.posts];
        PostsComponent.postsCache = this.posts;
        this.applyPagination();
        this.cd.markForCheck();

        this.api
          .createPost({
            title: localPost.title,
            body: localPost.body,
            user_id: userId,
          })
          .pipe(finalize(() => (this.postingPost = false)))
          .subscribe({
            next: (created) => {
              const idx = this.posts.findIndex((p) => p.id === tempId);
              if (idx !== -1) {
                this.posts = [
                  ...this.posts.slice(0, idx),
                  created,
                  ...this.posts.slice(idx + 1),
                ];
                PostsComponent.postsCache = this.posts;
                this.applyPagination();
                this.cd.markForCheck();
              }
              this.commentForms[created.id] = new FormGroup({
                name: new FormControl('', Validators.required),
                body: new FormControl('', Validators.required),
              });
              this.replyForms[created.id] = {};
              this.newPostForm.reset();
              this.showNewPostForm = false;
              this.snack.open('Post published', 'Close', { duration: 2500 });
            },
            error: (err) => {
              this.posts = this.posts.filter((p) => p.id !== tempId);
              PostsComponent.postsCache = this.posts;
              this.applyPagination();
              this.cd.markForCheck();
              this.snack.open('Failed to publish post', 'Close', {
                duration: 4000,
              });
              console.error(err);
            },
          });
      },
      error: (err) => {
        this.snack.open('Failed to retrieve user info', 'Close', { duration: 4000 });
        console.error(err);
        this.postingPost = false;
      },
    });
  }

  prepareNewComment(postId: number) {
    if (this.activeCommentPostId === postId) {
      this.activeCommentPostId = null;
      return;
    }
    this.activeCommentPostId = postId;
    if (!this.commentForms[postId]) {
      this.commentForms[postId] = new FormGroup({
        name: new FormControl('', Validators.required),
        body: new FormControl('', Validators.required),
      });
    } else {
      this.commentForms[postId].reset();
    }
  }

  submitComment(postId: number) {
    const form = this.commentForms[postId];
    if (!form || form.invalid || this.postingComment[postId]) return;

    const tempId = Date.now();
    const local: PostComment = {
      id: tempId,
      post_id: postId,
      name: form.value.name!,
      email: 'user@example.com',
      body: form.value.body!,
      likes: 0,
    };

    this.comments[postId] = [...(this.comments[postId] || []), local];
    this.postingComment[postId] = true;
    this.cd.markForCheck();

    this.api
      .createComment(postId, {
        name: local.name,
        body: local.body,
        email: local.email,
      })
      .pipe(finalize(() => (this.postingComment[postId] = false)))
      .subscribe({
        next: (created) => {
          this.comments[postId] = this.comments[postId].map((c) =>
            c.id === tempId ? created : c
          );
          this.snack.open('Comment added', 'Close', { duration: 2000 });
          form.reset();
          this.activeCommentPostId = null;
          this.cd.markForCheck();
        },
        error: (err) => {
          this.comments[postId] = this.comments[postId].filter(
            (c) => c.id !== tempId
          );
          this.snack.open('Failed to add comment', 'Close', { duration: 3500 });
          console.error(err);
          this.cd.markForCheck();
        },
      });
  }

  replyToComment(postId: number, parentComment: PostComment) {
    this.replyingTo = parentComment.id;
    if (!this.replyForms[postId]) this.replyForms[postId] = {};
    if (!this.replyForms[postId][parentComment.id]) {
      this.replyForms[postId][parentComment.id] = new FormGroup({
        name: new FormControl('', Validators.required),
        body: new FormControl('', Validators.required),
      });
    } else {
      this.replyForms[postId][parentComment.id].reset();
    }
  }

  submitReply(postId: number, parentId: number) {
    const form = this.replyForms[postId]?.[parentId];
    const key = `${postId}_${parentId}`;
    if (!form || form.invalid || this.postingReply[key]) return;

    const tempId = Date.now();
    const localReply: PostComment = {
      id: tempId,
      post_id: postId,
      parent_id: parentId,
      name: form.value.name!,
      email: 'user@example.com',
      body: form.value.body!,
      likes: 0,
    };

    this.comments[postId] = [...(this.comments[postId] || []), localReply];
    this.postingReply[key] = true;
    this.cd.markForCheck();

    this.api
      .createReply(postId, parentId, {
        name: localReply.name,
        body: localReply.body,
        email: localReply.email,
      })
      .pipe(finalize(() => (this.postingReply[key] = false)))
      .subscribe({
        next: (created) => {
          this.comments[postId] = this.comments[postId].map((c) =>
            c.id === tempId ? created : c
          );
          this.snack.open('Reply sent', 'Close', { duration: 2000 });
          form.reset();
          this.replyingTo = null;
          this.cd.markForCheck();
        },
        error: (err) => {
          this.comments[postId] = this.comments[postId].filter(
            (c) => c.id !== tempId
          );
          this.snack.open('Failed to send reply', 'Close', { duration: 3500 });
          console.error(err);
          this.cd.markForCheck();
        },
      });
  }

  toggleComments(postId: number) {
    if (this.expandedPostId === postId) {
      this.expandedPostId = null;
      return;
    }
    this.expandedPostId = postId;
    if (!this.comments[postId]) {
      this.loadingComments = true;
      this.api.getCommentsByPost(postId).subscribe({
        next: (data) => {
          this.comments[postId] = Array.isArray(data) ? data : [];
          this.loadingComments = false;
          (this.comments[postId] || []).forEach((c) => {
            if (!this.replyForms[postId]) this.replyForms[postId] = {};
            if (!this.replyForms[postId][c.id]) {
              this.replyForms[postId][c.id] = new FormGroup({
                name: new FormControl('', Validators.required),
                body: new FormControl('', Validators.required),
              });
            }
          });
          this.cd.markForCheck();
        },
        error: (err) => {
          this.loadingComments = false;
          this.snack.open('Failed to load comments', 'Close', {
            duration: 3000,
          });
          console.error(err);
          this.cd.markForCheck();
        },
      });
    }
  }

  likePost(postId: number) {
    const idx = this.posts.findIndex((p) => p.id === postId);
    if (idx === -1) return;
    const updated = {
      ...this.posts[idx],
      likes: (this.posts[idx].likes || 0) + 1,
    };
    this.posts = [
      ...this.posts.slice(0, idx),
      updated,
      ...this.posts.slice(idx + 1),
    ];
    PostsComponent.postsCache = this.posts;
    this.applyPagination();
    this.cd.markForCheck();
  }

  likeComment(postId: number, comment: PostComment) {
    comment.likes = (comment.likes || 0) + 1;
    this.cd.markForCheck();
  }

  trackByPostId(index: number, post: Post) {
    return post.id;
  }
}
