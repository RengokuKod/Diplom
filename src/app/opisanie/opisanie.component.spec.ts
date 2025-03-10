import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpisanieComponent } from './opisanie.component';

describe('OpisanieComponent', () => {
  let component: OpisanieComponent;
  let fixture: ComponentFixture<OpisanieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpisanieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpisanieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
