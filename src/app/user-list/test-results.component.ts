import { Component, Input } from '@angular/core';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

@Component({
  selector: 'app-test-results',
  template: `
    <div class="test-results-container">
      <h2>Результаты тестов</h2>
      <ul class="test-results-list">
        <li *ngFor="let result of results" [ngClass]="{'passed': result.passed, 'failed': !result.passed}">
          <span class="test-status">{{ result.passed ? '✔' : '✘' }}</span>
          <span class="test-name">{{ result.name }}</span>
          <span class="test-error" *ngIf="result.error">{{ result.error }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .test-results-container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
      margin-top: 24px;
    }
    .test-results-container h2 {
      font-size: 1.5rem;
      color: #2c3e50;
      margin-bottom: 16px;
    }
    .test-results-list {
      list-style: none;
    }
    .test-results-list li {
      display: flex;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .passed .test-status {
      color: #4caf50;
      font-size: 24px;
      margin-right: 12px;
    }
    .failed .test-status {
      color: #ff4444;
      font-size: 24px;
      margin-right: 12px;
    }
    .test-name {
      flex-grow: 1;
      font-size: 16px;
      color: #333;
    }
    .test-error {
      font-size: 14px;
      color: #ff4444;
      margin-left: 12px;
    }
  `]
})
export class TestResultsComponent {
  @Input() results: TestResult[] = [];
}