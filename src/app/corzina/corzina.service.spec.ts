import { TestBed } from '@angular/core/testing';

import { CorzinaService } from './corzina.service';

describe('CorzinaService', () => {
  let service: CorzinaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CorzinaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
