import { TestBed } from '@angular/core/testing';

import { ZakazService } from './zakaz.service';

describe('ZakazService', () => {
  let service: ZakazService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZakazService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
