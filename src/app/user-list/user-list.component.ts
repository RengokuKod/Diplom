import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService, TableData, TableConfig } from './user.service';
import { AuthService } from '../auth/auth.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit, OnDestroy {
  tables: string[] = [
    'users', 'category', 'product', 'opisanie', 'postavshik', 'otziv',
    'vopros', 'contact', 'corzina', 'zakaz', 'izbran'
  ];
  currentTable: string = 'users';
  tableData: TableData[] = [];
  tableConfig: TableConfig = { fields: [], displayNames: [], types: [], enums: {} };
  isDownloading: boolean = false;
  downloadMessage: string = '';
  downloadProgress: number = 0;
  totalImages: number = 0;
  completedImages: number = 0;
  errorImages: number = 0;
  showModal: boolean = false;
  isEditMode: boolean = false;
  currentRecord: any = null;
  form: FormGroup;
  errorMessage: string = '';
  testResults: TestResult[] = [];
  showTestResults: boolean = false;
  isTesting: boolean = false;
  private progressSubscription?: Subscription;
  private testUserId?: number;
  private testProductId?: number;
  private testUsername: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.errorMessage = 'Доступ запрещен: требуется роль администратора';
      console.error(this.errorMessage);
      return;
    }
  }

  switchTable(table: string): void {
    if (this.isTesting) return;
    this.currentTable = table;
    this.errorMessage = '';
    this.tableData = [];
    this.tableConfig = { fields: [], displayNames: [], types: [], enums: {} };
    this.showTestResults = false;
    this.loadTableData(table);
  }

  loadTableData(table: string): void {
    if (this.isTesting) return;
    this.userService.getTableData(table).subscribe({
      next: (response: { success: boolean, data: TableData[], config: TableConfig }) => {
        if (!response.success) {
          this.errorMessage = `Сервер вернул ошибку для таблицы ${table}`;
          return;
        }
        this.tableData = response.data.map(item => {
          const photoField = item['фото'] || item['photo'] || item['photo_folder'];
          const photoPath = photoField ? this.normalizePhotoPath(photoField, table) : '/assets/default-product.jpg';
          return { ...item, фото: photoPath };
        });
        this.tableConfig = response.config;
        this.initializeForm();
        this.errorMessage = response.data.length === 0 ? `Таблица ${table} пуста` : '';
      },
      error: (error: any) => {
        this.errorMessage = `Ошибка при загрузке данных таблицы ${table}: ${error.message || 'Неизвестная ошибка'}`;
      }
    });
  }

  private normalizePhotoPath(photo: string | null | undefined, table: string): string {
    if (!photo || photo.trim() === '' || photo === '/invalid') {
      return '/assets/default-product.jpg';
    }
    if (photo.startsWith('/assets/') || photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    return `/assets/${table}/${photo}`;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/assets/default-product.jpg';
  }

  initializeForm(record: any = null): void {
    const controls: { [key: string]: any } = {};
    this.tableConfig.fields.forEach((field, index) => {
      const type = this.tableConfig.types[index];
      let value = record ? record[field] : '';
      let validators = [];

      if (field === 'id' && !record) return;
      if (!['id', 'дата_создания', 'дата_обновления', 'Рэйтинг', 'отзывов', 'вопросов', 'пользователь_id', 'продукт_id', 'поставщик', 'category_name'].includes(field)) {
        validators.push(Validators.required);
      }
      if (type === 'email') validators.push(Validators.email);
      if (type === 'number' || type === 'decimal') validators.push(Validators.min(0));
      if (field === 'пароль' && !record) validators.push(Validators.minLength(6));

      controls[field] = [value, validators];
    });
    this.form = this.fb.group(controls);
  }

  openCreateModal(): void {
    if (this.isTesting) return;
    this.isEditMode = false;
    this.currentRecord = null;
    this.initializeForm();
    this.showModal = true;
  }

  openEditModal(record: any): void {
    if (this.isTesting) return;
    this.isEditMode = true;
    this.currentRecord = record;
    this.initializeForm(record);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.form.reset();
  }

  saveRecord(): void {
    if (this.isTesting || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.value;
    const request = this.isEditMode && this.currentRecord
      ? this.userService.updateRecord(this.currentTable, this.currentRecord.id, data)
      : this.userService.createRecord(this.currentTable, data);

    request.subscribe({
      next: () => {
        this.loadTableData(this.currentTable);
        this.closeModal();
        alert(`Запись успешно ${this.isEditMode ? 'обновлена' : 'создана'}`);
      },
      error: (error: any) => {
        alert(`Ошибка при ${this.isEditMode ? 'обновлении' : 'создании'}: ${error.message || 'Неизвестная ошибка'}`);
      }
    });
  }

  deleteRecord(id: number): void {
    if (this.isTesting) return;
    const record = this.tableData.find(r => r.id === id);
    if (this.currentTable === 'users' && record && record['роль'] === 'admin') {
      alert('Нельзя удалить пользователя с ролью администратора');
      return;
    }
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
      this.userService.deleteRecord(this.currentTable, id).subscribe({
        next: () => {
          this.loadTableData(this.currentTable);
          alert('Запись успешно удалена');
        },
        error: (error: any) => {
          alert(`Ошибка при удалении: ${error.message || 'Неизвестная ошибка'}`);
        }
      });
    }
  }

  migrateDatabase(): void {
    if (this.isTesting) return;
    this.authService.migrateDatabase().subscribe({
      next: (response: { message: string }) => {
        this.loadTableData(this.currentTable);
        alert(response.message);
      },
      error: (error: any) => {
        alert('Ошибка миграции базы данных');
      }
    });
  }

  seedDatabase(): void {
    if (this.isTesting) return;
    this.authService.seedDatabase().subscribe({
      next: (response: { message: string }) => {
        this.loadTableData(this.currentTable);
        alert(response.message);
      },
      error: (error: any) => {
        alert('Ошибка заполнения базы данных');
      }
    });
  }

  downloadProductImages(): void {
    if (this.isTesting) return;
    this.isDownloading = true;
    this.downloadProgress = 0;
    this.completedImages = 0;
    this.errorImages = 0;
    this.downloadMessage = 'Подготовка к скачиванию изображений...';

    this.userService.initiateImageDownload().subscribe({
      next: (response: any) => {
        this.totalImages = response.total || 0;
        this.downloadMessage = `Скачивание ${this.totalImages} изображений начато...`;

        this.progressSubscription = interval(2000).pipe(
          switchMap(() => this.userService.getDownloadProgress()),
          takeWhile(() => this.isDownloading, true)
        ).subscribe({
          next: (progress: any) => {
            this.completedImages = progress.completed || 0;
            this.errorImages = progress.errors || 0;
            this.downloadProgress = this.totalImages > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
            this.downloadMessage = `Скачано ${progress.completed} из ${progress.total} изображений...`;

            if (progress.completed >= progress.total) {
              this.finishDownload('Все изображения успешно скачаны!');
            }
          },
          error: (error: any) => {
            this.finishDownload(`Ошибка при проверке прогресса: ${error.message || 'Неизвестная ошибка'}`);
          }
        });
      },
      error: (error: any) => {
        this.finishDownload(`Ошибка при скачивании: ${error.message || 'Неизвестная ошибка'}`);
      }
    });
  }

  exportToExcel(): void {
    if (this.isTesting) return;
    this.authService.exportToExcel().subscribe({
      next: (response: { message: string }) => {
        alert('Данные экспортированы в Excel');
      },
      error: (error: any) => {
        alert('Ошибка при экспорте данных');
      }
    });
  }

  private finishDownload(message: string): void {
    this.isDownloading = false;
    this.downloadMessage = message;
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
    setTimeout(() => {
      this.downloadMessage = '';
    }, 5000);
  }

  async runTests(): Promise<void> {
    this.isTesting = true;
    this.testResults = [];
    this.showTestResults = true;

    // Test database connectivity
    try {
      await this.http.get('http://localhost:3000/api/ping', { params: { dryRun: 'true' } }).toPromise();
      this.testResults.push({ name: 'Подключение к базе данных', passed: true });
    } catch (error: any) {
      this.testResults.push({ name: 'Подключение к базе данных', passed: false, error: error.message || 'Неизвестная ошибка' });
    }

    // Test table accessibility
    for (const table of this.tables) {
      try {
        const response = await this.userService.getTableDataDryRun(table).toPromise();
        this.testResults.push({ name: `Доступ к таблице: ${table}`, passed: response ? !!response.success : false });
      } catch (error: any) {
        this.testResults.push({ name: `Доступ к таблице: ${table}`, passed: false, error: error.message || 'Неизвестная ошибка' });
      }
    }

    // Test CRUD operations in dry-run mode
    const testData = {
      имя_пользователя: `testuser_${Date.now()}`,
      электронная_почта: `test${Date.now()}@example.com`,
      пароль: 'Test@123456',
      роль: 'user'
    };
    try {
      await this.userService.createRecordDryRun('users', testData).toPromise();
      this.testResults.push({ name: 'Создание записи (users)', passed: true });
    } catch (error: any) {
      this.testResults.push({ name: 'Создание записи (users)', passed: false, error: error.message || 'Неизвестная ошибка' });
    }

    try {
      await this.userService.updateRecordDryRun('users', 9999, testData).toPromise();
      this.testResults.push({ name: 'Обновление записи (users)', passed: true });
    } catch (error: any) {
      this.testResults.push({ name: 'Обновление записи (users)', passed: false, error: error.message || 'Неизвестная ошибка' });
    }

    try {
      await this.userService.deleteRecordDryRun('users', 9999).toPromise();
      this.testResults.push({ name: 'Удаление записи (users)', passed: true });
    } catch (error: any) {
      this.testResults.push({ name: 'Удаление записи (users)', passed: false, error: error.message || 'Неизвестная ошибка' });
    }

    

    // Test page existence
    const pages = [
      'home', 'about', 'contact', 'register', 'signup', 'login', 'otzivs',
      'categories', 'corzina', 'zakaz', 'products', 'weather', 'postavshik',
      'izbran', 'opisanie', 'vopros'
    ];
    for (const page of pages) {
      try {
        await this.http.get(`/${page}`, { responseType: 'text' }).toPromise();
        this.testResults.push({ name: `Доступность страницы: ${page}`, passed: true });
      } catch (error: any) {
        this.testResults.push({ name: `Доступность страницы: ${page}`, passed: false, error: error.message || 'Неизвестная ошибка' });
      }
    }

    this.isTesting = false;
  }

  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }
}