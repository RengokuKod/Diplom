import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from '@angular/router';
import { UserModule } from './user-list/user.module';
@Component({
  standalone:true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive,UserModule]
})
export class AppComponent {
  title = 'Diplom';
}
