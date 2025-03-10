import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtzivComponent } from './otziv.component';

describe('OtzivComponent', () => {
  let component: OtzivComponent;
  let fixture: ComponentFixture<OtzivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtzivComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtzivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
