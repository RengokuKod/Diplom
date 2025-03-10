import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IzbranComponent } from './izbran.component';

describe('IzbranComponent', () => {
  let component: IzbranComponent;
  let fixture: ComponentFixture<IzbranComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IzbranComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IzbranComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
