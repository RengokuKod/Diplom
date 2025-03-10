import { TestBed } from '@angular/core/testing';

import { OpisanieService } from './opisanie.service';

describe('OpisanieService', () => {
  let service: OpisanieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpisanieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
