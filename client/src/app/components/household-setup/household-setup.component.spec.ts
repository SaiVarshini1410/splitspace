import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseholdSetupComponent } from './household-setup.component';

describe('HouseholdSetupComponent', () => {
  let component: HouseholdSetupComponent;
  let fixture: ComponentFixture<HouseholdSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseholdSetupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HouseholdSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
