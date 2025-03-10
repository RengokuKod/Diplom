import { TestBed } from '@angular/core/testing';

import { PostavshikService } from './postavshik.service';

describe('PostavshikService', () => {
  let service: PostavshikService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostavshikService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
