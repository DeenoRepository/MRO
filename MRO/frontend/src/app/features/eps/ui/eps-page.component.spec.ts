import { fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { EpsPageComponent } from './eps-page.component';
import { EpsService } from '../data/eps.service';
import { Equipment } from '../data/eps.models';

describe('EpsPageComponent reactive registry loader', () => {
  const equipmentFixture: Equipment = {
    id: 'eq-1',
    assetTag: 'EQ-1',
    name: 'Pump 1',
    category: 'PUMP',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  function createComponentWithService(service: EpsService): EpsPageComponent {
    return new EpsPageComponent(new FormBuilder(), service);
  }

  it('debounces search input before triggering registry request', fakeAsync(() => {
    const registryCalls: string[] = [];
    const epsService = {
      getEquipment: jasmine.createSpy().and.returnValue(of({ data: [equipmentFixture], meta: {}, errors: [] })),
      getChangeRequestsCached: jasmine.createSpy().and.returnValue(of({ data: [], meta: {}, errors: [] })),
      getEquipmentRegistryPage: jasmine.createSpy().and.callFake((params: { query?: string }) => {
        registryCalls.push(params.query ?? '');
        return of({
          data: { items: [equipmentFixture], page: 0, size: 20, totalItems: 1, totalPages: 1 },
          meta: {},
          errors: []
        });
      })
    } as unknown as EpsService;

    const component = createComponentWithService(epsService);
    component.ngOnInit();
    tick();

    const callsBeforeSearch = registryCalls.length;
    component.onSearchInput('p');
    component.onSearchInput('pu');
    component.onSearchInput('pump');
    tick(299);
    expect(registryCalls.length).toBe(callsBeforeSearch);

    tick(1);
    expect(registryCalls.length).toBe(callsBeforeSearch + 1);
    expect(registryCalls[registryCalls.length - 1]).toBe('pump');
  }));

  it('applies only latest registry response when requests overlap', fakeAsync(() => {
    const subjectsByQuery = new Map<string, Subject<{ data: { items: Equipment[]; page: number; size: number; totalItems: number; totalPages: number }; meta: Record<string, never>; errors: unknown[] }>>();
    const epsService = {
      getEquipment: jasmine.createSpy().and.returnValue(of({ data: [equipmentFixture], meta: {}, errors: [] })),
      getChangeRequestsCached: jasmine.createSpy().and.returnValue(of({ data: [], meta: {}, errors: [] })),
      getEquipmentRegistryPage: jasmine.createSpy().and.callFake((params: { query?: string }) => {
        const key = params.query ?? '';
        const subject = new Subject<{ data: { items: Equipment[]; page: number; size: number; totalItems: number; totalPages: number }; meta: Record<string, never>; errors: unknown[] }>();
        subjectsByQuery.set(key, subject);
        return subject.asObservable();
      })
    } as unknown as EpsService;

    const component = createComponentWithService(epsService);
    component.ngOnInit();
    tick();

    component.onSearchInput('old');
    tick(300);
    component.onSearchInput('new');
    tick(300);

    subjectsByQuery.get('old')?.next({
      data: {
        items: [{ ...equipmentFixture, id: 'old-id', assetTag: 'OLD' }],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1
      },
      meta: {},
      errors: []
    });
    tick();
    expect(component.paginatedEquipment.find((e) => e.id === 'old-id')).toBeUndefined();

    subjectsByQuery.get('new')?.next({
      data: {
        items: [{ ...equipmentFixture, id: 'new-id', assetTag: 'NEW' }],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1
      },
      meta: {},
      errors: []
    });
    tick();
    expect(component.paginatedEquipment[0].id).toBe('new-id');
  }));
});
