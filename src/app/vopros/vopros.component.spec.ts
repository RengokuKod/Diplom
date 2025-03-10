import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoprosComponent } from './vopros.component';

describe('VoprosComponent', () => {
  let component: VoprosComponent;
  let fixture: ComponentFixture<VoprosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoprosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoprosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
