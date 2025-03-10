import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from '../user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      имя_пользователя: ['', Validators.required],
      электронная_почта: ['', [Validators.required, Validators.email]],
      пароль: ['', Validators.required]
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault(); // Предотвращаем стандартное поведение формы

    if (this.registerForm.valid) {
      const { имя_пользователя, электронная_почта, пароль } = this.registerForm.value;
      const userData: User = { 
        имя_пользователя, 
        электронная_почта, 
        пароль, 
        роль: 'user'
      };
      this.authService.register(userData).subscribe({
        next: response => {
          console.log('Registration successful:', response);
          this.router.navigate(['/home']);
        },
        error: error => {
          console.error('Registration error:', error);
        }
      });
    }
  }

  seedDatabase(): void {
    this.authService.seedDatabase().subscribe({
      next: response => {
        console.log('Database seeded successfully:', response);
      },
      error: error => {
        console.error('Database seeding error:', error);
      }
    });
  }
}