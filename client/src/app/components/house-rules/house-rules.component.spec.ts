import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseRulesComponent } from './house-rules.component';

describe('HouseRulesComponent', () => {
  let component: HouseRulesComponent;
  let fixture: ComponentFixture<HouseRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseRulesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HouseRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
