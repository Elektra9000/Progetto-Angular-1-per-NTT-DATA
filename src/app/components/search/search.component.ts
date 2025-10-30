import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription, BehaviorSubject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Post } from '../../models/models';
import { MATERIAL } from '../../material/material.module';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, OnDestroy {
  query = new FormControl('');
  loading = false;
  error: string | null = null;

  private allPosts: Post[] = [];
  filtered$ = new BehaviorSubject<Post[]>([]);
  private sub = new Subscription();
  private lastQuery = '';

  editing = new Map<number, boolean>();
  editForms = new Map<number, FormGroup>();

  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.loading = true;
    const loadSub = this.api.getPosts().pipe(
      tap(() => { this.error = null; }),
      catchError(err => {
        this.error = 'Failed to load posts';
        console.error(err);
        return of([] as Post[]);
      })
    ).subscribe(posts => {
      this.allPosts = Array.isArray(posts) ? posts : [];
      this.filtered$.next([]);
      this.loading = false;
    });
    this.sub.add(loadSub);

    const qSub = this.query.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => { this.error = null; }),
      switchMap(q => {
        const text = (q || '').toString().trim().toLowerCase();
        this.lastQuery = text;
        if (!text) return of([] as Post[]);
        const result = this.allPosts.filter(p =>
          (p.title || '').toLowerCase().includes(text) ||
          (p.body || '').toLowerCase().includes(text)
        );
        return of(result);
      }),
      catchError(err => {
        console.error(err);
        return of([] as Post[]);
      })
    ).subscribe(results => this.filtered$.next(results));
    this.sub.add(qSub);
  }

  clear(): void {
    this.query.setValue('');
  }

  startEdit(post: Post): void {
    this.editing.set(post.id, true);
    const fg = this.fb.group({
      title: [post.title || '', Validators.required],
      body: [post.body || '']
    });
    this.editForms.set(post.id, fg);
  }

  cancelEdit(id: number): void {
    this.editing.set(id, false);
    this.editForms.delete(id);
  }

  saveEdit(post: Post): void {
    const fg = this.editForms.get(post.id);
    if (!fg || fg.invalid) return;
    const { title, body } = fg.value;

    const idx = this.allPosts.findIndex(p => p.id === post.id);
    if (idx > -1) this.allPosts[idx] = { ...this.allPosts[idx], title, body };

    const current = this.filtered$.getValue().map(p => p.id === post.id ? { ...p, title, body } : p);
    this.filtered$.next(current);

    if (typeof this.api.updatePost === 'function') {
      this.api.updatePost(post.id, { title, body }).pipe(
        catchError((err: unknown) => {
          console.error('Update failed', err);
          this.error = 'Failed to save changes';
          return of(null);
        })
      ).subscribe();
    }

    this.cancelEdit(post.id);
  }

  highlight(text?: string): string {
    if (!text) return '';
    const q = this.lastQuery;
    if (!q) return this.escapeHtml(text);
    const escapeForRegExp = (s: string): string => {
      const specials = new Set(['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\', '/']);
      let out = '';
      for (const ch of s) out += specials.has(ch) ? '\\' + ch : ch;
      return out;
    };
    const esc = escapeForRegExp(q);
    const re = new RegExp(esc, 'ig');
    return this.escapeHtml(text).replace(re, match => `<span class="hl">${match}</span>`);
  }

  private escapeHtml(s: string): string {
    return s
      .split('&').join('&amp;')
      .split('<').join('&lt;')
      .split('>').join('&gt;')
      .split('"').join('&quot;')
      .split("'").join('&#39;');
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.filtered$.complete();
    this.editForms.clear();
    this.editing.clear();
  }
}
