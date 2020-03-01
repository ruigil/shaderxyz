import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShaderListComponent } from './shader-list.component';

describe('ShaderListComponent', () => {
  let component: ShaderListComponent;
  let fixture: ComponentFixture<ShaderListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShaderListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShaderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
