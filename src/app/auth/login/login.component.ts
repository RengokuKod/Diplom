import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      имя_пользователя: ['', Validators.required],
      пароль: ['', Validators.required],
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault(); // Предотвращаем стандартное поведение формы

    if (this.loginForm.valid) {
      const { имя_пользователя, пароль } = this.loginForm.value;
      this.authService.login(имя_пользователя, пароль).subscribe({
        next: response => {
          console.log('Login successful:', response);
          this.router.navigate(['/home']);
        },
        error: error => {
          console.error('Login error:', error);
        }
      });
    }
  }
}