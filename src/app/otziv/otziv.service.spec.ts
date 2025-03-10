import { TestBed } from '@angular/core/testing';

import { OtzivService } from './otziv.service';

describe('OtzivService', () => {
  let service: OtzivService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OtzivService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
