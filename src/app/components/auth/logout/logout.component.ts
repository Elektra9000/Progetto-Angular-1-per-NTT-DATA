import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MATERIAL } from '../../../material/material.module';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule, MATERIAL],
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {
  countdown = 3;
  message = 'You have been signed out. Redirecting to login...';

  private router = inject(Router);

  ngOnInit(): void {
    sessionStorage.removeItem('gorest_token');

    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.router.navigate(['/']);
      }
    }, 1000);
  }

  goToLogin(): void {
    this.router.navigate(['/']);
  }
}
