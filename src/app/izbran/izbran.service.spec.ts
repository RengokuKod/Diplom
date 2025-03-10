import { TestBed } from '@angular/core/testing';

import { IzbranService } from './izbran.service';

describe('IzbranService', () => {
  let service: IzbranService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IzbranService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
