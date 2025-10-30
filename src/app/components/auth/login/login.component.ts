import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MATERIAL } from '../../../material/material.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MATERIAL],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  tokenControl = new FormControl('', { validators: [Validators.required], nonNullable: true });

  private router = inject(Router);

  enter(): void {
    if (this.tokenControl.invalid) return;
    const token = (this.tokenControl.value as string).trim();
    sessionStorage.setItem('gorest_token', token);
    this.router.navigate(['/home']);
  }
}
