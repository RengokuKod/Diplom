import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TestResultsComponent } from './test-results.component';
import { UserModule } from './user.module';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: UserService;
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserModule,
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [UserService, AuthService]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(authService, 'isAdmin').and.returnValue(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load table data on init', fakeAsync(() => {
    const mockResponse = {
      success: true,
      data: [{ id: 1, name: 'Test' }],
      config: { fields: ['id', 'name'], displayNames: ['ID', 'Name'], types: ['number', 'text'], enums: {} }
    };
    spyOn(userService, 'getTableData').and.returnValue(of(mockResponse));
    component.ngOnInit();
    tick();
    expect(component.tableData).toEqual([{ id: 1, name: 'Test', фото: '/assets/default-product.jpg' }]);
    expect(component.tableConfig).toEqual(mockResponse.config);
  }));

  it('should switch table and load data', fakeAsync(() => {
    const mockResponse = {
      success: true,
      data: [{ id: 1, title: 'Category' }],
      config: { fields: ['id', 'title'], displayNames: ['ID', 'Title'], types: ['number', 'text'], enums: {} }
    };
    spyOn(userService, 'getTableData').and.returnValue(of(mockResponse));
    component.switchTable('category');
    tick();
    expect(component.currentTable).toBe('category');
    expect(component.tableData).toEqual([{ id: 1, title: 'Category', фото: '/assets/default-product.jpg' }]);
  }));

  it('should open create modal', () => {
    component.openCreateModal();
    expect(component.showModal).toBeTrue();
    expect(component.isEditMode).toBeFalse();
    expect(component.currentRecord).toBeNull();
  });

  it('should save new record', fakeAsync(() => {
    spyOn(userService, 'createRecord').and.returnValue(of({}));
    component.currentTable = 'users';
    component.tableConfig = {
      fields: ['name'],
      displayNames: ['Name'],
      types: ['text'],
      enums: {}
    };
    component.initializeForm();
    component.form.setValue({ name: 'Test User' });
    component.saveRecord();
    tick();
    expect(userService.createRecord).toHaveBeenCalledWith('users', { name: 'Test User' });
    expect(component.showModal).toBeFalse();
  }));

  it('should update existing record', fakeAsync(() => {
    spyOn(userService, 'updateRecord').and.returnValue(of({}));
    component.currentTable = 'users';
    component.tableConfig = {
      fields: ['name'],
      displayNames: ['Name'],
      types: ['text'],
      enums: {}
    };
    component.isEditMode = true;
    component.currentRecord = { id: 1 };
    component.initializeForm({ name: 'Old User' });
    component.form.setValue({ name: 'New User' });
    component.saveRecord();
    tick();
    expect(userService.updateRecord).toHaveBeenCalledWith('users', 1, { name: 'New User' });
    expect(component.showModal).toBeFalse();
  }));

  it('should delete record', fakeAsync(() => {
    spyOn(userService, 'deleteRecord').and.returnValue(of({}));
    spyOn(window, 'confirm').and.returnValue(true);
    component.currentTable = 'users';
    component.deleteRecord(1);
    tick();
    expect(userService.deleteRecord).toHaveBeenCalledWith('users', 1);
  }));

  it('should run tests and display results', fakeAsync(() => {
    spyOn(authService, 'register').and.returnValue(of({ userId: 1 }));
    spyOn(authService, 'login').and.returnValue(of({ success: true }));
    spyOn(authService, 'migrateDatabase').and.returnValue(of({ message: 'Migrated' }));
    spyOn(authService, 'seedDatabase').and.returnValue(of({ message: 'Seeded' }));
    spyOn(authService, 'exportToExcel').and.returnValue(of({ message: 'Exported' }));
    spyOn(userService, 'getTableData').and.returnValue(of({
      success: true,
      data: [{ id: 1 }],
      config: { fields: ['id'], displayNames: ['ID'], types: ['number'], enums: {} }
    }));
    spyOn(userService, 'createRecord').and.returnValue(of({ id: 1 }));
    spyOn(userService, 'updateRecord').and.returnValue(of({}));
    spyOn(userService, 'deleteRecord').and.returnValue(of({}));

    const pingRequest = httpMock.expectOne('http://localhost:3000/api/ping');
    pingRequest.flush({ success: true });

    const searchRequest = httpMock.expectOne('http://localhost:3000/api/products/search?query=Test%20Product');
    searchRequest.flush([]);

    const discountedRequest = httpMock.expectOne('http://localhost:3000/api/products/discounted');
    discountedRequest.flush({ data: [] });

    const topRatedRequest = httpMock.expectOne('http://localhost:3000/api/products/top-rated');
    topRatedRequest.flush({ data: [] });

    component.runTests();
    tick(1000);

    expect(component.testResults.length).toBeGreaterThan(0);
    expect(component.showTestResults).toBeTrue();
    expect(component.testResults.some(result => result.name.includes('Поиск продуктов'))).toBeTrue();
  }));
});