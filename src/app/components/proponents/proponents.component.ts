import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MATERIAL } from '../../material/material.module';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-proponents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './proponents.component.html',
  styleUrls: ['./proponents.component.css'],
})
export class ProponentsComponent implements OnInit {
  users: User[] = [];
  filtered: User[] = [];
  paginatedUsers: User[] = [];
  page = 1;
  pageSize = 7;
  searchTerm = '';
  form: FormGroup;
  window = window;

  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: ['female', Validators.required],
      status: ['active', Validators.required],
    });
  }

  ngOnInit(): void {
    this.api.getUsers().subscribe((data) => {
      this.users = data.map((u) => ({ ...u, role: '' }));
      this.filtered = [...this.users];
      this.updatePagination();
    });
  }

  updatePagination(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsers = this.filtered.slice(start, end);
  }

  onSearchTerm(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.filtered = this.users.filter((u) => u.name.toLowerCase().includes(this.searchTerm));
    this.page = 1;
    this.updatePagination();
  }

  goToPage(p: number): void {
    this.page = p;
    this.updatePagination();
  }

  addUser(): void {
    if (this.form.valid) {
      const newUser: User = { id: Date.now(), ...this.form.value };
      this.users.unshift(newUser);
      this.filtered = this.searchTerm.trim() === ''
        ? [...this.users]
        : this.users.filter((u) => u.name.toLowerCase().includes(this.searchTerm));
      this.page = 1;
      this.updatePagination();
      this.form.reset({ gender: 'female' });
    }
  }

  removeUser(id: number): void {
    this.users = this.users.filter((u) => u.id !== id);
    this.onSearchTerm(this.searchTerm);
  }
}
