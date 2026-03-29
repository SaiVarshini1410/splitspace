import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoresComponent } from './chores.component';

describe('ChoresComponent', () => {
  let component: ChoresComponent;
  let fixture: ComponentFixture<ChoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
