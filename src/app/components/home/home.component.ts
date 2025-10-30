import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MATERIAL } from '../../material/material.module';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MATERIAL],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {}
