import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxCachr } from './ngx-cachr';

describe('NgxCachr', () => {
  let component: NgxCachr;
  let fixture: ComponentFixture<NgxCachr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxCachr]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxCachr);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
