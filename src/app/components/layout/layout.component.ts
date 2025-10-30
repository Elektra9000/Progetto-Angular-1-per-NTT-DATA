import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MATERIAL } from '../../material/material.module';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MATERIAL],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  private router = inject(Router);

  logout(): void {
    sessionStorage.removeItem('gorest_token');
    this.router.navigate(['/']);
  }
}
