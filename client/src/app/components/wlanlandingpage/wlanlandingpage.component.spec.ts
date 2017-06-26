import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WlanlandingpageComponent } from './wlanlandingpage.component';

describe('WlanlandingpageComponent', () => {
  let component: WlanlandingpageComponent;
  let fixture: ComponentFixture<WlanlandingpageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WlanlandingpageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WlanlandingpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
