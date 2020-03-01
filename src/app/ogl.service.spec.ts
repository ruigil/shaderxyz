import { TestBed } from '@angular/core/testing';

import { OGLService } from './ogl.service';

describe('OGLService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OGLService = TestBed.get(OGLService);
    expect(service).toBeTruthy();
  });
});
