import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],

})
export class ContactComponent implements OnInit, OnDestroy {
  reviews: any[] = [];
  currentPosition = 0;
  animationId: number | null = null;
  lastUpdate = 0;
  private isBrowser: boolean;
  contactForm: FormGroup;
  showSuccess = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private fb: FormBuilder
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadRandomReviews();
    if (this.isBrowser) {
      this.startAnimation();
    }
  }

  ngOnDestroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  onSubmit() {
    if (this.contactForm.valid) {
        this.http.post('http://localhost:3000/api/contact', this.contactForm.value)
            .subscribe({
                next: () => {
                    this.showSuccess = true;
                    this.contactForm.reset();
                    setTimeout(() => {
                        this.showSuccess = false;
                        // Прокрутка к форме вместо нижней части страницы
                        const formElement = document.querySelector('.contact-form');
                        if (formElement) {
                            formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 3000);
                },
                error: (err) => {
                    console.error('Ошибка отправки формы:', err);
                }
            });
    }
  }

  startAnimation() {
    const animate = (timestamp: number) => {
      if (timestamp - this.lastUpdate > 50) {
        this.currentPosition -= 3;
        
        if (Math.abs(this.currentPosition) > this.reviews.length * 300) {
          this.currentPosition = 0;
        }
        
        this.lastUpdate = timestamp;
      }
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  loadRandomReviews() {
    this.http.get<any[]>('http://localhost:3000/api/otzivs').subscribe(
      data => {
        this.reviews = this.shuffleArray(data).slice(0, 35);
        this.reviews = [...this.reviews, ...this.reviews];
      },
      error => {
        console.error('Ошибка загрузки отзывов:', error);
        this.reviews = this.generateFallbackReviews(35);
        this.reviews = [...this.reviews, ...this.reviews];
      }
    );
  }

  private shuffleArray(array: any[]): any[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  private generateFallbackReviews(count: number): any[] {
    const fallbackReviews = [
      { username: 'Василий Перышкин', comment: 'Отличный магазин с большим выбором!' },
      { username: 'Куриян Роман', comment: 'NetworkWeb - рай для любителей техники!' },
      { username: 'Иванова Мария', comment: 'Быстрая доставка, качественный товар.' },
      { username: 'Петров Алексей', comment: 'Хорошие цены и отличное обслуживание.' },
      { username: 'Сидорова Ольга', comment: 'Понравился ассортимент и консультация.' },
      { username: 'Смирнов Дмитрий', comment: 'Быстро ответили на все вопросы.' },
      { username: 'Козлова Анна', comment: 'Товар соответствует описанию.' },
      { username: 'Николаев Иван', comment: 'Удобный сайт, легко найти нужное.' }
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      const review = {...fallbackReviews[i % fallbackReviews.length]};
      if (i >= fallbackReviews.length) {
        review.username = `${review.username} ${Math.floor(i / fallbackReviews.length) + 1}`;
      }
      result.push(review);
    }
    
    return this.shuffleArray(result);
  }
}