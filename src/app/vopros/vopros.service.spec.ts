import { TestBed } from '@angular/core/testing';

import { VoprosService } from './vopros.service';

describe('VoprosService', () => {
  let service: VoprosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoprosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
